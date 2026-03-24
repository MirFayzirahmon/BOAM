export type AssetStatus = "REGISTERED" | "ASSIGNED" | "IN_REPAIR" | "LOST" | "WRITTEN_OFF";
export type AssetCategory = "IT" | "Office" | "Security" | "Other";

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: AssetCategory;
  serial_number: string;
  description: string;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department: string;
  branch: string;
  status: "ACTIVE" | "PENDING_INVITE" | "INACTIVE";
  invited_by?: string | null;
  invited_at?: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_at: string;
  returned_at: string | null;
  notes: string | null;
  assets?: Asset;
  employees?: Employee;
}

export interface AssetHistoryEntry {
  id: string;
  asset_id: string;
  changed_by: string;
  old_status: AssetStatus | null;
  new_status: AssetStatus;
  changed_at: string;
  reason: string;
  notes: string | null;
  assets?: Asset;
}

export interface Department {
  id: string;
  name: string;
  branch: string;
}

export interface AssetWithAssignment extends Asset {
  current_assignee?: string | null;
}

export type UserRoleType = "ADMIN" | "EMPLOYEE";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AssetRequestType =
  | "EXISTING_ASSET_ASSIGNMENT"
  | "NEW_ASSET_PURCHASE"
  | "STATUS_CHANGE";

export interface UserRole {
  email: string;
  role: UserRoleType;
}

export interface AssetRequest {
  id: string;
  requester_email: string;
  requester_name: string;
  request_type: AssetRequestType;
  asset_name: string;
  asset_type: string;
  category: string;
  target_asset_id: string | null;
  requested_status: AssetStatus | null;
  justification: string;
  status: RequestStatus;
  procurement_required: boolean;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ProfileUpdateRequest {
  id: string;
  employee_email: string;
  full_name_requested: string | null;
  phone_requested: string | null;
  department_requested: string | null;
  branch_requested: string | null;
  reason: string;
  status: RequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}
