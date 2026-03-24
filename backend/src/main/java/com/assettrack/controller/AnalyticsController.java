package com.assettrack.controller;

import com.assettrack.dto.AlertDTO;
import com.assettrack.dto.DashboardSummaryDTO;
import com.assettrack.service.AnalyticsService;
import com.assettrack.service.UserRoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRoleService userRoleService;

    public AnalyticsController(AnalyticsService analyticsService, UserRoleService userRoleService) {
        this.analyticsService = analyticsService;
        this.userRoleService = userRoleService;
    }

    private boolean hasAdminAccess(String email) {
        return email != null && userRoleService.isAdmin(email);
    }

    private ResponseEntity<Map<String, String>> adminRequired() {
        return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/aging")
    public ResponseEntity<?> getAssetAging(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getAssetAging());
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartmentBreakdown(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getDepartmentBreakdown());
    }

    @GetMapping("/trends")
    public ResponseEntity<?> getStatusTrends(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getStatusTrends());
    }

    @GetMapping("/top-reassigned")
    public ResponseEntity<?> getTopReassigned(
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestParam(defaultValue = "5") int limit) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getTopReassigned(limit));
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts(@RequestHeader(value = "X-User-Email", required = false) String email) {
        if (!hasAdminAccess(email)) return adminRequired();
        return ResponseEntity.ok(analyticsService.getRiskAlerts());
    }
}
