"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import EmployeeForm from "@/components/EmployeeForm";
import { useRole } from "@/components/RoleContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Employee, Assignment } from "@/lib/types";
import { UserPlus, ChevronDown, ChevronUp, Pencil, Trash2, Mail } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export default function EmployeesPage() {
  const { isAdmin } = useRole();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [employeeAssetsById, setEmployeeAssetsById] = useState<
    Record<string, Assignment[]>
  >({});

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, counts] = await Promise.all([
        api.getEmployees(),
        api.getAssignmentCounts(),
      ]);
      setEmployees(empData);
      setAssetCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const toggleExpand = async (empId: string) => {
    if (expandedEmployee === empId) {
      setExpandedEmployee(null);
      return;
    }

    try {
      if (!employeeAssetsById[empId]) {
        const data = await api.getActiveAssignmentsByEmployee(empId);
        setEmployeeAssetsById((prev) => ({ ...prev, [empId]: data }));
      }
      setExpandedEmployee(empId);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load assigned assets for this employee";
      toast.error(message);
    }
  };

  const openCreateForm = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    const confirmed = window.confirm(`Delete employee ${employee.full_name}?`);
    if (!confirmed) return;

    try {
      await api.deleteEmployee(employee.id);
      toast.success("Employee deleted");
      await loadEmployees();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete employee";
      toast.error(message);
    }
  };

  const handleInvite = async (employee: Employee) => {
    try {
      await api.inviteEmployee(employee.id);
      toast.success(`Invite sent to ${employee.email}`);
      await loadEmployees();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invite";
      toast.error(message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("employees.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? t("employees.subtitleAdmin") : t("employees.subtitleEmployee")}
            </p>
          </div>
          {isAdmin && (
            <Button className="gap-2" onClick={openCreateForm}>
              <UserPlus className="h-4 w-4" /> {t("employees.addEmployee")}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>{t("employees.fullName")}</TableHead>
                  <TableHead>{t("employees.email")}</TableHead>
                  <TableHead>{t("employees.phone")}</TableHead>
                  <TableHead>{t("employees.department")}</TableHead>
                  <TableHead>{t("employees.branch")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-center">
                    {t("employees.assetsAssigned")}
                  </TableHead>
                  {isAdmin && <TableHead className="text-right">{t("common.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 9 : 8}
                      className="py-10 text-center text-muted-foreground"
                    >
                       {t("employees.noEmployees")}
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <React.Fragment key={emp.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleExpand(emp.id)}
                      >
                        <TableCell className="w-8">
                          {expandedEmployee === emp.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.full_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.phone || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.department}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.branch}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.status || "ACTIVE"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-400/10 text-xs font-bold text-gold-400">
                            {assetCounts[emp.id] || 0}
                          </span>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Edit employee"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(emp);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Send invite email"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvite(emp);
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Delete employee"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(emp);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                      {expandedEmployee === emp.id && (
                        <TableRow key={`${emp.id}-expanded`}>
                          <TableCell colSpan={isAdmin ? 9 : 8} className="bg-muted/20 p-4">
                            <p className="mb-2 text-xs text-muted-foreground">
                              Invite status: {emp.status || "ACTIVE"}
                              {emp.invited_at ? ` • invited at ${new Date(emp.invited_at).toLocaleString()}` : ""}
                              {emp.invited_by ? ` • by ${emp.invited_by}` : ""}
                            </p>
                            {(employeeAssetsById[emp.id] || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No assets currently assigned
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Currently assigned assets:
                                </p>
                                {(employeeAssetsById[emp.id] || []).map((a) => {
                                  const asset = a.assets as unknown as {
                                    name: string;
                                    serial_number: string;
                                    status: string;
                                    category: string;
                                  };
                                  return (
                                    <div
                                      key={a.id}
                                      className="flex items-center justify-between rounded-md border border-border/30 bg-background/50 p-2"
                                    >
                                      <div>
                                        <span className="text-sm font-medium">
                                          {asset?.name}
                                        </span>
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                                          {asset?.serial_number}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {asset?.category}
                                        </span>
                                        {asset?.status && (
                                          <StatusBadge
                                            status={asset.status as any}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <EmployeeForm
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={loadEmployees}
          employee={editingEmployee}
        />
      </main>
    </>
  );
}
