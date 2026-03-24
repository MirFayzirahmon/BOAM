package com.assettrack.repository;

import com.assettrack.model.ProfileUpdateRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProfileUpdateRequestRepository extends JpaRepository<ProfileUpdateRequest, UUID> {
    List<ProfileUpdateRequest> findByEmployeeEmailOrderByCreatedAtDesc(String employeeEmail);
    List<ProfileUpdateRequest> findAllByOrderByCreatedAtDesc();
}
