"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import AssetRequestForm from "@/components/AssetRequestForm";
import { useRole } from "@/components/RoleContext";
import * as api from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import StateFeedback from "@/components/ui/state-feedback";
import { AssetRequest, RequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_ASSET_PURCHASE: "New Purchase",
  EXISTING_ASSET_ASSIGNMENT: "Existing Assignment",
  STATUS_CHANGE: "Status Change",
};

export default function RequestsPage() {
  const { isAdmin, isEmployee, email, loading: roleLoading } = useRole();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewingRequest, setReviewingRequest] = useState<AssetRequest | null>(
    null
  );
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const data = await api.getAllAssetRequests();
        setRequests(data);
      } else {
        const data = await api.getMyAssetRequests();
        setRequests(data);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
      setError("Unable to load request data. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [email, isAdmin]);

  useEffect(() => {
    if (!roleLoading && email) {
      loadRequests();
    }
  }, [roleLoading, email, loadRequests]);

  const handleReview = async () => {
    if (!reviewingRequest || !email) return;
    setSubmitting(true);
    try {
      await api.reviewAssetRequest(reviewingRequest.id, {
        status: reviewAction,
        admin_notes: adminNotes,
      });
      toast.success(
        reviewAction === "APPROVED"
          ? t("requests.requestApprovedSuccess")
          : t("requests.requestRejectedSuccess")
      );
      setReviewingRequest(null);
      setAdminNotes("");
      loadRequests();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to review request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? requests
        : requests.filter((r) => r.status === statusFilter),
    [requests, statusFilter]
  );

  if (roleLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl p-6">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
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
              <h1 className="text-2xl font-bold">
                {isAdmin ? t("requests.titleAdmin") : t("requests.titleEmployee")}
              </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? t("requests.subtitleAdmin")
                : t("requests.subtitleEmployee")}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("common.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {isEmployee && (
              <Button className="gap-2" onClick={() => setShowForm(true)}>
                <Send className="h-4 w-4" /> {t("requests.newRequest")}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>{t("requests.requester")}</TableHead>}
                  <TableHead>{t("requests.requestType")}</TableHead>
                  <TableHead>{t("requests.assetName")}</TableHead>
                  <TableHead>{t("requests.target")}</TableHead>
                  <TableHead>{t("requests.requestedStatus")}</TableHead>
                  <TableHead>{t("requests.rationale")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 9 : 7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {requests.length === 0
                          ? isAdmin
                            ? t("requests.noRequestsAdmin")
                            : t("requests.noRequestsEmployee")
                        : t("requests.noRequestsFiltered")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((req) => (
                    <TableRow key={req.id}>
                      {isAdmin && (
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {req.requester_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {req.requester_email}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                      </TableCell>
                      <TableCell className="font-medium">
                        {req.asset_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.target_asset_id ? req.target_asset_id.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.requested_status ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {req.justification}
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(req.created_at)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("requests.approve")}
                                className="text-green-400 hover:text-green-300"
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setReviewAction("APPROVED");
                                  setAdminNotes("");
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("requests.reject")}
                                className="text-red-400 hover:text-red-300"
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setReviewAction("REJECTED");
                                  setAdminNotes("");
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {req.reviewed_by &&
                                `${t("requests.byPrefix")} ${req.reviewed_by}`}
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Admin notes for reviewed requests */}
        {!isAdmin &&
          filtered.some((r) => r.admin_notes) && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {t("requests.adminFeedback")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filtered
                  .filter((r) => r.admin_notes)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border/30 bg-muted/20 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {r.asset_name}
                        </span>
                        <RequestStatusBadge status={r.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.admin_notes}
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

        {error && (
          <StateFeedback
            title="Request queue unavailable"
            description={error}
            actionLabel="Retry"
            onAction={loadRequests}
          />
        )}
      </main>

      {/* Employee: Request form */}
      <AssetRequestForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadRequests}
      />

      {/* Admin: Review dialog */}
      <Dialog
        open={!!reviewingRequest}
        onOpenChange={(open) => !open && setReviewingRequest(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED"
                ? t("requests.approveRequest")
                : t("requests.rejectRequest")}
            </DialogTitle>
          </DialogHeader>
          {reviewingRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                <p className="text-sm font-medium">
                  {reviewingRequest.asset_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {REQUEST_TYPE_LABELS[reviewingRequest.request_type] ??
                    reviewingRequest.request_type}
                </p>
                {reviewingRequest.target_asset_id && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("requests.targetAsset")} {reviewingRequest.target_asset_id}
                  </p>
                )}
                {reviewingRequest.requested_status && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("requests.requestedStatus")}: {reviewingRequest.requested_status}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("requests.requestedBy")} {reviewingRequest.requester_name} (
                  {reviewingRequest.requester_email})
                </p>
                <p className="mt-1 text-sm">{reviewingRequest.justification}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-notes">
                  {reviewAction === "REJECTED"
                    ? t("requests.adminNotesRequired")
                    : t("requests.adminNotes")}
                </Label>
                <textarea
                  id="admin-notes"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    reviewAction === "APPROVED"
                      ? t("requests.approveNotesPlaceholder")
                      : t("requests.rejectNotesPlaceholder")
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewingRequest(null)}
                >
                    {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={submitting}
                  className={
                    reviewAction === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                    {submitting
                      ? t("requests.processing")
                      : reviewAction === "APPROVED"
                      ? t("requests.approve")
                      : t("requests.reject")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
