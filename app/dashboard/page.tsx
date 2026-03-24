"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import * as api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StateFeedback from "@/components/ui/state-feedback";
import StatusBadge from "@/components/StatusBadge";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import AssetRequestForm from "@/components/AssetRequestForm";
import { useRole } from "@/components/RoleContext";
import { formatDate } from "@/lib/utils";
import { AssetStatus, AssetHistoryEntry, AssetRequest } from "@/lib/types";
import {
  CHART_STATUS_COLORS,
  CHART_CATEGORY_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  Package,
  UserCheck,
  Wrench,
  AlertTriangle,
  XCircle,
  Plus,
  UserPlus,
  Eye,
  FileText,
  Send,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { isAdmin, isEmployee, email, loading: roleLoading } = useRole();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    inRepair: 0,
    lost: 0,
    writtenOff: 0,
  });
  const [categoryData, setCategoryData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [statusData, setStatusData] = useState<
    { name: string; count: number; fill: string }[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<AssetHistoryEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [myRequests, setMyRequests] = useState<AssetRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (roleLoading) return;
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const [summary, history, pending] = await Promise.all([
          api.getDashboardSummary(),
          api.getRecentHistory(10),
          api.getPendingRequestCount().catch(() => 0),
        ]);
        const statusCounts = summary.status_counts ?? {};
        const categoryCounts = summary.category_counts ?? {};

        setStats({
          total: summary.total_assets ?? 0,
          assigned: statusCounts.ASSIGNED ?? 0,
          inRepair: statusCounts.IN_REPAIR ?? 0,
          lost: statusCounts.LOST ?? 0,
          writtenOff: statusCounts.WRITTEN_OFF ?? 0,
        });
        setCategoryData(
          Object.entries(categoryCounts).map(([name, value]) => ({
            name,
            value,
            color:
              CHART_CATEGORY_COLORS[
                name as keyof typeof CHART_CATEGORY_COLORS
              ] || "#8b5cf6",
          }))
        );
        setStatusData(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: STATUS_LABELS[status as AssetStatus] || status,
            count,
            fill: CHART_STATUS_COLORS[status as AssetStatus] || "#6b7280",
          }))
        );
        setPendingCount(pending);
        setMyRequests([]);
        setRecentActivity(history);
      } else {
        const [assets, history, requests] = await Promise.all([
          api.getAssets(),
          api.getRecentHistory(10),
          isEmployee && email
            ? api.getMyAssetRequests().catch(() => [])
            : Promise.resolve([]),
        ]);

        setStats({
          total: assets.length,
          assigned: assets.filter((a) => a.status === "ASSIGNED").length,
          inRepair: assets.filter((a) => a.status === "IN_REPAIR").length,
          lost: assets.filter((a) => a.status === "LOST").length,
          writtenOff: assets.filter((a) => a.status === "WRITTEN_OFF").length,
        });

        const catCounts: Record<string, number> = {};
        assets.forEach((a) => {
          catCounts[a.category] = (catCounts[a.category] || 0) + 1;
        });
        setCategoryData(
          Object.entries(catCounts).map(([name, value]) => ({
            name,
            value,
            color:
              CHART_CATEGORY_COLORS[
                name as keyof typeof CHART_CATEGORY_COLORS
              ] || "#8b5cf6",
          }))
        );

        const statusCounts: Record<string, number> = {};
        assets.forEach((a) => {
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });
        setStatusData(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: STATUS_LABELS[status as AssetStatus] || status,
            count,
            fill: CHART_STATUS_COLORS[status as AssetStatus] || "#6b7280",
          }))
        );
        setRecentActivity(history);
        setPendingCount(0);
        setMyRequests(requests.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Unable to load dashboard data. Please retry to restore visibility.");
    } finally {
      setLoading(false);
    }
  }, [roleLoading, isAdmin, isEmployee, email]);

  useEffect(() => {
    if (!roleLoading) {
      loadDashboard();
    }
  }, [roleLoading, loadDashboard]);

  const handleRefresh = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRequestSuccess = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading || roleLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl p-6">
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? t("dashboard.adminSubtitle")
                : t("dashboard.employeeSubtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Link href="/assets">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> {t("dashboard.addAsset")}
                    </Button>
                </Link>
                <Link href="/employees">
                    <Button size="sm" variant="outline" className="gap-2">
                      <UserPlus className="h-4 w-4" /> {t("dashboard.addEmployee")}
                    </Button>
                </Link>
              </>
            )}
            {isEmployee && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowRequestForm(true)}
              >
                <Send className="h-4 w-4" /> {t("dashboard.requestAsset")}
              </Button>
            )}
            <Link href="/assets">
              <Button size="sm" variant="outline" className="gap-2">
                <Eye className="h-4 w-4" /> {t("dashboard.viewAll")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
          <StatsCard
            title={t("dashboard.totalAssets")}
            value={stats.total}
            icon={Package}
            color="text-gold-400"
          />
          <StatsCard
            title={t("dashboard.assigned")}
            value={stats.assigned}
            icon={UserCheck}
            color="text-blue-400"
          />
          <StatsCard
            title={t("dashboard.inRepair")}
            value={stats.inRepair}
            icon={Wrench}
            color="text-yellow-400"
          />
          <StatsCard
            title={t("dashboard.lost")}
            value={stats.lost}
            icon={AlertTriangle}
            color="text-red-400"
          />
          <StatsCard
            title={t("dashboard.writtenOff")}
            value={stats.writtenOff}
            icon={XCircle}
            color="text-gray-400"
          />
          {isAdmin && (
            <Link href="/requests">
              <StatsCard
                title={t("dashboard.pendingRequests")}
                value={pendingCount}
                icon={FileText}
                color="text-orange-400"
              />
            </Link>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("dashboard.assetsByCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <StateFeedback
                  className="h-[260px]"
                  title="No category breakdown yet"
                  description="Add assets to start seeing category-level inventory distribution."
                />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("dashboard.assetsByStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <StateFeedback
                  className="h-[260px]"
                  title="No status movement yet"
                  description="Status charts will appear once assets are registered and processed."
                />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee: My Recent Requests */}
        {isEmployee && myRequests.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.myRecentRequests")}
              </CardTitle>
              <Link href="/requests">
                <Button variant="ghost" size="sm">
                  {t("dashboard.viewAll")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{req.asset_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.asset_type} · {req.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RequestStatusBadge status={req.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("dashboard.recentActivity")}
              </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <StateFeedback
                title="No activity recorded yet"
                description="Recent status and custody actions will appear here to support audit readiness."
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {entry.old_status && (
                          <>
                            <StatusBadge status={entry.old_status} />
                            <span className="text-xs text-muted-foreground">
                              →
                            </span>
                          </>
                        )}
                        <StatusBadge status={entry.new_status} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.assets?.name || "Unknown Asset"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {entry.changed_by}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.changed_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <StateFeedback
            title="Dashboard temporarily unavailable"
            description={error}
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        )}
      </main>

      {/* Employee: Asset Request Form */}
      <AssetRequestForm
        open={showRequestForm}
        onOpenChange={setShowRequestForm}
        onSuccess={handleRequestSuccess}
      />
    </>
  );
}
