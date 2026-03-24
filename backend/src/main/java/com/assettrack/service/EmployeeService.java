package com.assettrack.service;

import com.assettrack.dto.EmployeeDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.assettrack.model.Employee;
import com.assettrack.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmployeeService {
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING_INVITE = "PENDING_INVITE";
    private static final String DEFAULT_DEPARTMENT = "Unassigned";
    private static final String DEFAULT_BRANCH = "Unassigned";

    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${SUPABASE_URL:}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY:}")
    private String supabaseServiceRoleKey;

    @Value("${SUPABASE_INVITE_REDIRECT_TO:}")
    private String supabaseInviteRedirectTo;

    public EmployeeService(EmployeeRepository employeeRepository, ObjectMapper objectMapper) {
        this.employeeRepository = employeeRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAllByOrderByFullNameAsc();
    }

    public Optional<Employee> getEmployeeById(UUID id) {
        return employeeRepository.findById(id);
    }

    public Optional<Employee> getEmployeeByEmail(String email) {
        return employeeRepository.findByEmailIgnoreCase(email);
    }

    @Transactional
    public Employee findOrCreateByEmail(String email,
                                        String preferredFullName,
                                        String preferredPhone,
                                        String preferredDepartment,
                                        String preferredBranch) {
        String normalizedEmail = normalizeRequired(email, "Email");
        return employeeRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> {
                    Employee employee = new Employee();
                    employee.setEmail(normalizedEmail);
                    employee.setFullName(resolveFullName(normalizedEmail, preferredFullName));
                    employee.setPhone(normalizeOptional(preferredPhone));
                    employee.setDepartment(resolveDepartment(preferredDepartment));
                    employee.setBranch(resolveBranch(preferredBranch));
                    employee.setStatus(STATUS_ACTIVE);
                    return employeeRepository.save(employee);
                });
    }

    @Transactional
    public Employee createEmployee(EmployeeDTO dto) {
        String normalizedEmail = normalizeRequired(dto.getEmail(), "Email");
        if (employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Employee with this email already exists");
        }

        Employee employee = new Employee();
        employee.setFullName(normalizeRequired(dto.getFullName(), "Full name"));
        employee.setEmail(normalizedEmail);
        employee.setPhone(normalizeOptional(dto.getPhone()));
        employee.setDepartment(normalizeRequired(dto.getDepartment(), "Department"));
        employee.setBranch(normalizeRequired(dto.getBranch(), "Branch"));
        employee.setStatus(STATUS_ACTIVE);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(UUID id, EmployeeDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found"));

        String normalizedEmail = normalizeRequired(dto.getEmail(), "Email");
        if (!employee.getEmail().equalsIgnoreCase(normalizedEmail)
                && employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Employee with this email already exists");
        }

        employee.setFullName(normalizeRequired(dto.getFullName(), "Full name"));
        employee.setEmail(normalizedEmail);
        employee.setPhone(normalizeOptional(dto.getPhone()));
        employee.setDepartment(normalizeRequired(dto.getDepartment(), "Department"));
        employee.setBranch(normalizeRequired(dto.getBranch(), "Branch"));
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(UUID id) {
        if (!employeeRepository.existsById(id)) {
            throw new NoSuchElementException("Employee not found");
        }
        employeeRepository.deleteById(id);
    }

    @Transactional
    public Employee inviteEmployee(UUID id, String invitedByEmail) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found"));

        validateInviteConfiguration();
        sendSupabaseInvite(employee.getEmail());

        employee.setInvitedBy(invitedByEmail);
        employee.setInvitedAt(OffsetDateTime.now());
        employee.setStatus(STATUS_PENDING_INVITE);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee applyProfileUpdate(Employee employee,
                                       String fullName,
                                       String phone,
                                       String department,
                                       String branch) {
        if (fullName != null && !fullName.isBlank()) {
            employee.setFullName(fullName.trim());
        }
        if (phone != null && !phone.isBlank()) {
            employee.setPhone(phone.trim());
        }
        if (department != null && !department.isBlank()) {
            employee.setDepartment(department.trim());
        }
        if (branch != null && !branch.isBlank()) {
            employee.setBranch(branch.trim());
        }
        return employeeRepository.save(employee);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private String resolveFullName(String email, String preferredFullName) {
        String normalizedPreferred = normalizeOptional(preferredFullName);
        if (normalizedPreferred != null) {
            return normalizedPreferred;
        }

        String localPart = email;
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            localPart = email.substring(0, atIndex);
        }

        String fromEmail = localPart
                .replace('.', ' ')
                .replace('_', ' ')
                .replace('-', ' ')
                .trim();

        return fromEmail.isBlank() ? email : fromEmail;
    }

    private String resolveDepartment(String preferredDepartment) {
        String normalized = normalizeOptional(preferredDepartment);
        return normalized != null ? normalized : DEFAULT_DEPARTMENT;
    }

    private String resolveBranch(String preferredBranch) {
        String normalized = normalizeOptional(preferredBranch);
        return normalized != null ? normalized : DEFAULT_BRANCH;
    }

    private void validateInviteConfiguration() {
        StringBuilder missing = new StringBuilder();
        appendIfMissing(missing, "SUPABASE_URL", supabaseUrl);
        appendIfMissing(missing, "SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);
        appendIfMissing(missing, "SUPABASE_INVITE_REDIRECT_TO", supabaseInviteRedirectTo);

        if (missing.length() > 0) {
            throw new IllegalStateException("Missing required environment variables: " + missing);
        }
    }

    private void appendIfMissing(StringBuilder builder, String name, String value) {
        if (value == null || value.isBlank()) {
            if (builder.length() > 0) {
                builder.append(", ");
            }
            builder.append(name);
        }
    }

    private void sendSupabaseInvite(String employeeEmail) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "email", employeeEmail,
                    "redirect_to", supabaseInviteRedirectTo.trim()
            ));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to prepare invite payload", e);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl.trim() + "/auth/v1/invite"))
                .header("Content-Type", "application/json")
                .header("apikey", supabaseServiceRoleKey.trim())
                .header("Authorization", "Bearer " + supabaseServiceRoleKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Supabase invite failed (" + response.statusCode() + "): " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to send invite email via Supabase", e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to send invite email via Supabase", e);
        }
    }
}
