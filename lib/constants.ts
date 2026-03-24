import { AssetStatus, AssetCategory } from "./types";

export const STATUS_COLORS: Record<AssetStatus, string> = {
  REGISTERED: "bg-green-600 text-white",
  ASSIGNED: "bg-blue-600 text-white",
  IN_REPAIR: "bg-yellow-600 text-black",
  LOST: "bg-red-600 text-white",
  WRITTEN_OFF: "bg-gray-600 text-white",
};

export const STATUS_DOT_COLORS: Record<AssetStatus, string> = {
  REGISTERED: "bg-green-500",
  ASSIGNED: "bg-blue-500",
  IN_REPAIR: "bg-yellow-500",
  LOST: "bg-red-500",
  WRITTEN_OFF: "bg-gray-500",
};

export const CHART_STATUS_COLORS: Record<AssetStatus, string> = {
  REGISTERED: "#22c55e",
  ASSIGNED: "#3b82f6",
  IN_REPAIR: "#eab308",
  LOST: "#ef4444",
  WRITTEN_OFF: "#6b7280",
};

export const CHART_CATEGORY_COLORS: Record<AssetCategory, string> = {
  IT: "#3b82f6",
  Office: "#eab308",
  Security: "#ef4444",
  Other: "#8b5cf6",
};

export const CATEGORIES: AssetCategory[] = ["IT", "Office", "Security", "Other"];

export const STATUSES: AssetStatus[] = [
  "REGISTERED",
  "ASSIGNED",
  "IN_REPAIR",
  "LOST",
  "WRITTEN_OFF",
];

export const STATUS_LABELS: Record<AssetStatus, string> = {
  REGISTERED: "Registered",
  ASSIGNED: "Assigned",
  IN_REPAIR: "In Repair",
  LOST: "Lost",
  WRITTEN_OFF: "Written Off",
};

export const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  REGISTERED: ["ASSIGNED", "IN_REPAIR"],
  ASSIGNED: ["REGISTERED", "IN_REPAIR", "LOST"],
  IN_REPAIR: ["REGISTERED", "ASSIGNED", "WRITTEN_OFF"],
  LOST: ["WRITTEN_OFF"],
  WRITTEN_OFF: [],
};
