package com.assettrack.dto;

import java.util.UUID;

public class AssetRequestDTO {
    private String requesterEmail;
    private String requesterName;
    private String requestType;
    private String assetName;
    private String assetType;
    private String category;
    private UUID targetAssetId;
    private String requestedStatus;
    private String justification;

    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public UUID getTargetAssetId() { return targetAssetId; }
    public void setTargetAssetId(UUID targetAssetId) { this.targetAssetId = targetAssetId; }
    public String getRequestedStatus() { return requestedStatus; }
    public void setRequestedStatus(String requestedStatus) { this.requestedStatus = requestedStatus; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
}
