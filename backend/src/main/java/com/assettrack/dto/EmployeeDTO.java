package com.assettrack.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class EmployeeDTO {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String branch;
    private String status;
    private String invitedBy;
    private OffsetDateTime invitedAt;
    private OffsetDateTime createdAt;

    public EmployeeDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }
    public OffsetDateTime getInvitedAt() { return invitedAt; }
    public void setInvitedAt(OffsetDateTime invitedAt) { this.invitedAt = invitedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
