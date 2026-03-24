package com.assettrack.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AssignmentDTO {
    private UUID id;
    private UUID assetId;
    private UUID employeeId;
    private OffsetDateTime assignedAt;
    private OffsetDateTime returnedAt;
    private String notes;

    // Nested data (when joined)
    private AssetDTO asset;
    private EmployeeDTO employee;

    public AssignmentDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public OffsetDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt) { this.assignedAt = assignedAt; }
    public OffsetDateTime getReturnedAt() { return returnedAt; }
    public void setReturnedAt(OffsetDateTime returnedAt) { this.returnedAt = returnedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public AssetDTO getAsset() { return asset; }
    public void setAsset(AssetDTO asset) { this.asset = asset; }
    public EmployeeDTO getEmployee() { return employee; }
    public void setEmployee(EmployeeDTO employee) { this.employee = employee; }
}
