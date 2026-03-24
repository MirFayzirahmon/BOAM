package com.assettrack.service;

import com.assettrack.dto.ProfileUpdateRequestDTO;
import com.assettrack.dto.ProfileUpdateReviewDTO;
import com.assettrack.model.Employee;
import com.assettrack.model.ProfileUpdateRequest;
import com.assettrack.repository.EmployeeRepository;
import com.assettrack.repository.ProfileUpdateRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProfileUpdateRequestService {
    private final ProfileUpdateRequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeService employeeService;

    public ProfileUpdateRequestService(ProfileUpdateRequestRepository requestRepository,
                                       EmployeeRepository employeeRepository,
                                       EmployeeService employeeService) {
        this.requestRepository = requestRepository;
        this.employeeRepository = employeeRepository;
        this.employeeService = employeeService;
    }

    @Transactional
    public ProfileUpdateRequest createRequest(ProfileUpdateRequestDTO dto) {
        if (dto.getEmployeeEmail() == null || dto.getEmployeeEmail().isBlank()) {
            throw new IllegalArgumentException("Employee email is required");
        }
        if (dto.getReason() == null || dto.getReason().isBlank()) {
            throw new IllegalArgumentException("Reason is required");
        }
        if (!hasRequestedChanges(dto)) {
            throw new IllegalArgumentException("At least one requested profile field is required");
        }

        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setEmployeeEmail(dto.getEmployeeEmail().trim());
        request.setFullNameRequested(trimToNull(dto.getFullNameRequested()));
        request.setPhoneRequested(trimToNull(dto.getPhoneRequested()));
        request.setDepartmentRequested(trimToNull(dto.getDepartmentRequested()));
        request.setBranchRequested(trimToNull(dto.getBranchRequested()));
        request.setReason(dto.getReason().trim());
        request.setStatus("PENDING");
        return requestRepository.save(request);
    }

    public List<ProfileUpdateRequest> getRequestsByEmployeeEmail(String email) {
        return requestRepository.findByEmployeeEmailOrderByCreatedAtDesc(email);
    }

    public List<ProfileUpdateRequest> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public ProfileUpdateRequest reviewRequest(UUID id, ProfileUpdateReviewDTO dto) {
        ProfileUpdateRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Profile update request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("Request has already been reviewed");
        }

        String status = dto.getStatus() == null ? "" : dto.getStatus().toUpperCase(Locale.ROOT);
        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("Invalid review status");
        }
        if ("REJECTED".equals(status) && (dto.getAdminNotes() == null || dto.getAdminNotes().isBlank())) {
            throw new IllegalArgumentException("Admin notes are required when rejecting a request");
        }

        if ("APPROVED".equals(status)) {
            Employee employee = employeeService.findOrCreateByEmail(
                    request.getEmployeeEmail(),
                    request.getFullNameRequested(),
                    request.getPhoneRequested(),
                    request.getDepartmentRequested(),
                    request.getBranchRequested()
            );
            employeeService.applyProfileUpdate(
                    employee,
                    request.getFullNameRequested(),
                    request.getPhoneRequested(),
                    request.getDepartmentRequested(),
                    request.getBranchRequested()
            );
        }

        request.setStatus(status);
        request.setAdminNotes(trimToNull(dto.getAdminNotes()));
        request.setReviewedBy(dto.getReviewedBy());
        request.setReviewedAt(OffsetDateTime.now());
        return requestRepository.save(request);
    }

    private boolean hasRequestedChanges(ProfileUpdateRequestDTO dto) {
        return trimToNull(dto.getFullNameRequested()) != null
                || trimToNull(dto.getPhoneRequested()) != null
                || trimToNull(dto.getDepartmentRequested()) != null
                || trimToNull(dto.getBranchRequested()) != null;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
