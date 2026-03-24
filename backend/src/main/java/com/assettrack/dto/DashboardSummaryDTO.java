package com.assettrack.dto;

import java.util.Map;

public class DashboardSummaryDTO {
    private long totalAssets;
    private Map<String, Long> statusCounts;
    private Map<String, Long> categoryCounts;

    public DashboardSummaryDTO() {}

    public long getTotalAssets() { return totalAssets; }
    public void setTotalAssets(long totalAssets) { this.totalAssets = totalAssets; }
    public Map<String, Long> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(Map<String, Long> statusCounts) { this.statusCounts = statusCounts; }
    public Map<String, Long> getCategoryCounts() { return categoryCounts; }
    public void setCategoryCounts(Map<String, Long> categoryCounts) { this.categoryCounts = categoryCounts; }
}
