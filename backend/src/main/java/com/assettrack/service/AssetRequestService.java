package com.assettrack.service;

import com.assettrack.dto.AssetRequestDTO;
import com.assettrack.dto.AssetRequestReviewDTO;
import com.assettrack.dto.AssignRequest;
import com.assettrack.dto.StatusChangeRequest;
import com.assettrack.model.Asset;
import com.assettrack.model.AssetRequest;
import com.assettrack.model.AssetRequestType;
import com.assettrack.model.Employee;
import com.assettrack.repository.AssetRepository;
import com.assettrack.repository.AssetRequestRepository;
import com.assettrack.repository.AssignmentRepository;
import com.assettrack.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class AssetRequestService {

    private final AssetRequestRepository requestRepository;
    private final AssetRepository assetRepository;
    private final AssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AssignmentService assignmentService;
    private final AssetService assetService;

    public AssetRequestService(AssetRequestRepository requestRepository,
                               AssetRepository assetRepository,
                               AssignmentRepository assignmentRepository,
                               EmployeeRepository employeeRepository,
                               AssignmentService assignmentService,
                               AssetService assetService) {
        this.requestRepository = requestRepository;
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
        this.employeeRepository = employeeRepository;
        this.assignmentService = assignmentService;
        this.assetService = assetService;
    }

    @Transactional
    public AssetRequest createRequest(AssetRequestDTO dto) {
        if (dto.getRequesterEmail() == null || dto.getRequesterEmail().isBlank()) {
            throw new IllegalArgumentException("Requester email is required");
        }
        if (dto.getRequesterName() == null || dto.getRequesterName().isBlank()) {
            throw new IllegalArgumentException("Requester name is required");
        }
        if (dto.getJustification() == null || dto.getJustification().isBlank()) {
            throw new IllegalArgumentException("Reason/justification is required");
        }

        AssetRequestType requestType = parseRequestType(dto.getRequestType());
        AssetRequest req = new AssetRequest();
        req.setRequesterEmail(dto.getRequesterEmail());
        req.setRequesterName(dto.getRequesterName());
        req.setRequestType(requestType.name());
        req.setTargetAssetId(dto.getTargetAssetId());
        req.setRequestedStatus(dto.getRequestedStatus() == null ? null : dto.getRequestedStatus().toUpperCase(Locale.ROOT));
        req.setAssetName(dto.getAssetName());
        req.setAssetType(dto.getAssetType());
        req.setCategory(dto.getCategory());
        req.setJustification(dto.getJustification());
        req.setProcurementRequired(false);
        req.setStatus("PENDING");
        validateAndPopulateRequest(req);
        return requestRepository.save(req);
    }

    public List<AssetRequest> getRequestsByEmail(String email) {
        return requestRepository.findByRequesterEmailOrderByCreatedAtDesc(email);
    }

    public List<AssetRequest> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AssetRequest> getRequestsByStatus(String status) {
        return requestRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public AssetRequest reviewRequest(UUID id, AssetRequestReviewDTO dto) {
        AssetRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Request not found"));

        if (!"PENDING".equals(req.getStatus())) {
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
            executeApprovedAction(req, dto.getReviewedBy());
        } else {
            req.setProcurementRequired(false);
        }

        req.setStatus(status);
        req.setAdminNotes(dto.getAdminNotes());
        req.setReviewedBy(dto.getReviewedBy());
        req.setReviewedAt(OffsetDateTime.now());
        return requestRepository.save(req);
    }

    public long countPending() {
        return requestRepository.countByStatus("PENDING");
    }

    private AssetRequestType parseRequestType(String raw) {
        try {
            return AssetRequestType.fromNullable(raw);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid request type");
        }
    }

    private void validateAndPopulateRequest(AssetRequest req) {
        AssetRequestType type = parseRequestType(req.getRequestType());
        req.setRequestType(type.name());
        String normalizedCategory = (req.getCategory() == null || req.getCategory().isBlank()) ? "Other" : req.getCategory();
        req.setCategory(normalizedCategory);

        if (type == AssetRequestType.NEW_ASSET_PURCHASE) {
            if (req.getAssetName() == null || req.getAssetName().isBlank()) {
                throw new IllegalArgumentException("Asset name is required for purchase requests");
            }
            if (req.getAssetType() == null || req.getAssetType().isBlank()) {
                throw new IllegalArgumentException("Asset type is required for purchase requests");
            }
            req.setRequestedStatus(null);
            return;
        }

        if (type == AssetRequestType.STATUS_CHANGE) {
            if (req.getTargetAssetId() == null) {
                throw new IllegalArgumentException("Target asset is required for status change requests");
            }
            if (req.getRequestedStatus() == null || req.getRequestedStatus().isBlank()) {
                throw new IllegalArgumentException("Requested status is required for status change requests");
            }
            Asset target = assetRepository.findById(req.getTargetAssetId())
                    .orElseThrow(() -> new IllegalArgumentException("Target asset not found"));
            if (req.getAssetName() == null || req.getAssetName().isBlank()) {
                req.setAssetName(target.getName());
            }
            if (req.getAssetType() == null || req.getAssetType().isBlank()) {
                req.setAssetType(target.getType());
            }
            req.setCategory(target.getCategory());
            return;
        }

        if (req.getTargetAssetId() != null) {
            Asset target = assetRepository.findById(req.getTargetAssetId())
                    .orElseThrow(() -> new IllegalArgumentException("Target asset not found"));
            if (req.getAssetName() == null || req.getAssetName().isBlank()) {
                req.setAssetName(target.getName());
            }
            if (req.getAssetType() == null || req.getAssetType().isBlank()) {
                req.setAssetType(target.getType());
            }
            if (req.getCategory() == null || req.getCategory().isBlank()) {
                req.setCategory(target.getCategory());
            }
        } else {
            if (req.getAssetName() == null || req.getAssetName().isBlank()) {
                req.setAssetName("Any available asset");
            }
            if (req.getAssetType() == null || req.getAssetType().isBlank()) {
                req.setAssetType("Any");
            }
        }
        req.setRequestedStatus(null);
    }

    private void executeApprovedAction(AssetRequest req, String reviewedBy) {
        AssetRequestType type = parseRequestType(req.getRequestType());
        switch (type) {
            case EXISTING_ASSET_ASSIGNMENT -> approveAssignmentRequest(req, reviewedBy);
            case STATUS_CHANGE -> approveStatusChangeRequest(req, reviewedBy);
            case NEW_ASSET_PURCHASE -> req.setProcurementRequired(true);
        }
    }

    private void approveAssignmentRequest(AssetRequest req, String reviewedBy) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(req.getRequesterEmail())
                .orElseThrow(() -> new IllegalArgumentException("Requester is not a registered employee"));
        Asset asset = resolveAssignableAsset(req);
        AssignRequest assignRequest = new AssignRequest();
        assignRequest.setEmployeeId(employee.getId());
        assignRequest.setAssignedBy(reviewedBy);
        assignRequest.setNotes(req.getJustification());
        assignmentService.assignAsset(asset.getId(), assignRequest);
        req.setTargetAssetId(asset.getId());
        req.setAssetName(asset.getName());
        req.setAssetType(asset.getType());
        req.setCategory(asset.getCategory());
        req.setProcurementRequired(false);
    }

    private void approveStatusChangeRequest(AssetRequest req, String reviewedBy) {
        if (req.getTargetAssetId() == null) {
            throw new IllegalArgumentException("Target asset is required for status change");
        }
        if (req.getRequestedStatus() == null || req.getRequestedStatus().isBlank()) {
            throw new IllegalArgumentException("Requested status is required for status change");
        }
        StatusChangeRequest statusChangeRequest = new StatusChangeRequest();
        statusChangeRequest.setNewStatus(req.getRequestedStatus());
        statusChangeRequest.setChangedBy(reviewedBy);
        statusChangeRequest.setReason(req.getJustification());
        assetService.changeStatus(req.getTargetAssetId(), statusChangeRequest);
        req.setProcurementRequired(false);
    }

    private Asset resolveAssignableAsset(AssetRequest req) {
        if (req.getTargetAssetId() != null) {
            Asset target = assetRepository.findById(req.getTargetAssetId())
                    .orElseThrow(() -> new IllegalArgumentException("Target asset not found"));
            if (!isAssetAssignableNow(target)) {
                throw new IllegalArgumentException("Requested asset is no longer available");
            }
            return target;
        }

        return assetRepository.findAllByOrderByUpdatedAtDesc().stream()
                .filter(this::isAssetAssignableNow)
                .filter(asset -> matchesRequestedShape(req, asset))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No matching available asset for assignment"));
    }

    private boolean isAssetAssignableNow(Asset asset) {
        if (!"REGISTERED".equals(asset.getStatus())) {
            return false;
        }
        return assignmentRepository.findByAssetIdAndReturnedAtIsNull(asset.getId()).isEmpty();
    }

    private boolean matchesRequestedShape(AssetRequest req, Asset asset) {
        boolean typeMatches = req.getAssetType() == null
                || req.getAssetType().isBlank()
                || "Any".equalsIgnoreCase(req.getAssetType())
                || req.getAssetType().equalsIgnoreCase(asset.getType());
        boolean categoryMatches = req.getCategory() == null
                || req.getCategory().isBlank()
                || "Other".equalsIgnoreCase(req.getCategory())
                || req.getCategory().equalsIgnoreCase(asset.getCategory());
        return typeMatches && categoryMatches;
    }
}
