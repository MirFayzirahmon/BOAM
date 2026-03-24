package com.assettrack.service;

import com.assettrack.model.UserRole;
import com.assettrack.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final Set<String> bootstrapAdminEmails;

    public UserRoleService(
            UserRoleRepository userRoleRepository,
            @Value("${app.bootstrap-admin-emails:almalimir@proton.me}") String bootstrapAdminEmails
    ) {
        this.userRoleRepository = userRoleRepository;
        this.bootstrapAdminEmails = Arrays.stream(bootstrapAdminEmails.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    public String getRoleByEmail(String email) {
        if (email == null || email.isBlank()) {
            return "EMPLOYEE";
        }
        if (isBootstrapAdmin(email)) {
            return "ADMIN";
        }
        return userRoleRepository.findByEmail(email)
                .map(UserRole::getRole)
                .orElse("EMPLOYEE");
    }

    @Transactional
    public UserRole ensureRole(String email) {
        UserRole role = userRoleRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserRole created = new UserRole();
                    created.setEmail(email);
                    created.setRole(isBootstrapAdmin(email) ? "ADMIN" : "EMPLOYEE");
                    return created;
                });
        if (isBootstrapAdmin(email) && !"ADMIN".equals(role.getRole())) {
            role.setRole("ADMIN");
        }
        return userRoleRepository.save(role);
    }

    public boolean isAdmin(String email) {
        return "ADMIN".equals(getRoleByEmail(email));
    }

    private boolean isBootstrapAdmin(String email) {
        return email != null && bootstrapAdminEmails.contains(email.trim().toLowerCase());
    }
}
