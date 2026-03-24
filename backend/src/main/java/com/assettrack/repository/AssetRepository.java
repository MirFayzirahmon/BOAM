package com.assettrack.repository;

import com.assettrack.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    List<Asset> findAllByOrderByUpdatedAtDesc();

    @Query(value = "SELECT * FROM assets WHERE status = CAST(:status AS asset_status)", nativeQuery = true)
    List<Asset> findByStatus(@Param("status") String status);

    List<Asset> findByCategory(String category);

    @Query(value = "SELECT * FROM assets WHERE status != CAST(:status AS asset_status)", nativeQuery = true)
    List<Asset> findByStatusNot(@Param("status") String status);

    @Query("SELECT a FROM Asset a WHERE " +
           "(LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Asset> searchByNameOrSerial(@Param("search") String search);

    @Query(value = "SELECT * FROM assets WHERE " +
           "(:status IS NULL OR status = CAST(:status AS asset_status)) AND " +
           "(:category IS NULL OR category = CAST(:category AS asset_category)) " +
           "ORDER BY updated_at DESC", nativeQuery = true)
    List<Asset> findFiltered(@Param("status") String status, @Param("category") String category);

    boolean existsBySerialNumber(String serialNumber);

    @Query(value = "SELECT status::text, COUNT(*) FROM assets GROUP BY status", nativeQuery = true)
    List<Object[]> countByStatus();

    @Query("SELECT a.category, COUNT(a) FROM Asset a GROUP BY a.category")
    List<Object[]> countByCategory();
}
