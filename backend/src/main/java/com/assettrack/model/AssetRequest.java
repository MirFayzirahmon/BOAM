package com.assettrack.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "asset_requests")
public class AssetRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @Column(name = "asset_name", nullable = false)
    private String assetName;

    @Column(name = "asset_type", nullable = false)
    private String assetType;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String justification;

    @Column(nullable = false)
    private String status;

    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(name = "target_asset_id")
    private UUID targetAssetId;

    @Column(name = "requested_status")
    private String requestedStatus;

    @Column(name = "procurement_required", nullable = false)
    private Boolean procurementRequired;

    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (status == null) status = "PENDING";
        if (category == null) category = "Other";
        if (requestType == null) requestType = AssetRequestType.NEW_ASSET_PURCHASE.name();
        if (procurementRequired == null) procurementRequired = false;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public UUID getTargetAssetId() { return targetAssetId; }
    public void setTargetAssetId(UUID targetAssetId) { this.targetAssetId = targetAssetId; }
    public String getRequestedStatus() { return requestedStatus; }
    public void setRequestedStatus(String requestedStatus) { this.requestedStatus = requestedStatus; }
    public Boolean getProcurementRequired() { return procurementRequired; }
    public void setProcurementRequired(Boolean procurementRequired) { this.procurementRequired = procurementRequired; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
