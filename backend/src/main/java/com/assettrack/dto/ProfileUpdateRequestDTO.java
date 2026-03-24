package com.assettrack.dto;

public class ProfileUpdateRequestDTO {
    private String employeeEmail;
    private String fullNameRequested;
    private String phoneRequested;
    private String departmentRequested;
    private String branchRequested;
    private String reason;

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
}
