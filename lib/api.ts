const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

let _userEmail: string | null = null;
export function setApiUserEmail(email: string | null) {
  _userEmail = email;
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (_userEmail) {
    headers["X-User-Email"] = _userEmail;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Map Java's singular nested objects to match existing frontend types (plural keys from Supabase convention)
function mapAssignment(a: Record<string, unknown>): Record<string, unknown> {
  return { ...a, assets: a.asset, employees: a.employee };
}

function mapHistory(h: Record<string, unknown>): Record<string, unknown> {
  return { ...h, assets: h.asset };
}

// ─── Assets ───────────────────────────────────────

import {
  Asset,
  Employee,
  Assignment,
  AssetHistoryEntry,
  AssetRequest,
  ProfileUpdateRequest,
} from "./types";

export async function getAssets(): Promise<Asset[]> {
  return fetchApi<Asset[]>("/api/assets");
}

export async function getFilteredAssets(filters: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.search && filters.search.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return fetchApi<Asset[]>(`/api/assets${query ? `?${query}` : ""}`);
}

export async function getAsset(id: string): Promise<Asset> {
  return fetchApi<Asset>(`/api/assets/${id}`);
}

export async function getAssetTransitions(id: string): Promise<string[]> {
  return fetchApi<string[]>(`/api/assets/${id}/transitions`);
}

export async function createAsset(data: {
  name: string;
  type: string;
  category: string;
  serial_number: string;
  description?: string;
  image_url?: string | null;
}): Promise<Asset> {
  return fetchApi<Asset>("/api/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAsset(
  id: string,
  data: {
    name?: string;
    type?: string;
    category?: string;
    serial_number?: string;
    description?: string;
    image_url?: string | null;
  }
): Promise<Asset> {
  return fetchApi<Asset>(`/api/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changeAssetStatus(
  id: string,
  data: { new_status: string; reason: string; changed_by: string }
): Promise<Asset> {
  return fetchApi<Asset>(`/api/assets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Employees ────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  return fetchApi<Employee[]>("/api/employees");
}

export async function createEmployee(data: {
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  branch: string;
}): Promise<Employee> {
  return fetchApi<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(
  id: string,
  data: {
    full_name: string;
    email: string;
    phone?: string;
    department: string;
    branch: string;
  }
): Promise<Employee> {
  return fetchApi<Employee>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  return fetchApi<void>(`/api/employees/${id}`, {
    method: "DELETE",
  });
}

export async function inviteEmployee(id: string): Promise<Employee> {
  return fetchApi<Employee>(`/api/employees/${id}/invite`, {
    method: "POST",
  });
}

export async function getMyEmployeeProfile(): Promise<Employee> {
  return fetchApi<Employee>("/api/employees/me");
}

// ─── Assignments ──────────────────────────────────

export async function getActiveAssignments(): Promise<Assignment[]> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    "/api/assignments?activeOnly=true"
  );
  return raw.map(mapAssignment) as unknown as Assignment[];
}

export async function getAssignmentsByAsset(
  assetId: string
): Promise<Assignment[]> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/assignments?assetId=${assetId}`
  );
  return raw.map(mapAssignment) as unknown as Assignment[];
}

export async function getActiveAssignmentsByEmployee(
  employeeId: string
): Promise<Assignment[]> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/assignments?employeeId=${employeeId}&activeOnly=true`
  );
  return raw.map(mapAssignment) as unknown as Assignment[];
}

export async function getAssignmentCounts(): Promise<Record<string, number>> {
  return fetchApi<Record<string, number>>("/api/assignments/counts");
}

export async function assignAsset(
  assetId: string,
  data: { employee_id: string; notes?: string; assigned_by?: string }
): Promise<Assignment> {
  const raw = await fetchApi<Record<string, unknown>>(
    `/api/assignments/${assetId}`,
    { method: "POST", body: JSON.stringify(data) }
  );
  return mapAssignment(raw) as unknown as Assignment;
}

export async function returnAssignment(
  assignmentId: string,
  returnedBy: string
): Promise<Assignment> {
  const raw = await fetchApi<Record<string, unknown>>(
    `/api/assignments/${assignmentId}/return?returnedBy=${encodeURIComponent(returnedBy)}`,
    { method: "PATCH" }
  );
  return mapAssignment(raw) as unknown as Assignment;
}

export async function getAssignmentCountForAsset(
  assetId: string
): Promise<number> {
  return fetchApi<number>(`/api/assignments/count/${assetId}`);
}

// ─── Asset History ────────────────────────────────

export async function getRecentHistory(
  limit: number
): Promise<AssetHistoryEntry[]> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/asset-history?limit=${limit}`
  );
  return raw.map(mapHistory) as unknown as AssetHistoryEntry[];
}

export async function getHistoryByAsset(
  assetId: string
): Promise<AssetHistoryEntry[]> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/asset-history/asset/${assetId}`
  );
  return raw.map(mapHistory) as unknown as AssetHistoryEntry[];
}

