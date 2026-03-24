package com.assettrack.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AssetHistoryDTO {
    private UUID id;
    private UUID assetId;
    private String changedBy;
    private String oldStatus;
    private String newStatus;
    private OffsetDateTime changedAt;
    private String reason;
    private String notes;

    // Nested asset info
    private AssetDTO asset;

    public AssetHistoryDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public OffsetDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(OffsetDateTime changedAt) { this.changedAt = changedAt; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public AssetDTO getAsset() { return asset; }
    public void setAsset(AssetDTO asset) { this.asset = asset; }
}
