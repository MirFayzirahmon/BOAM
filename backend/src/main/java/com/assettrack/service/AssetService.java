package com.assettrack.service;

import com.assettrack.dto.AssetDTO;
import com.assettrack.dto.StatusChangeRequest;
import com.assettrack.model.Asset;
import com.assettrack.model.AssetHistory;
import com.assettrack.model.Assignment;
import com.assettrack.repository.AssetHistoryRepository;
import com.assettrack.repository.AssetRepository;
import com.assettrack.repository.AssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetHistoryRepository historyRepository;
    private final AssignmentRepository assignmentRepository;

    private static final Map<String, List<String>> STATUS_TRANSITIONS = Map.of(
            "REGISTERED", List.of("ASSIGNED", "IN_REPAIR"),
            "ASSIGNED", List.of("REGISTERED", "IN_REPAIR", "LOST"),
            "IN_REPAIR", List.of("REGISTERED", "ASSIGNED", "WRITTEN_OFF"),
            "LOST", List.of("WRITTEN_OFF"),
            "WRITTEN_OFF", List.of()
    );

    public AssetService(AssetRepository assetRepository,
                        AssetHistoryRepository historyRepository,
                        AssignmentRepository assignmentRepository) {
        this.assetRepository = assetRepository;
        this.historyRepository = historyRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public List<Asset> getAllAssets() {
        return assetRepository.findAllByOrderByUpdatedAtDesc();
    }

    public Optional<Asset> getAssetById(UUID id) {
        return assetRepository.findById(id);
    }

    public List<Asset> getFilteredAssets(String status, String category, String search) {
        if (search != null && !search.isBlank()) {
            return assetRepository.searchByNameOrSerial(search);
        }
        return assetRepository.findFiltered(status, category);
    }

    @Transactional
    public Asset createAsset(AssetDTO dto) {
        if (assetRepository.existsBySerialNumber(dto.getSerialNumber())) {
            throw new IllegalArgumentException("Serial number already exists");
        }

        Asset asset = new Asset();
        asset.setName(dto.getName());
        asset.setType(dto.getType());
        asset.setCategory(dto.getCategory());
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setDescription(dto.getDescription());
        asset.setImageUrl(dto.getImageUrl());
        asset.setStatus("REGISTERED");

        Asset saved = assetRepository.save(asset);

        AssetHistory history = new AssetHistory();
        history.setAssetId(saved.getId());
        history.setOldStatus(null);
        history.setNewStatus("REGISTERED");
        history.setChangedBy("system");
        history.setReason("Asset registered");
        historyRepository.save(history);

        return saved;
    }

    @Transactional
    public Asset updateAsset(UUID id, AssetDTO dto) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Asset not found"));

        if (dto.getName() != null) asset.setName(dto.getName());
        if (dto.getType() != null) asset.setType(dto.getType());
        if (dto.getCategory() != null) asset.setCategory(dto.getCategory());
        if (dto.getDescription() != null) asset.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) asset.setImageUrl(dto.getImageUrl());
        if (dto.getSerialNumber() != null && !dto.getSerialNumber().equals(asset.getSerialNumber())) {
            if (assetRepository.existsBySerialNumber(dto.getSerialNumber())) {
                throw new IllegalArgumentException("Serial number already exists");
            }
            asset.setSerialNumber(dto.getSerialNumber());
        }

        return assetRepository.save(asset);
    }

    @Transactional
    public Asset changeStatus(UUID id, StatusChangeRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Asset not found"));

        String oldStatus = asset.getStatus();
        String newStatus = request.getNewStatus();

        List<String> allowed = STATUS_TRANSITIONS.getOrDefault(oldStatus, List.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalArgumentException(
                    "Cannot transition from " + oldStatus + " to " + newStatus);
        }

        // If moving away from ASSIGNED, close the active assignment
        if ("ASSIGNED".equals(oldStatus) && !"ASSIGNED".equals(newStatus)) {
            List<Assignment> active = assignmentRepository.findByAssetIdAndReturnedAtIsNull(id);
            for (Assignment a : active) {
                a.setReturnedAt(OffsetDateTime.now());
                assignmentRepository.save(a);
            }
        }

        asset.setStatus(newStatus);
        Asset saved = assetRepository.save(asset);

        AssetHistory history = new AssetHistory();
        history.setAssetId(id);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(request.getChangedBy());
        history.setReason(request.getReason());
        historyRepository.save(history);

        return saved;
    }

    public List<String> getAllowedTransitions(String currentStatus) {
        return STATUS_TRANSITIONS.getOrDefault(currentStatus, List.of());
    }
}
