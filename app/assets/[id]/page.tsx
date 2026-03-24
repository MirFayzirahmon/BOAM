"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import ChangeStatusModal from "@/components/ChangeStatusModal";
import AssignModal from "@/components/AssignModal";
import QRModal from "@/components/QRModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createClient } from "@/lib/supabase";
import * as api from "@/lib/api";
import { useRole } from "@/components/RoleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import StateFeedback from "@/components/ui/state-feedback";
import { Asset, Assignment, AssetHistoryEntry } from "@/lib/types";
import { STATUS_TRANSITIONS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  UserPlus,
  RotateCcw,
  Wrench,
  AlertTriangle,
  XCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useRole();
  const assetId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [currentAssignee, setCurrentAssignee] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [history, setHistory] = useState<AssetHistoryEntry[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAsset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assetData = await api.getAsset(assetId);
      if (!assetData) {
        setAsset(null);
        setError("Asset record was not found or is no longer available.");
        return;
      }
      setAsset(assetData);

      const allAssigns = await api.getAssignmentsByAsset(assetId);
      const activeAssign = allAssigns.find((a) => !a.returned_at);
      setCurrentAssignee(
        (activeAssign?.employees as unknown as { full_name: string })
          ?.full_name || null
      );
      setAssignments(allAssigns);

      const historyData = await api.getHistoryByAsset(assetId);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setAsset(null);
      setError("Could not load this asset record. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const handleReturn = async () => {
    if (!asset || !isAdmin) return;
    setReturnLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const activeAssignment = assignments.find((a) => !a.returned_at);
      if (activeAssignment) {
        await api.returnAssignment(activeAssignment.id, user?.email || "system");
      }

      toast.success("Asset returned successfully");
      setShowReturnConfirm(false);
      loadAsset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setReturnLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl space-y-6 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </>
    );
  }

  if (!asset) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl space-y-6 p-6">
          <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push("/assets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
          <StateFeedback
            title="Unable to open asset"
            description={
              error ||
              "This asset page is temporarily unavailable. Retry to restore chain-of-custody details."
            }
            actionLabel="Retry"
            onAction={loadAsset}
          />
        </main>
      </>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[asset.status];
  const canAssign =
    allowedTransitions.includes("ASSIGNED") && asset.status !== "ASSIGNED";
  const canReturn = asset.status === "ASSIGNED";
  const isTerminal = asset.status === "WRITTEN_OFF";

  const qrData = {
    assetId: asset.id,
    name: asset.name,
    serialNumber: asset.serial_number,
    status: asset.status,
    currentOwner: currentAssignee,
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <p className="text-sm text-muted-foreground">
              {asset.type} — {asset.serial_number} · Lifecycle and custody record
            </p>
          </div>
        </div>

        {/* Asset Details + QR Code */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Asset Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{asset.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={asset.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Current Assignee
                  </p>
                  <p className="font-medium">{currentAssignee || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Serial Number</p>
                  <p className="font-mono text-sm">{asset.serial_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{asset.description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered</p>
                  <p className="text-sm">{formatDate(asset.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(asset.updated_at)}</p>
                </div>
              </div>

              <Separator />

              {/* Action buttons based on status rules */}
              {isAdmin && !isTerminal && (
                <div className="flex flex-wrap gap-2">
                  {canAssign && (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowAssignModal(true)}
                    >
                      <UserPlus className="h-4 w-4" /> Assign
                    </Button>
                  )}
                  {canReturn && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowReturnConfirm(true)}
                    >
                      <RotateCcw className="h-4 w-4" /> Return
                    </Button>
                  )}
                  {allowedTransitions.includes("IN_REPAIR") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowStatusModal(true)}
                    >
                      <Wrench className="h-4 w-4" /> Change Status
                    </Button>
                  )}
                  {allowedTransitions.includes("LOST") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-red-400"
                      onClick={() => setShowStatusModal(true)}
                    >
                      <AlertTriangle className="h-4 w-4" /> Mark Lost
                    </Button>
                  )}
                  {allowedTransitions.includes("WRITTEN_OFF") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-gray-400"
                      onClick={() => setShowStatusModal(true)}
                    >
                      <XCircle className="h-4 w-4" /> Write Off
                    </Button>
                  )}
                </div>
              )}
              {!isAdmin && (
                <p className="text-sm text-muted-foreground italic">
                  Asset lifecycle actions are admin-managed. Use the Requests page
                  for any needed changes.
                </p>
              )}
              {isTerminal && (
                <p className="text-sm text-muted-foreground italic">
                  This asset has been written off. No further actions available.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                QR Code
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQRModal(true)}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG
                  value={JSON.stringify(qrData)}
                  size={160}
                  level="M"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment History */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Assignment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No assignment history recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {(a.employees as unknown as { full_name: string })
                          ?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(
                          a.employees as unknown as { department: string }
                        )?.department || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(a.assigned_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.returned_at ? (
                          formatDate(a.returned_at)
                        ) : (
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Change History */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Status Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Old Status</TableHead>
                  <TableHead></TableHead>
                  <TableHead>New Status</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No status changes recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        {h.old_status ? (
                          <StatusBadge status={h.old_status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        →
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={h.new_status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {h.changed_by}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(h.changed_at)}
                      </TableCell>
                      <TableCell className="text-sm">{h.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modals */}
        {isAdmin && showStatusModal && (
          <ChangeStatusModal
            open={showStatusModal}
            onOpenChange={setShowStatusModal}
            asset={asset}
            onSuccess={loadAsset}
          />
        )}

        {isAdmin && showAssignModal && (
          <AssignModal
            open={showAssignModal}
            onOpenChange={setShowAssignModal}
            asset={asset}
            onSuccess={loadAsset}
          />
        )}

        {showQRModal && (
          <QRModal
            open={showQRModal}
            onOpenChange={setShowQRModal}
            data={qrData}
          />
        )}

        {isAdmin && (
          <ConfirmDialog
            open={showReturnConfirm}
            onOpenChange={setShowReturnConfirm}
            title="Return Asset"
            description={`Return "${asset.name}" and mark it as Registered to keep custody records accurate?`}
            onConfirm={handleReturn}
            loading={returnLoading}
            variant="default"
          />
        )}
      </main>
    </>
  );
}
