package com.assettrack.repository;

import com.assettrack.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    List<Assignment> findByReturnedAtIsNull();

    List<Assignment> findByAssetIdOrderByAssignedAtDesc(UUID assetId);

    List<Assignment> findByAssetIdAndReturnedAtIsNull(UUID assetId);

    List<Assignment> findByEmployeeIdAndReturnedAtIsNull(UUID employeeId);

    Optional<Assignment> findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(UUID assetId);

    @Query("SELECT a.employeeId, COUNT(a) FROM Assignment a WHERE a.returnedAt IS NULL GROUP BY a.employeeId")
    List<Object[]> countActiveByEmployee();

    @Query("SELECT a.assetId, COUNT(a) FROM Assignment a GROUP BY a.assetId ORDER BY COUNT(a) DESC")
    List<Object[]> countTotalByAsset();

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.assetId = :assetId")
    long countByAssetId(@Param("assetId") UUID assetId);
}
