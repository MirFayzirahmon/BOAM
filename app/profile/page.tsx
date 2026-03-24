"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useRole } from "@/components/RoleContext";
import { createClient } from "@/lib/supabase";
import { setApiUserEmail } from "@/lib/api";
import * as api from "@/lib/api";
import { Employee, ProfileUpdateRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const { email, role, isAdmin, isEmployee, loading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [reviewingRequest, setReviewingRequest] = useState<ProfileUpdateRequest | null>(
    null
  );
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [form, setForm] = useState({
    full_name_requested: "",
    phone_requested: "",
    department_requested: "",
    branch_requested: "",
    reason: "",
  });

  const loadProfile = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const requestLoader = isAdmin
        ? api.getAllProfileUpdateRequests()
        : api.getMyProfileUpdateRequests();
      const [employeeData, requestData] = await Promise.all([
        api.getMyEmployeeProfile().catch(() => null),
        requestLoader,
      ]);
      setEmployee(employeeData);
      setRequests(requestData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [email, isAdmin]);

  useEffect(() => {
    if (!roleLoading && email) {
      loadProfile();
    }
  }, [roleLoading, email, loadProfile]);

  const hasRequestedChange = useMemo(
    () =>
      !!(
        form.full_name_requested.trim() ||
        form.phone_requested.trim() ||
        form.department_requested.trim() ||
        form.branch_requested.trim()
      ),
    [form]
  );

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRequestedChange) {
      toast.error(t("profile.provideAtLeastOne"));
      return;
    }
    if (!form.reason.trim()) {
      toast.error(t("profile.provideReason"));
      return;
    }
    setSubmitting(true);
    try {
      await api.createProfileUpdateRequest({
        full_name_requested: form.full_name_requested || undefined,
        phone_requested: form.phone_requested || undefined,
        department_requested: form.department_requested || undefined,
        branch_requested: form.branch_requested || undefined,
        reason: form.reason,
      });
      toast.success(t("profile.requestSubmitted"));
      setForm({
        full_name_requested: "",
        phone_requested: "",
        department_requested: "",
        branch_requested: "",
        reason: "",
      });
      loadProfile();
    } catch (err) {
      toast.error(
          err instanceof Error ? err.message : t("profile.submitFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async () => {
    if (!reviewingRequest) return;
    setSubmitting(true);
    try {
      await api.reviewProfileUpdateRequest(reviewingRequest.id, {
        status: reviewAction,
        admin_notes: adminNotes,
      });
      toast.success(
        reviewAction === "APPROVED"
          ? t("profile.requestApproved")
          : t("profile.requestRejected")
      );
      setReviewingRequest(null);
      setAdminNotes("");
      loadProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setApiUserEmail(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t("profile.signOutFailed"));
      setLoggingOut(false);
      return;
    }
    toast.success(t("profile.signOutSuccess"));
    router.push("/login");
  };

  if (roleLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl space-y-4 p-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t("profile.subtitleAdmin") : t("profile.subtitleEmployee")}
          </p>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("profile.account")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.email")}</p>
              <p className="font-medium">{email || "—"}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.role")}</p>
              <p className="font-medium">{role || "—"}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.fullName")}</p>
              <p className="font-medium">{employee?.full_name || t("profile.notAvailable")}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.phone")}</p>
              <p className="font-medium">{employee?.phone || t("profile.notAvailable")}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.department")}</p>
              <p className="font-medium">{employee?.department || t("profile.notAvailable")}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("profile.branch")}</p>
              <p className="font-medium">{employee?.branch || t("profile.notAvailable")}</p>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="text-red-400 hover:text-red-300"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                  {loggingOut ? t("profile.signingOut") : t("profile.logout")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recommended: enable multi-factor authentication in Supabase Account Settings →
              Security (Profile → Security). This is optional, but strongly improves account
              protection.
            </p>
            <Button asChild variant="outline">
              <Link
                href="https://supabase.com/dashboard/account/security"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase Security Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        {isEmployee && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Request Profile Update</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full-name-requested">Requested Name</Label>
                    <Input
                      id="full-name-requested"
                      value={form.full_name_requested}
                      onChange={(e) =>
                        setForm({ ...form, full_name_requested: e.target.value })
                      }
                      placeholder={employee?.full_name || "Full name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-requested">Requested Phone</Label>
                    <Input
                      id="phone-requested"
                      value={form.phone_requested}
                      onChange={(e) =>
                        setForm({ ...form, phone_requested: e.target.value })
                      }
                      placeholder={employee?.phone || "+998 90 123 45 67"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department-requested">Requested Department</Label>
                    <Input
                      id="department-requested"
                      value={form.department_requested}
                      onChange={(e) =>
                        setForm({ ...form, department_requested: e.target.value })
                      }
                      placeholder={employee?.department || "Department"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-requested">Requested Branch</Label>
                    <Input
                      id="branch-requested"
                      value={form.branch_requested}
                      onChange={(e) =>
                        setForm({ ...form, branch_requested: e.target.value })
                      }
                      placeholder={employee?.branch || "Branch"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-reason">{t("profile.reason")}</Label>
                  <textarea
                    id="request-reason"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder={t("profile.requestReasonPlaceholder")}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t("profile.submitting") : t("profile.submitUpdateRequest")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {isAdmin ? t("profile.requestsAdmin") : t("profile.requestsEmployee")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isAdmin ? t("profile.noRequestsAdmin") : t("profile.noRequestsEmployee")}
              </p>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-border/30 bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                          {isAdmin ? request.employee_email : t("profile.yourRequest")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("profile.submittedOn")} {formatDate(request.created_at)}
                      </p>
                    </div>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    {request.full_name_requested && (
                      <p>Name → {request.full_name_requested}</p>
                    )}
                    {request.phone_requested && (
                      <p>Phone → {request.phone_requested}</p>
                    )}
                    {request.department_requested && (
                      <p>Department → {request.department_requested}</p>
                    )}
                    {request.branch_requested && (
                      <p>Branch → {request.branch_requested}</p>
                    )}
                  </div>
                  {request.admin_notes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Admin notes: {request.admin_notes}
                    </p>
                  )}
                  {isAdmin && request.status === "PENDING" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 hover:text-green-300"
                        onClick={() => {
                          setReviewingRequest(request);
                          setReviewAction("APPROVED");
                          setAdminNotes("");
                        }}
                      >
                        {t("requests.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          setReviewingRequest(request);
                          setReviewAction("REJECTED");
                          setAdminNotes("");
                        }}
                      >
                        {t("requests.reject")}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={!!reviewingRequest}
        onOpenChange={(open) => !open && setReviewingRequest(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED"
                ? t("profile.approveUpdate")
                : t("profile.rejectUpdate")}
            </DialogTitle>
          </DialogHeader>
          {reviewingRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-sm">
                <p className="font-medium">{reviewingRequest.employee_email}</p>
                <p className="mt-1 text-muted-foreground">{reviewingRequest.reason}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-admin-notes">
                  Admin Notes {reviewAction === "REJECTED" && "(required)"}
                </Label>
                <textarea
                  id="profile-admin-notes"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    reviewAction === "APPROVED"
                      ? "Optional guidance for employee..."
                      : "Reason for rejecting this update..."
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewingRequest(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReview} disabled={submitting}>
                  {submitting
                    ? "Processing..."
                    : reviewAction === "APPROVED"
                    ? "Approve"
                    : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
