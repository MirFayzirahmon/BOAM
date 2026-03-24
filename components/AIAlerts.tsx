"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  TrendingDown,
  Activity,
  Sparkles,
} from "lucide-react";

interface Alert {
  id: string;
  severity: "high" | "medium" | "low";
  icon: React.ReactNode;
  message: string;
  details?: string | null;
}

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  REPAIR_OVERDUE: <Clock className="h-4 w-4" />,
  DEPT_LOSS_PATTERN: <ShieldAlert className="h-4 w-4" />,
  ASSET_AGING: <TrendingDown className="h-4 w-4" />,
  FREQUENT_REASSIGNMENT: <AlertTriangle className="h-4 w-4" />,
  RECENT_WRITEOFF: <Activity className="h-4 w-4" />,
  PREDICTIVE_REPLACEMENT_PRIORITY: <Sparkles className="h-4 w-4" />,
};

function normalizeSeverity(
  severity?: string
): "high" | "medium" | "low" {
  if (!severity) return "medium";
  if (severity === "critical") return "high";
  if (severity === "high" || severity === "medium" || severity === "low") {
    return severity;
  }
  return "medium";
}

export default function AIAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(
        data.map((a, i) => ({
          id: `alert-${i}`,
          severity: normalizeSeverity(a.severity),
          icon: SEVERITY_ICONS[a.type] || <AlertTriangle className="h-4 w-4" />,
          message: a.message,
          details: a.details,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    high: "border-red-500/30 bg-red-500/5 text-red-400",
    medium: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    low: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  };

  const severityLabels = {
    high: "HIGH",
    medium: "MED",
    low: "LOW",
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold-400">
          <AlertTriangle className="h-5 w-5" />
          AI Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ No risk alerts at this time. All assets look good!
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${severityColors[alert.severity]}`}
                >
                  <div className="mt-0.5">{alert.icon}</div>
                  <div className="flex-1 text-sm">
                    <p>{alert.message}</p>
                    {alert.details ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {alert.details}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-background/50 px-2 py-0.5 text-[10px] font-bold">
                    {severityLabels[alert.severity]}
                  </span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
