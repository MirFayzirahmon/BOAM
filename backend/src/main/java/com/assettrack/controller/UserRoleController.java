package com.assettrack.controller;

import com.assettrack.model.UserRole;
import com.assettrack.service.UserRoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user-role")
public class UserRoleController {

    private final UserRoleService userRoleService;

    public UserRoleController(UserRoleService userRoleService) {
        this.userRoleService = userRoleService;
    }

    @GetMapping
    public ResponseEntity<?> getRole(@RequestParam String email) {
        UserRole role = userRoleService.ensureRole(email);
        return ResponseEntity.ok(Map.of(
                "email", role.getEmail(),
                "role", role.getRole()
        ));
    }
}
