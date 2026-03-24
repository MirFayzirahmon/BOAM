package com.assettrack.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AssignRequest {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String notes;
    private String assignedBy;

    public AssignRequest() {}

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
}
