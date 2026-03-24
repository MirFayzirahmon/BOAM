"use client";

import { RequestStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  RequestStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    label: "Pending",
  },
  APPROVED: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    label: "Approved",
  },
  REJECTED: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    label: "Rejected",
  },
};

export default function RequestStatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
