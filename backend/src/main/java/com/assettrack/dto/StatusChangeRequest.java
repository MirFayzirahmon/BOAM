package com.assettrack.dto;

import jakarta.validation.constraints.NotBlank;

public class StatusChangeRequest {
    @NotBlank(message = "New status is required")
    private String newStatus;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String changedBy;

    public StatusChangeRequest() {}

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
}
