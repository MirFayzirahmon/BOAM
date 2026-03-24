package com.assettrack.controller;

import com.assettrack.dto.EmployeeDTO;
import com.assettrack.model.Employee;
import com.assettrack.service.EmployeeService;
import com.assettrack.service.UserRoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserRoleService userRoleService;

    public EmployeeController(EmployeeService employeeService, UserRoleService userRoleService) {
        this.employeeService = employeeService;
        this.userRoleService = userRoleService;
    }

    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployee(@PathVariable UUID id) {
        return employeeService.getEmployeeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyEmployeeProfile(
            @RequestHeader(value = "X-User-Email", required = false) String email
    ) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        Employee employee = employeeService.findOrCreateByEmail(email, null, null, null, null);
        return ResponseEntity.ok(employee);
    }

    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeDTO dto,
                                             @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            Employee created = employeeService.createEmployee(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable UUID id,
                                            @RequestBody EmployeeDTO dto,
                                            @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            Employee updated = employeeService.updateEmployee(id, dto);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable UUID id,
                                            @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteEmployee(@PathVariable UUID id,
                                            @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            Employee employee = employeeService.inviteEmployee(id, email);
            return ResponseEntity.ok(employee);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
