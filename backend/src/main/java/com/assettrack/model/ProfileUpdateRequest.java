package com.assettrack.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "profile_update_requests")
public class ProfileUpdateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "employee_email", nullable = false)
    private String employeeEmail;

    @Column(name = "full_name_requested")
    private String fullNameRequested;

    @Column(name = "phone_requested")
    private String phoneRequested;

    @Column(name = "department_requested")
    private String departmentRequested;

    @Column(name = "branch_requested")
    private String branchRequested;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String status;

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
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }
    public String getFullNameRequested() { return fullNameRequested; }
    public void setFullNameRequested(String fullNameRequested) { this.fullNameRequested = fullNameRequested; }
    public String getPhoneRequested() { return phoneRequested; }
    public void setPhoneRequested(String phoneRequested) { this.phoneRequested = phoneRequested; }
    public String getDepartmentRequested() { return departmentRequested; }
    public void setDepartmentRequested(String departmentRequested) { this.departmentRequested = departmentRequested; }
    public String getBranchRequested() { return branchRequested; }
    public void setBranchRequested(String branchRequested) { this.branchRequested = branchRequested; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
