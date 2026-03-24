"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAssetRequest, getAssets, getAssetTransitions } from "@/lib/api";
import { useRole } from "@/components/RoleContext";
import { CATEGORIES } from "@/lib/constants";
import { Asset, AssetRequestType } from "@/lib/types";
import { toast } from "sonner";
import StateFeedback from "@/components/ui/state-feedback";

interface AssetRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AssetRequestForm({
  open,
  onOpenChange,
  onSuccess,
}: AssetRequestFormProps) {
  const { email } = useRole();
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [form, setForm] = useState({
    requestType: "NEW_ASSET_PURCHASE" as AssetRequestType,
    assetName: "",
    assetType: "",
    category: "IT",
    targetAssetId: "",
    requestedStatus: "",
    justification: "",
  });

  useEffect(() => {
    if (!open || !email) return;
    setLoadingAssets(true);
    getAssets()
      .then((data) => setAssets(data))
      .catch(() => toast.error("Could not load assets for request form"))
      .finally(() => setLoadingAssets(false));
  }, [open, email]);

  useEffect(() => {
    if (form.requestType !== "STATUS_CHANGE" || !form.targetAssetId) {
      setStatusOptions([]);
      if (form.requestType !== "STATUS_CHANGE") {
        setForm((prev) => ({ ...prev, requestedStatus: "" }));
      }
      return;
    }
    getAssetTransitions(form.targetAssetId)
      .then((items) => {
        setStatusOptions(items);
        if (!items.includes(form.requestedStatus)) {
          setForm((prev) => ({ ...prev, requestedStatus: items[0] ?? "" }));
        }
      })
      .catch(() => {
        setStatusOptions([]);
        setForm((prev) => ({ ...prev, requestedStatus: "" }));
      });
  }, [form.requestType, form.targetAssetId, form.requestedStatus]);

  const assignableAssets = useMemo(
    () => assets.filter((asset) => asset.status === "REGISTERED"),
    [assets]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Unable to submit request. Please sign in again.");
      return;
    }

    if (form.requestType === "STATUS_CHANGE") {
      if (!form.targetAssetId) {
        toast.error("Select a target asset for status change");
        return;
      }
      if (!form.requestedStatus) {
        toast.error("Select a requested status");
        return;
      }
    }

    setLoading(true);
    try {
      await createAssetRequest({
        request_type: form.requestType,
        asset_name:
          form.requestType === "NEW_ASSET_PURCHASE" ? form.assetName : undefined,
        asset_type:
          form.requestType === "NEW_ASSET_PURCHASE" ? form.assetType : undefined,
        category:
          form.requestType === "NEW_ASSET_PURCHASE" ? form.category : undefined,
        target_asset_id: form.targetAssetId || undefined,
        requested_status:
          form.requestType === "STATUS_CHANGE" ? form.requestedStatus : undefined,
        justification: form.justification,
        requester_name: email.split("@")[0],
      });
      toast.success("Asset request submitted successfully!");
      setForm({
        requestType: "NEW_ASSET_PURCHASE",
        assetName: "",
        assetType: "",
        category: "IT",
        targetAssetId: "",
        requestedStatus: "",
        justification: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Asset Request</DialogTitle>
          <DialogDescription>
            Choose request type and provide clear business rationale.
          </DialogDescription>
        </DialogHeader>
        {!email ? (
          <StateFeedback
            title="Session required"
            description="Your session could not be verified. Reopen this form after signing in."
            className="py-6"
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-type">Request Type</Label>
              <Select
                value={form.requestType}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    requestType: val as AssetRequestType,
                    targetAssetId: "",
                    requestedStatus: "",
                  }))
                }
              >
                <SelectTrigger id="request-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW_ASSET_PURCHASE">New asset purchase</SelectItem>
                  <SelectItem value="EXISTING_ASSET_ASSIGNMENT">
                    Existing asset assignment
                  </SelectItem>
                  <SelectItem value="STATUS_CHANGE">Asset status change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.requestType === "NEW_ASSET_PURCHASE" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="req-asset-name">Asset Name</Label>
                  <Input
                    id="req-asset-name"
                    required
                    value={form.assetName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, assetName: e.target.value }))
                    }
                    placeholder="e.g. Dell Latitude 5540"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-asset-type">Asset Type</Label>
                  <Input
                    id="req-asset-type"
                    required
                    value={form.assetType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, assetType: e.target.value }))
                    }
                    placeholder="e.g. Laptop, Printer, Monitor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                  >
                    <SelectTrigger id="req-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(form.requestType === "EXISTING_ASSET_ASSIGNMENT" ||
              form.requestType === "STATUS_CHANGE") && (
              <div className="space-y-2">
                <Label htmlFor="target-asset">Target Asset</Label>
                <Select
                  value={
                    form.requestType === "EXISTING_ASSET_ASSIGNMENT"
                      ? form.targetAssetId || "any"
                      : form.targetAssetId
                  }
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      targetAssetId: val === "any" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger id="target-asset" disabled={loadingAssets}>
                    <SelectValue
                      placeholder={
                        loadingAssets ? "Loading assets..." : "Select an asset"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {form.requestType === "EXISTING_ASSET_ASSIGNMENT" && (
                      <SelectItem value="any">Any available registered asset</SelectItem>
                    )}
                    {assignableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} · {asset.serial_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.requestType === "STATUS_CHANGE" && (
              <div className="space-y-2">
                <Label htmlFor="requested-status">Requested Status</Label>
                <Select
                  value={form.requestedStatus}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, requestedStatus: val }))
                  }
                  disabled={!form.targetAssetId || statusOptions.length === 0}
                >
                  <SelectTrigger id="requested-status">
                    <SelectValue placeholder="Select target status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="req-justification">Reason / Justification</Label>
              <textarea
                id="req-justification"
                required
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.justification}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, justification: e.target.value }))
                }
                placeholder="State the operational need and expected impact..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
