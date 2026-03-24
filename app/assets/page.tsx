"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import AssetForm from "@/components/AssetForm";
import ChangeStatusModal from "@/components/ChangeStatusModal";
import QRModal from "@/components/QRModal";
import { useRole } from "@/components/RoleContext";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StateFeedback from "@/components/ui/state-feedback";
import { Asset, Assignment } from "@/lib/types";
import { CATEGORIES, STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDateShort } from "@/lib/utils";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AssetsPage() {
  const { isAdmin, email, loading: roleLoading } = useRole();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [statusAsset, setStatusAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadAssets = useCallback(async () => {
    if (roleLoading || (!isAdmin && !email)) return;

    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const [assetsData, assignData] = await Promise.all([
          api.getFilteredAssets({
            status: statusFilter,
            category: categoryFilter,
            search: debouncedSearch,
          }),
          api.getActiveAssignments(),
        ]);
        setAssets(assetsData);
        setAssignments(assignData);
      } else {
        const profile = await api.getMyEmployeeProfile();
        const myAssignments = await api.getActiveAssignmentsByEmployee(profile.id);

        const myAssets = myAssignments
          .map((assignment) => assignment.assets)
          .filter((asset): asset is Asset => Boolean(asset));

        setAssignments(myAssignments);
        setAssets(myAssets);
      }
    } catch (err) {
      console.error(err);
      setError(
        isAdmin
          ? "Could not load assets and assignments. Please try again."
          : "Could not load your active assignments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    roleLoading,
    isAdmin,
    email,
    statusFilter,
    categoryFilter,
    debouncedSearch,
  ]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const assignmentByAssetId = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments.forEach((assignment) => {
      map[assignment.asset_id] = assignment;
    });
    return map;
  }, [assignments]);

  const visibleAssets = useMemo(() => {
    if (isAdmin) return assets;

    const searchText = debouncedSearch.trim().toLowerCase();
    return assets.filter((asset) => {
      const serial = asset.serial_number?.toLowerCase() || "";
      const name = asset.name?.toLowerCase() || "";
      if (searchText && !name.includes(searchText) && !serial.includes(searchText)) {
        return false;
      }
      if (statusFilter !== "all" && asset.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "all" && asset.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [isAdmin, assets, debouncedSearch, statusFilter, categoryFilter]);

  const hasActiveFilters =
    !!search.trim() || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isAdmin ? t("assets.titleAdmin") : t("assets.titleEmployee")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? t("assets.subtitleAdmin")
                : t("assets.subtitleEmployee")}
            </p>
          </div>
          {isAdmin && (
            <Button
              className="gap-2"
              onClick={() => {
                setEditAsset(null);
                setShowAssetForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> {t("assets.addAsset")}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder={t("assets.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("common.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("common.allCategories")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t("common.allCategories")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table / State */}
        {loading ? (
          isAdmin ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : (
            <StateFeedback
              title={t("assets.loadingTitle")}
              description={t("assets.loadingDescription")}
            />
          )
        ) : error ? (
          <StateFeedback
            title={isAdmin ? t("assets.unavailableAdmin") : t("assets.unavailableEmployee")}
            description={error}
            actionLabel="Retry"
            onAction={loadAssets}
          />
        ) : !isAdmin && visibleAssets.length === 0 ? (
          <StateFeedback
            title={t("assets.noAssignedTitle")}
            description={
              hasActiveFilters
                ? t("assets.noAssignedFiltered")
                : t("assets.noAssigned")
            }
          />
        ) : (
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("assets.name")}</TableHead>
                  <TableHead>{t("assets.category")}</TableHead>
                  <TableHead>{t("assets.serialNumber")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  {isAdmin ? (
                    <TableHead>{t("assets.assignedTo")}</TableHead>
                  ) : (
                    <TableHead>{t("assets.assignedOn")}</TableHead>
                  )}
                  <TableHead>{isAdmin ? t("assets.lastUpdated") : t("common.notes")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAssets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                        {hasActiveFilters
                          ? t("assets.noAssetsFiltered")
                          : t("assets.noAssets")}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleAssets.map((asset) => {
                    const assignment = assignmentByAssetId[asset.id];
                    const assignedAt = assignment?.assigned_at || null;
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {asset.category}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {asset.serial_number}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={asset.status} />
                        </TableCell>
                          {isAdmin ? (
                            <TableCell className="text-muted-foreground">
                              {
                                (assignment?.employees as unknown as { full_name: string })
                                  ?.full_name || "—"
                              }
                            </TableCell>
                          ) : (
                          <TableCell className="text-muted-foreground">
                            {assignedAt ? formatDateShort(assignedAt) : "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground">
                          {isAdmin ? formatDateShort(asset.updated_at) : assignment?.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/assets/${asset.id}`}>
                              <Button variant="ghost" size="icon" title={t("assets.view")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                   title={t("assets.edit")}
                                  onClick={() => {
                                    setEditAsset(asset);
                                    setShowAssetForm(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                   title={t("assets.changeStatus")}
                                  onClick={() => setStatusAsset(asset)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                               title={t("assets.qrCode")}
                              onClick={() => setQrAsset(asset)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modals — only for admins */}
        {isAdmin && (
          <AssetForm
            open={showAssetForm}
            onOpenChange={setShowAssetForm}
            asset={editAsset}
            onSuccess={loadAssets}
          />
        )}

        {isAdmin && statusAsset && (
          <ChangeStatusModal
            open={!!statusAsset}
            onOpenChange={(open) => !open && setStatusAsset(null)}
            asset={statusAsset}
            onSuccess={loadAssets}
          />
        )}

        {qrAsset && (
          <QRModal
            open={!!qrAsset}
            onOpenChange={(open) => !open && setQrAsset(null)}
            data={{
              assetId: qrAsset.id,
              name: qrAsset.name,
              serialNumber: qrAsset.serial_number,
                status: qrAsset.status,
                currentOwner:
                  (
                    assignmentByAssetId[qrAsset.id]?.employees as unknown as {
                      full_name?: string;
                    }
                  )?.full_name || null,
              }}
            />
          )}
      </main>
    </>
  );
}
