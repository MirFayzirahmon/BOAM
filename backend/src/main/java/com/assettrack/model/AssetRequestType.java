package com.assettrack.model;

public enum AssetRequestType {
    EXISTING_ASSET_ASSIGNMENT,
    NEW_ASSET_PURCHASE,
    STATUS_CHANGE;

    public static AssetRequestType fromNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return NEW_ASSET_PURCHASE;
        }
        return AssetRequestType.valueOf(raw.trim().toUpperCase());
    }
}
