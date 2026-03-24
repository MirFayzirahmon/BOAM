package com.assettrack.service;

import com.assettrack.dto.AlertDTO;
import com.assettrack.dto.DashboardSummaryDTO;
import com.assettrack.model.Asset;
import com.assettrack.model.AssetHistory;
import com.assettrack.model.Assignment;
import com.assettrack.repository.AssetHistoryRepository;
import com.assettrack.repository.AssetRepository;
import com.assettrack.repository.AssignmentRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AssetRepository assetRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssetHistoryRepository historyRepository;

    public AnalyticsService(AssetRepository assetRepository,
                            AssignmentRepository assignmentRepository,
                            AssetHistoryRepository historyRepository) {
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
        this.historyRepository = historyRepository;
    }

    public DashboardSummaryDTO getDashboardSummary() {
        DashboardSummaryDTO summary = new DashboardSummaryDTO();
        summary.setTotalAssets(assetRepository.count());

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByStatus()) {
            statusCounts.put((String) row[0], (Long) row[1]);
        }
        summary.setStatusCounts(statusCounts);

        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByCategory()) {
            categoryCounts.put((String) row[0], (Long) row[1]);
        }
        summary.setCategoryCounts(categoryCounts);

        return summary;
    }

    public Map<String, Object> getAssetAging() {
        List<Asset> assets = assetRepository.findByStatusNot("WRITTEN_OFF");
        OffsetDateTime now = OffsetDateTime.now();

        long lessThan1 = 0, oneToTwo = 0, twoToThree = 0, moreThan3 = 0;

        for (Asset a : assets) {
            long months = ChronoUnit.MONTHS.between(a.getCreatedAt(), now);
            if (months < 12) lessThan1++;
            else if (months < 24) oneToTwo++;
            else if (months < 36) twoToThree++;
            else moreThan3++;
        }

        Map<String, Object> aging = new LinkedHashMap<>();
        aging.put("lessThan1Year", lessThan1);
        aging.put("oneToTwoYears", oneToTwo);
        aging.put("twoToThreeYears", twoToThree);
        aging.put("moreThan3Years", moreThan3);
        return aging;
    }

    public Map<String, Long> getDepartmentBreakdown() {
        List<Assignment> active = assignmentRepository.findByReturnedAtIsNull();
        Map<String, Long> breakdown = new LinkedHashMap<>();

        for (Assignment a : active) {
            if (a.getEmployee() != null && a.getEmployee().getDepartment() != null) {
                String dept = a.getEmployee().getDepartment();
                breakdown.merge(dept, 1L, Long::sum);
            }
        }

        return breakdown.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));
    }

    public List<Map<String, Object>> getStatusTrends() {
        List<AssetHistory> history = historyRepository.findAllByOrderByChangedAtAsc();
        Map<String, Map<String, Long>> monthly = new LinkedHashMap<>();

        for (AssetHistory h : history) {
            if (h.getNewStatus() == null || h.getChangedAt() == null) continue;
            String month = h.getChangedAt().getYear() + "-" +
                    String.format("%02d", h.getChangedAt().getMonthValue());

            monthly.computeIfAbsent(month, k -> new LinkedHashMap<>())
                    .merge(h.getNewStatus(), 1L, Long::sum);
        }

        List<Map<String, Object>> trends = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : monthly.entrySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", entry.getKey());
            point.putAll(entry.getValue());
            trends.add(point);
        }
        return trends;
    }

    public List<Map<String, Object>> getTopReassigned(int limit) {
        List<Object[]> counts = assignmentRepository.countTotalByAsset();
        List<Map<String, Object>> result = new ArrayList<>();

        int count = 0;
        for (Object[] row : counts) {
            if (count >= limit) break;
            UUID assetId = (UUID) row[0];
            Long total = (Long) row[1];

            assetRepository.findById(assetId).ifPresent(asset -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", asset.getId());
                item.put("name", asset.getName());
                item.put("serial_number", asset.getSerialNumber());
                item.put("assignment_count", total);
                result.add(item);
            });
            count++;
        }
        return result;
    }

    public List<AlertDTO> getRiskAlerts() {
        List<AlertDTO> alerts = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now();
        List<Asset> allAssets = assetRepository.findAll();

        // Rule 1: Assets in repair for over 30 days
        List<Asset> inRepair = assetRepository.findByStatus("IN_REPAIR");
        for (Asset a : inRepair) {
            if (a.getUpdatedAt() == null) continue;
            long daysInRepair = ChronoUnit.DAYS.between(a.getUpdatedAt(), now);
            if (daysInRepair > 30) {
                String severity = daysInRepair > 45 ? "high" : "medium";
                alerts.add(new AlertDTO(
                        "REPAIR_OVERDUE",
                        severity,
                        "Repair SLA breach: \"" + a.getName() + "\" has been in repair for " + daysInRepair + " days.",
                        a.getName(),
                        "Rationale: repair duration above 30-day threshold. Recommended action: escalate vendor/internal repair ticket and set a 7-day closure target. Serial: "
                                + a.getSerialNumber()
                ));
            }
        }

        // Rule 2: Departments with repeated loss events
        Map<String, List<String>> deptLost = new LinkedHashMap<>();
        List<Asset> lostAssets = assetRepository.findByStatus("LOST");
        for (Asset a : lostAssets) {
            List<Assignment> assignments = assignmentRepository.findByAssetIdOrderByAssignedAtDesc(a.getId());
            if (!assignments.isEmpty() && assignments.get(0).getEmployee() != null) {
                String dept = assignments.get(0).getEmployee().getDepartment();
                if (dept != null) {
                    deptLost.computeIfAbsent(dept, k -> new ArrayList<>()).add(a.getName());
                }
            }
        }
        for (Map.Entry<String, List<String>> entry : deptLost.entrySet()) {
            int lostCount = entry.getValue().size();
            if (lostCount >= 2) {
                alerts.add(new AlertDTO(
                        "DEPT_LOSS_PATTERN",
                        lostCount >= 4 ? "high" : "medium",
                        "Loss pattern detected in " + entry.getKey() + ": " + lostCount + " assets are currently marked LOST.",
                        null,
                        "Rationale: repeated losses in the same department indicate a control gap. Recommended action: run targeted audit, verify handover logs, and enforce checkout confirmation. Lost assets: "
                                + String.join(", ", entry.getValue())
                ));
            }
        }

        Map<UUID, Long> reassignmentsByAsset = assignmentRepository.countTotalByAsset().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        // Rule 3: Assets older than 5 years still active
        List<Asset> activeAssets = allAssets.stream()
                .filter(a -> !"WRITTEN_OFF".equals(a.getStatus()) && !"LOST".equals(a.getStatus()))
                .toList();
        for (Asset a : activeAssets) {
            if (a.getCreatedAt() != null &&
                    ChronoUnit.YEARS.between(a.getCreatedAt(), now) >= 5) {
                long ageYears = ChronoUnit.YEARS.between(a.getCreatedAt(), now);
                alerts.add(new AlertDTO(
                        "ASSET_AGING",
                        ageYears >= 6 ? "high" : "medium",
                        "Lifecycle risk: \"" + a.getName() + "\" is " + ageYears + " years old and still in active use.",
                        a.getName(),
                        "Rationale: operational assets older than 5 years typically have higher failure probability. Recommended action: schedule health check this month and plan replacement budget in next cycle."
                ));
            }
        }

        // Rule 4: Assets with 5+ reassignments
        for (Map.Entry<UUID, Long> row : reassignmentsByAsset.entrySet()) {
            Long count = row.getValue();
            if (count >= 5) {
                UUID assetId = row.getKey();
                assetRepository.findById(assetId).ifPresent(a ->
                        alerts.add(new AlertDTO(
                                "FREQUENT_REASSIGNMENT",
                                count >= 8 ? "high" : "medium",
                                "Utilization instability: \"" + a.getName() + "\" has changed hands " + count + " times.",
                                a.getName(),
                                "Rationale: frequent handoffs increase damage/loss probability and reduce accountability. Recommended action: assign a primary owner or create a pooled-device policy for this asset category."
                        ))
                );
            }
        }

        // Rule 5: Written-off assets with recent activity
        List<Asset> writtenOff = assetRepository.findByStatus("WRITTEN_OFF");
        for (Asset a : writtenOff) {
            if (a.getUpdatedAt() != null &&
                    ChronoUnit.DAYS.between(a.getUpdatedAt(), now) < 30) {
                alerts.add(new AlertDTO(
                        "RECENT_WRITEOFF", "low",
                        "Recent write-off: \"" + a.getName() + "\" changed to WRITTEN_OFF in the last 30 days.",
                        a.getName(),
                        "Rationale: recent write-offs are a common audit checkpoint. Recommended action: verify disposal certificate and final finance entry."
                ));
            }
        }

        // Rule 6: Predictive replacement priority (explainable score)
        List<Map<String, Object>> replacementRisk = new ArrayList<>();
        for (Asset a : activeAssets) {
            int score = 0;
            List<String> reasons = new ArrayList<>();
            long reassignmentCount = reassignmentsByAsset.getOrDefault(a.getId(), 0L);

            if (a.getCreatedAt() != null) {
                long ageYears = ChronoUnit.YEARS.between(a.getCreatedAt(), now);
                if (ageYears >= 6) {
                    score += 40;
                    reasons.add("age " + ageYears + "y (+40)");
                } else if (ageYears >= 4) {
                    score += 25;
                    reasons.add("age " + ageYears + "y (+25)");
                }
            }

            if (reassignmentCount >= 8) {
                score += 30;
                reasons.add("reassigned " + reassignmentCount + "x (+30)");
            } else if (reassignmentCount >= 5) {
                score += 20;
                reasons.add("reassigned " + reassignmentCount + "x (+20)");
            }

            if ("IN_REPAIR".equals(a.getStatus())) {
                score += 20;
                reasons.add("currently in repair (+20)");
                if (a.getUpdatedAt() != null) {
                    long repairDays = ChronoUnit.DAYS.between(a.getUpdatedAt(), now);
                    if (repairDays > 30) {
                        score += 20;
                        reasons.add("repair >30 days (+20)");
                    }
                }
            }

            if (score >= 55) {
                Map<String, Object> riskItem = new LinkedHashMap<>();
                riskItem.put("asset", a);
                riskItem.put("score", score);
                riskItem.put("reasons", reasons);
                replacementRisk.add(riskItem);
            }
        }

        replacementRisk.stream()
                .sorted((a, b) -> Integer.compare((Integer) b.get("score"), (Integer) a.get("score")))
                .limit(3)
                .forEach(item -> {
                    Asset asset = (Asset) item.get("asset");
                    int score = (Integer) item.get("score");
                    @SuppressWarnings("unchecked")
                    List<String> reasons = (List<String>) item.get("reasons");

                    alerts.add(new AlertDTO(
                            "PREDICTIVE_REPLACEMENT_PRIORITY",
                            score >= 75 ? "high" : "medium",
                            "Predicted replacement priority: \"" + asset.getName() + "\" scored " + score + "/100.",
                            asset.getName(),
                            "Rationale: " + String.join(", ", reasons) + ". Recommended action: prioritize this asset for preventive maintenance or replacement in the next planning cycle."
                    ));
                });

        return alerts;
    }
}
