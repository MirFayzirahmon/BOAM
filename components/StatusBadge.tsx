import { AssetStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
