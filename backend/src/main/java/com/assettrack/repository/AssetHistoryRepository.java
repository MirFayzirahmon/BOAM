package com.assettrack.repository;

import com.assettrack.model.AssetHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AssetHistoryRepository extends JpaRepository<AssetHistory, UUID> {

    List<AssetHistory> findAllByOrderByChangedAtDesc();

    List<AssetHistory> findByAssetIdOrderByChangedAtDesc(UUID assetId);

    @Query("SELECT h FROM AssetHistory h WHERE " +
           "(:assetId IS NULL OR h.assetId = :assetId) AND " +
           "(:from IS NULL OR h.changedAt >= :from) AND " +
           "(:to IS NULL OR h.changedAt <= :to) " +
           "ORDER BY h.changedAt DESC")
    List<AssetHistory> findFiltered(
            @Param("assetId") UUID assetId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    @Query("SELECT h FROM AssetHistory h ORDER BY h.changedAt DESC")
    List<AssetHistory> findRecent(Pageable pageable);

    List<AssetHistory> findAllByOrderByChangedAtAsc();
}
