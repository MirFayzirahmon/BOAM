import { formatDate } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { AssetHistoryEntry } from "@/lib/types";

interface AuditLogRowProps {
  entry: AssetHistoryEntry;
  assetName?: string;
}

export default function AuditLogRow({ entry, assetName }: AuditLogRowProps) {
  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/50">
      <td className="p-3 text-sm font-medium">
        {assetName || entry.assets?.name || "—"}
      </td>
      <td className="p-3">
        {entry.old_status ? (
          <StatusBadge status={entry.old_status} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 text-center text-muted-foreground">→</td>
      <td className="p-3">
        <StatusBadge status={entry.new_status} />
      </td>
      <td className="p-3 text-sm text-muted-foreground">{entry.changed_by}</td>
      <td className="p-3 text-sm text-muted-foreground">
        {formatDate(entry.changed_at)}
      </td>
      <td className="p-3 text-sm">{entry.reason}</td>
    </tr>
  );
}
