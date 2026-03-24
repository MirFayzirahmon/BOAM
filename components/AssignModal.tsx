"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase";
import * as api from "@/lib/api";
import { Asset, Employee } from "@/lib/types";
import { toast } from "sonner";
import StateFeedback from "@/components/ui/state-feedback";

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onSuccess: () => void;
}

export default function AssignModal({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AssignModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeLoadError, setEmployeeLoadError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    setEmployeeLoadError(null);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setEmployeeLoadError("Could not load employees. Please retry.");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await api.assignAsset(asset.id, {
        employee_id: selectedEmployee,
        notes: notes.trim() || undefined,
        assigned_by: user?.email || "system",
      });

      toast.success("Asset assigned successfully");
      setSelectedEmployee("");
      setNotes("");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogDescription>
            Assign &quot;{asset.name}&quot; to maintain clear custody accountability.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {employeeLoadError ? (
            <StateFeedback
              title="Employee list unavailable"
              description={employeeLoadError}
              actionLabel="Retry"
              onAction={loadEmployees}
              className="py-6"
            />
          ) : (
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                disabled={loadingEmployees || employees.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingEmployees
                        ? "Loading employees..."
                        : employees.length === 0
                        ? "No active employees available"
                        : "Select employee"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} — {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for audit context..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingEmployees || employees.length === 0 || !!employeeLoadError}
            >
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
