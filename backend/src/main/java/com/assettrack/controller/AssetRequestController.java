package com.assettrack.controller;

import com.assettrack.dto.AssetRequestDTO;
import com.assettrack.dto.AssetRequestReviewDTO;
import com.assettrack.model.AssetRequest;
import com.assettrack.service.AssetRequestService;
import com.assettrack.service.UserRoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/asset-requests")
public class AssetRequestController {

    private final AssetRequestService requestService;
    private final UserRoleService userRoleService;

    public AssetRequestController(AssetRequestService requestService, UserRoleService userRoleService) {
        this.requestService = requestService;
        this.userRoleService = userRoleService;
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody AssetRequestDTO dto,
                                           @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        if (dto.getRequesterEmail() != null && !email.equalsIgnoreCase(dto.getRequesterEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Requester email does not match authenticated user"));
        }
        dto.setRequesterEmail(email);

        try {
            AssetRequest created = requestService.createRequest(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllRequests(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyRequests(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        return ResponseEntity.ok(requestService.getRequestsByEmail(email));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<?> reviewRequest(@PathVariable UUID id,
                                             @RequestBody AssetRequestReviewDTO dto,
                                             @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        dto.setReviewedBy(email);
        try {
            AssetRequest reviewed = requestService.reviewRequest(id, dto);
            return ResponseEntity.ok(reviewed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending-count")
    public ResponseEntity<?> getPendingCount(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(requestService.countPending());
    }
}
