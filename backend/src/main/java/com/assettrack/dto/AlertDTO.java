package com.assettrack.dto;

public class AlertDTO {
    private String type;
    private String severity;
    private String message;
    private String assetName;
    private String details;

    public AlertDTO() {}

    public AlertDTO(String type, String severity, String message, String assetName, String details) {
        this.type = type;
        this.severity = severity;
        this.message = message;
        this.assetName = assetName;
        this.details = details;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
