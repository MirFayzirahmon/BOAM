"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StateFeedback from "@/components/ui/state-feedback";
import { AssetHistoryEntry, Asset } from "@/lib/types";
import { formatDate, downloadCSV } from "@/lib/utils";
import { Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AuditPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AssetHistoryEntry[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetFilter, setAssetFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAuditEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFilteredHistory(
        assetFilter !== "all" ? assetFilter : null,
        dateFrom || null,
        dateTo || null
      );
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError("Could not load audit history. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [assetFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadAuditEntries();
  }, [loadAuditEntries]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const assetsData = await api.getAssets();
        setAssets(assetsData);
      } catch (err) {
        console.error(err);
      }
    };
    loadAssets();
  }, []);

  const handleExportCSV = () => {
    const csvData = entries.map((e) => ({
      "Asset Name": e.assets?.name || "",
      "Old Status": e.old_status || "—",
      "New Status": e.new_status,
      "Changed By": e.changed_by,
      Date: formatDate(e.changed_at),
      Reason: e.reason,
      Notes: e.notes || "",
    }));
    downloadCSV(csvData, `audit-log-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const hasFilters = assetFilter !== "all" || !!dateFrom || !!dateTo;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("audit.subtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCSV}
            disabled={entries.length === 0}
          >
            <Download className="h-4 w-4" /> {t("audit.exportCsv")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={t("common.allAssets")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t("common.allAssets")}</SelectItem>
              {assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">{t("common.from")}</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">{t("common.to")}</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAssetFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
               {t("common.clearFilters")}
            </Button>
          )}
        </div>

        {/* Audit Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.asset")}
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.oldStatus")}
                      </th>
                      <th className="p-3 text-center text-xs font-medium text-muted-foreground"></th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.newStatus")}
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.changedBy")}
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.dateTime")}
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                        {t("audit.reason")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-muted-foreground"
                        >
                          {hasFilters
                            ? t("audit.noEntriesFiltered")
                            : t("audit.noEntries")}
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-border/30 transition-colors hover:bg-muted/30"
                        >
                          <td className="p-3 text-sm font-medium">
                            {entry.assets?.name || "—"}
                          </td>
                          <td className="p-3">
                            {entry.old_status ? (
                              <StatusBadge status={entry.old_status} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            →
                          </td>
                          <td className="p-3">
                            <StatusBadge status={entry.new_status} />
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {entry.changed_by}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDate(entry.changed_at)}
                          </td>
                          <td className="p-3 text-sm">{entry.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && entries.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Export includes visible filtered rows to support case files and oversight checks.
          </p>
        )}

        {error && (
          <StateFeedback
            title="Audit feed unavailable"
            description={error}
            actionLabel="Retry"
            onAction={loadAuditEntries}
          />
        )}
      </main>
    </>
  );
}
