package com.assettrack.service;

import com.assettrack.dto.AssetDTO;
import com.assettrack.dto.AssetHistoryDTO;
import com.assettrack.model.AssetHistory;
import com.assettrack.repository.AssetHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AssetHistoryService {

    private final AssetHistoryRepository historyRepository;

    public AssetHistoryService(AssetHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    public List<AssetHistoryDTO> getAllHistory() {
        return historyRepository.findAllByOrderByChangedAtDesc()
                .stream().map(this::toDTO).toList();
    }

    public List<AssetHistoryDTO> getHistoryByAsset(UUID assetId) {
        return historyRepository.findByAssetIdOrderByChangedAtDesc(assetId)
                .stream().map(this::toDTO).toList();
    }

    public List<AssetHistoryDTO> getFilteredHistory(UUID assetId, OffsetDateTime from, OffsetDateTime to) {
        return historyRepository.findFiltered(assetId, from, to)
                .stream().map(this::toDTO).toList();
    }

    public List<AssetHistoryDTO> getRecentHistory(int limit) {
        return historyRepository.findRecent(PageRequest.of(0, limit))
                .stream().map(this::toDTO).toList();
    }

    public List<AssetHistoryDTO> getAllHistoryChronological() {
        return historyRepository.findAllByOrderByChangedAtAsc()
                .stream().map(this::toDTO).toList();
    }

    private AssetHistoryDTO toDTO(AssetHistory h) {
        AssetHistoryDTO dto = new AssetHistoryDTO();
        dto.setId(h.getId());
        dto.setAssetId(h.getAssetId());
        dto.setChangedBy(h.getChangedBy());
        dto.setOldStatus(h.getOldStatus());
        dto.setNewStatus(h.getNewStatus());
        dto.setChangedAt(h.getChangedAt());
        dto.setReason(h.getReason());
        dto.setNotes(h.getNotes());

        if (h.getAsset() != null) {
            AssetDTO assetDto = new AssetDTO();
            assetDto.setId(h.getAsset().getId());
            assetDto.setName(h.getAsset().getName());
            assetDto.setSerialNumber(h.getAsset().getSerialNumber());
            assetDto.setStatus(h.getAsset().getStatus());
            dto.setAsset(assetDto);
        }

        return dto;
    }
}
