package com.assettrack.controller;

import com.assettrack.dto.AssetHistoryDTO;
import com.assettrack.service.AssetHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/asset-history")
public class AssetHistoryController {

    private final AssetHistoryService historyService;

    public AssetHistoryController(AssetHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<List<AssetHistoryDTO>> getHistory(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit) {

        if (limit != null) {
            return ResponseEntity.ok(historyService.getRecentHistory(limit));
        }

        if (assetId != null || from != null || to != null) {
            OffsetDateTime fromDate = from != null ? OffsetDateTime.parse(from) : null;
            OffsetDateTime toDate = to != null ? OffsetDateTime.parse(to) : null;
            return ResponseEntity.ok(historyService.getFilteredHistory(assetId, fromDate, toDate));
        }

        return ResponseEntity.ok(historyService.getAllHistory());
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<AssetHistoryDTO>> getHistoryByAsset(@PathVariable UUID assetId) {
        return ResponseEntity.ok(historyService.getHistoryByAsset(assetId));
    }

    @GetMapping("/chronological")
    public ResponseEntity<List<AssetHistoryDTO>> getChronological() {
        return ResponseEntity.ok(historyService.getAllHistoryChronological());
    }
}
