package com.assettrack.controller;

import com.assettrack.dto.AssetDTO;
import com.assettrack.dto.StatusChangeRequest;
import com.assettrack.model.Asset;
import com.assettrack.service.AssetService;
import com.assettrack.service.UserRoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;
    private final UserRoleService userRoleService;

    public AssetController(AssetService assetService, UserRoleService userRoleService) {
        this.assetService = assetService;
        this.userRoleService = userRoleService;
    }

    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<Asset> assets;
        if (search != null || status != null || category != null) {
            assets = assetService.getFilteredAssets(status, category, search);
        } else {
            assets = assetService.getAllAssets();
        }
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAsset(@PathVariable UUID id) {
        return assetService.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createAsset(@RequestBody AssetDTO dto,
                                          @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            Asset created = assetService.createAsset(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable UUID id, @RequestBody AssetDTO dto,
                                          @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        try {
            Asset updated = assetService.updateAsset(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> changeStatus(@PathVariable UUID id,
                                          @Valid @RequestBody StatusChangeRequest request,
                                          @RequestHeader(value = "X-User-Email", required = false) String email) {
        if (email == null || !userRoleService.isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        request.setChangedBy(email);
        try {
            Asset updated = assetService.changeStatus(id, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/transitions")
    public ResponseEntity<List<String>> getAllowedTransitions(@PathVariable UUID id) {
        return assetService.getAssetById(id)
                .map(asset -> ResponseEntity.ok(assetService.getAllowedTransitions(asset.getStatus())))
                .orElse(ResponseEntity.notFound().build());
    }
}
