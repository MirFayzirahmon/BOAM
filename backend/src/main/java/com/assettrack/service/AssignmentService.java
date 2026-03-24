package com.assettrack.service;

import com.assettrack.dto.AssignRequest;
import com.assettrack.dto.AssignmentDTO;
import com.assettrack.dto.AssetDTO;
import com.assettrack.dto.EmployeeDTO;
import com.assettrack.model.Asset;
import com.assettrack.model.AssetHistory;
import com.assettrack.model.Assignment;
import com.assettrack.model.Employee;
import com.assettrack.repository.AssetHistoryRepository;
import com.assettrack.repository.AssetRepository;
import com.assettrack.repository.AssignmentRepository;
import com.assettrack.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;
    private final AssetHistoryRepository historyRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             AssetRepository assetRepository,
                             EmployeeRepository employeeRepository,
                             AssetHistoryRepository historyRepository) {
        this.assignmentRepository = assignmentRepository;
        this.assetRepository = assetRepository;
        this.employeeRepository = employeeRepository;
        this.historyRepository = historyRepository;
    }

    public List<AssignmentDTO> getActiveAssignments() {
        List<Assignment> assignments = assignmentRepository.findByReturnedAtIsNull();
        return assignments.stream().map(this::toDTO).toList();
    }

    public List<AssignmentDTO> getAssignmentsByAsset(UUID assetId) {
        List<Assignment> assignments = assignmentRepository.findByAssetIdOrderByAssignedAtDesc(assetId);
        return assignments.stream().map(this::toDTO).toList();
    }

    public List<AssignmentDTO> getActiveAssignmentsByEmployee(UUID employeeId) {
        List<Assignment> assignments = assignmentRepository.findByEmployeeIdAndReturnedAtIsNull(employeeId);
        return assignments.stream().map(this::toDTO).toList();
    }

    public Map<String, Long> getActiveCountsByEmployee() {
        List<Object[]> results = assignmentRepository.countActiveByEmployee();
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : results) {
            counts.put(row[0].toString(), (Long) row[1]);
        }
        return counts;
    }

    @Transactional
    public AssignmentDTO assignAsset(UUID assetId, AssignRequest request) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new NoSuchElementException("Asset not found"));

        if ("LOST".equals(asset.getStatus()) || "WRITTEN_OFF".equals(asset.getStatus())) {
            throw new IllegalArgumentException("Cannot assign an asset with status " + asset.getStatus());
        }

        List<Assignment> existing = assignmentRepository.findByAssetIdAndReturnedAtIsNull(assetId);
        if (!existing.isEmpty()) {
            throw new IllegalArgumentException("Asset already has an active assignment");
        }

        employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NoSuchElementException("Employee not found"));

        Assignment assignment = new Assignment();
        assignment.setAssetId(assetId);
        assignment.setEmployeeId(request.getEmployeeId());
        assignment.setNotes(request.getNotes());

        Assignment saved = assignmentRepository.save(assignment);

        String oldStatus = asset.getStatus();
        if (!"ASSIGNED".equals(oldStatus)) {
            asset.setStatus("ASSIGNED");
            assetRepository.save(asset);

            AssetHistory history = new AssetHistory();
            history.setAssetId(assetId);
            history.setOldStatus(oldStatus);
            history.setNewStatus("ASSIGNED");
            history.setChangedBy(request.getAssignedBy());
            history.setReason("Asset assigned to employee");
            historyRepository.save(history);
        }

        return toDTO(saved);
    }

    @Transactional
    public AssignmentDTO returnAsset(UUID assignmentId, String returnedBy) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NoSuchElementException("Assignment not found"));

        if (assignment.getReturnedAt() != null) {
            throw new IllegalArgumentException("Assignment already returned");
        }

        assignment.setReturnedAt(OffsetDateTime.now());
        assignmentRepository.save(assignment);

        Asset asset = assetRepository.findById(assignment.getAssetId())
                .orElseThrow(() -> new NoSuchElementException("Asset not found"));

        String oldStatus = asset.getStatus();
        asset.setStatus("REGISTERED");
        assetRepository.save(asset);

        AssetHistory history = new AssetHistory();
        history.setAssetId(asset.getId());
        history.setOldStatus(oldStatus);
        history.setNewStatus("REGISTERED");
        history.setChangedBy(returnedBy);
        history.setReason("Asset returned");
        historyRepository.save(history);

        return toDTO(assignment);
    }

    public long countByAssetId(UUID assetId) {
        return assignmentRepository.countByAssetId(assetId);
    }

    private AssignmentDTO toDTO(Assignment a) {
        AssignmentDTO dto = new AssignmentDTO();
        dto.setId(a.getId());
        dto.setAssetId(a.getAssetId());
        dto.setEmployeeId(a.getEmployeeId());
        dto.setAssignedAt(a.getAssignedAt());
        dto.setReturnedAt(a.getReturnedAt());
        dto.setNotes(a.getNotes());

        if (a.getEmployee() != null) {
            EmployeeDTO empDto = new EmployeeDTO();
            empDto.setId(a.getEmployee().getId());
            empDto.setFullName(a.getEmployee().getFullName());
            empDto.setEmail(a.getEmployee().getEmail());
            empDto.setDepartment(a.getEmployee().getDepartment());
            empDto.setBranch(a.getEmployee().getBranch());
            dto.setEmployee(empDto);
        }

        if (a.getAsset() != null) {
            AssetDTO assetDto = new AssetDTO();
            assetDto.setId(a.getAsset().getId());
            assetDto.setName(a.getAsset().getName());
            assetDto.setSerialNumber(a.getAsset().getSerialNumber());
            assetDto.setStatus(a.getAsset().getStatus());
            assetDto.setCategory(a.getAsset().getCategory());
            dto.setAsset(assetDto);
        }

        return dto;
    }
}
