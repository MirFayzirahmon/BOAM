package com.assettrack.repository;

import com.assettrack.model.AssetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssetRequestRepository extends JpaRepository<AssetRequest, UUID> {
    List<AssetRequest> findByRequesterEmailOrderByCreatedAtDesc(String requesterEmail);
    List<AssetRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<AssetRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
