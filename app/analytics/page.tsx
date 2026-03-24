"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AIAlerts from "@/components/AIAlerts";
import * as api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Asset, AssetHistoryEntry } from "@/lib/types";
import { CHART_STATUS_COLORS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n";

const COLORS = ["#3b82f6", "#eab308", "#ef4444", "#22c55e", "#8b5cf6", "#f97316"];

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [agingData, setAgingData] = useState<{ name: string; count: number }[]>(
    []
  );
  const [deptData, setDeptData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [trendData, setTrendData] = useState<Record<string, unknown>[]>([]);
  const [topReassigned, setTopReassigned] = useState<
    { name: string; serial: string; count: number }[]
  >([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [aging, deptBreakdown, trends, topReassignedData] = await Promise.all([
        api.getAssetAging(),
        api.getDepartmentBreakdown(),
        api.getStatusTrends(),
        api.getTopReassigned(5),
      ]);

      const agingLabels: Record<string, string> = {
        lessThan1Year: "< 1 year",
        oneToTwoYears: "1-2 years",
        twoToThreeYears: "2-3 years",
        moreThan3Years: "3+ years",
        less_than1_year: "< 1 year",
        one_to_two_years: "1-2 years",
        two_to_three_years: "2-3 years",
        more_than3_years: "3+ years",
      };
      setAgingData(
        Object.entries(aging).map(([key, count]) => ({
          name: agingLabels[key] || key,
          count: count as number,
        }))
      );

      setDeptData(
        Object.entries(deptBreakdown).map(([name, value], i) => ({
          name,
          value: value as number,
          color: COLORS[i % COLORS.length],
        }))
      );

      setTrendData(trends as Record<string, unknown>[]);

      setTopReassigned(
        topReassignedData.map((item) => ({
          name: item.name,
          serial: item.serial_number,
          count: item.assignment_count,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
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
        <div>
          <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("analytics.subtitle")}
          </p>
        </div>

        {/* AI Alerts */}
        <AIAlerts />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Asset Aging */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("analytics.assetAgingDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={agingData}>
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
                  <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("analytics.assetsByDepartment")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {deptData.map((entry, index) => (
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
            </CardContent>
          </Card>

          {/* Status Trends Over Time */}
          <Card className="border-border/50 bg-card/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t("analytics.statusTrends")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="REGISTERED"
                    stroke={CHART_STATUS_COLORS.REGISTERED}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ASSIGNED"
                    stroke={CHART_STATUS_COLORS.ASSIGNED}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="IN_REPAIR"
                    stroke={CHART_STATUS_COLORS.IN_REPAIR}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="LOST"
                    stroke={CHART_STATUS_COLORS.LOST}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="WRITTEN_OFF"
                    stroke={CHART_STATUS_COLORS.WRITTEN_OFF}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Most Reassigned Assets */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("analytics.topReassigned")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead className="text-center">
                    {t("analytics.totalAssignments")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReassigned.map((item, i) => (
                  <TableRow key={item.serial}>
                    <TableCell className="font-bold text-gold-400">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.serial}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-400/10 text-sm font-bold text-gold-400">
                        {item.count}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
