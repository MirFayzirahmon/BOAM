"use client";

import { useState } from "react";
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
import { Asset, AssetStatus } from "@/lib/types";
import { STATUS_TRANSITIONS, STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";

interface ChangeStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onSuccess: () => void;
}

export default function ChangeStatusModal({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: ChangeStatusModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<AssetStatus | "">("");
  const [reason, setReason] = useState("");

  const allowedStatuses = STATUS_TRANSITIONS[asset.status];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !reason.trim()) {
      toast.error("Please select a status and provide a reason");
      return;
    }
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await api.changeAssetStatus(asset.id, {
        new_status: newStatus,
        reason: reason.trim(),
        changed_by: user?.email || "system",
      });

      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
      setNewStatus("");
      setReason("");
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
          <DialogTitle>Change Asset Status</DialogTitle>
          <DialogDescription>
            Change status for &quot;{asset.name}&quot; (currently{" "}
            {STATUS_LABELS[asset.status]}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            {allowedStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No status transitions available. This is a terminal state.
              </p>
            ) : (
              <Select
                value={newStatus}
                onValueChange={(val) => setNewStatus(val as AssetStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <p className="text-xs text-muted-foreground">
              This reason is stored in the audit log for traceability.
            </p>
            <Textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document why this status change is necessary..."
              rows={3}
              disabled={allowedStatuses.length === 0}
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
              disabled={loading || allowedStatuses.length === 0}
            >
              {loading ? "Updating..." : "Change Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
