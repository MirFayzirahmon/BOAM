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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as api from "@/lib/api";
import { Asset, AssetCategory } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  onSuccess: () => void;
}

export default function AssetForm({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AssetFormProps) {
  const isEdit = !!asset;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: asset?.name || "",
    type: asset?.type || "",
    category: (asset?.category || "IT") as AssetCategory,
    serial_number: asset?.serial_number || "",
    description: asset?.description || "",
    image_url: asset?.image_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await api.updateAsset(asset.id, {
          name: form.name,
          type: form.type,
          category: form.category,
          serial_number: form.serial_number,
          description: form.description,
          image_url: form.image_url || null,
        });
        toast.success("Asset updated successfully");
      } else {
        await api.createAsset({
          name: form.name,
          type: form.type,
          category: form.category,
          serial_number: form.serial_number,
          description: form.description,
          image_url: form.image_url || null,
        });
        toast.success("Asset created successfully");
      }
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the asset details below."
              : "Fill in the details to register a new asset."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Dell Latitude 5540"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Laptop"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) =>
                  setForm({ ...form, category: val as AssetCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                required
                value={form.serial_number}
                onChange={(e) =>
                  setForm({ ...form, serial_number: e.target.value })
                }
                placeholder="DL-5540-001"
                disabled={isEdit}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Asset description..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
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
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Asset"
                : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