export async function getFilteredHistory(
  assetId?: string | null,
  from?: string | null,
  to?: string | null
): Promise<AssetHistoryEntry[]> {
  const params = new URLSearchParams();
  if (assetId) params.set("assetId", assetId);
  if (from) params.set("from", new Date(from).toISOString());
  if (to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    params.set("to", endDate.toISOString());
  }
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/asset-history?${params.toString()}`
  );
  return raw.map(mapHistory) as unknown as AssetHistoryEntry[];
}

export async function getAllHistory(): Promise<AssetHistoryEntry[]> {
  const raw = await fetchApi<Record<string, unknown>[]>("/api/asset-history");
  return raw.map(mapHistory) as unknown as AssetHistoryEntry[];
}

// ─── Analytics ────────────────────────────────────

export interface DashboardSummary {
  total_assets: number;
  status_counts: Record<string, number>;
  category_counts: Record<string, number>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>("/api/analytics/summary");
}

export async function getAssetAging(): Promise<Record<string, number>> {
  return fetchApi<Record<string, number>>("/api/analytics/aging");
}

export async function getDepartmentBreakdown(): Promise<
  Record<string, number>
> {
  return fetchApi<Record<string, number>>("/api/analytics/departments");
}

export async function getStatusTrends(): Promise<Record<string, unknown>[]> {
  return fetchApi<Record<string, unknown>[]>("/api/analytics/trends");
}

export async function getTopReassigned(
  limit = 5
): Promise<
  { id: string; name: string; serial_number: string; assignment_count: number }[]
> {
  const raw = await fetchApi<Record<string, unknown>[]>(
    `/api/analytics/top-reassigned?limit=${limit}`
  );
  return raw.map((item) => ({
    id: String(item.id),
    name: String(item.name),
    serial_number: String(item.serial_number ?? item.serialNumber ?? ""),
    assignment_count: Number(item.assignment_count ?? item.assignmentCount ?? 0),
  }));
}

export interface AlertItem {
  type: string;
  severity: string;
  message: string;
  asset_name: string | null;
  details: string | null;
}

export async function getAlerts(): Promise<AlertItem[]> {
  return fetchApi<AlertItem[]>("/api/analytics/alerts");
}

// ─── User Roles ───────────────────────────────────

export async function getUserRole(
  email: string
): Promise<{ email: string; role: "ADMIN" | "EMPLOYEE" }> {
  return fetchApi(`/api/user-role?email=${encodeURIComponent(email)}`);
}

// ─── Asset Requests ───────────────────────────────

export async function createAssetRequest(data: {
  request_type?: string;
  asset_name?: string;
  asset_type?: string;
  category?: string;
  target_asset_id?: string;
  requested_status?: string;
  justification: string;
  requester_name: string;
}): Promise<AssetRequest> {
  return fetchApi<AssetRequest>("/api/asset-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyAssetRequests(): Promise<AssetRequest[]> {
  return fetchApi<AssetRequest[]>("/api/asset-requests/my");
}

export async function getAllAssetRequests(): Promise<AssetRequest[]> {
  return fetchApi<AssetRequest[]>("/api/asset-requests");
}

export async function reviewAssetRequest(
  id: string,
  data: { status: string; admin_notes: string }
): Promise<AssetRequest> {
  return fetchApi<AssetRequest>(`/api/asset-requests/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getPendingRequestCount(): Promise<number> {
  return fetchApi<number>("/api/asset-requests/pending-count");
}

// ─── Profile Update Requests ───────────────────────

export async function createProfileUpdateRequest(data: {
  full_name_requested?: string;
  phone_requested?: string;
  department_requested?: string;
  branch_requested?: string;
  reason: string;
}): Promise<ProfileUpdateRequest> {
  return fetchApi<ProfileUpdateRequest>("/api/profile-update-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyProfileUpdateRequests(): Promise<ProfileUpdateRequest[]> {
  return fetchApi<ProfileUpdateRequest[]>("/api/profile-update-requests/my");
}

export async function getAllProfileUpdateRequests(): Promise<ProfileUpdateRequest[]> {
  return fetchApi<ProfileUpdateRequest[]>("/api/profile-update-requests");
}

export async function reviewProfileUpdateRequest(
  id: string,
  data: { status: "APPROVED" | "REJECTED"; admin_notes: string }
): Promise<ProfileUpdateRequest> {
  return fetchApi<ProfileUpdateRequest>(`/api/profile-update-requests/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
