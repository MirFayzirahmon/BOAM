package com.assettrack.controller;

import com.assettrack.dto.AssignRequest;
import com.assettrack.dto.AssignmentDTO;
import com.assettrack.service.AssignmentService;
import com.assettrack.service.UserRoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRoleService userRoleService;

    public AssignmentController(AssignmentService assignmentService, UserRoleService userRoleService) {
        this.assignmentService = assignmentService;
        this.userRoleService = userRoleService;
    }

    @GetMapping
    public ResponseEntity<List<AssignmentDTO>> getAssignments(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

        if (assetId != null) {
            return ResponseEntity.ok(assignmentService.getAssignmentsByAsset(assetId));
        }
        if (employeeId != null) {
            return ResponseEntity.ok(assignmentService.getActiveAssignmentsByEmployee(employeeId));
        }
        if (activeOnly) {
            return ResponseEntity.ok(assignmentService.getActiveAssignments());
        }
        return ResponseEntity.ok(assignmentService.getActiveAssignments());
    }

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getActiveCountsByEmployee() {
        return ResponseEntity.ok(assignmentService.getActiveCountsByEmployee());
    }

    @PostMapping("/{assetId}")
    public ResponseEntity<?> assignAsset(@PathVariable UUID assetId,
                                         @Valid @RequestBody AssignRequest request,
                                         @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        request.setAssignedBy(email);
        try {
            AssignmentDTO assignment = assignmentService.assignAsset(assetId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/return")
    public ResponseEntity<?> returnAsset(@PathVariable UUID id,
                                         @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            AssignmentDTO returned = assignmentService.returnAsset(id, email);
            return ResponseEntity.ok(returned);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count/{assetId}")
    public ResponseEntity<Long> countByAssetId(@PathVariable UUID assetId) {
        return ResponseEntity.ok(assignmentService.countByAssetId(assetId));
    }
}
