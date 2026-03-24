package com.assettrack.controller;

import com.assettrack.dto.ProfileUpdateRequestDTO;
import com.assettrack.dto.ProfileUpdateReviewDTO;
import com.assettrack.model.ProfileUpdateRequest;
import com.assettrack.service.ProfileUpdateRequestService;
import com.assettrack.service.UserRoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile-update-requests")
public class ProfileUpdateRequestController {
    private final ProfileUpdateRequestService requestService;
    private final UserRoleService userRoleService;

    public ProfileUpdateRequestController(ProfileUpdateRequestService requestService,
                                          UserRoleService userRoleService) {
        this.requestService = requestService;
        this.userRoleService = userRoleService;
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody ProfileUpdateRequestDTO dto,
                                           @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        if (userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only employees can submit profile update requests"));
        }
        if (dto.getEmployeeEmail() != null && !email.equalsIgnoreCase(dto.getEmployeeEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Employee email does not match authenticated user"));
        }

        dto.setEmployeeEmail(email);
        try {
            ProfileUpdateRequest created = requestService.createRequest(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
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
        return ResponseEntity.ok(requestService.getRequestsByEmployeeEmail(email));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<?> reviewRequest(@PathVariable UUID id,
                                           @RequestBody ProfileUpdateReviewDTO dto,
                                           @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        dto.setReviewedBy(email);
        try {
            ProfileUpdateRequest reviewed = requestService.reviewRequest(id, dto);
            return ResponseEntity.ok(reviewed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
