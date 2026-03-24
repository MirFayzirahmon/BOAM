"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    assetId: string;
    name: string;
    serialNumber: string;
    status: string;
    currentOwner: string | null;
  };
}

export default function QRModal({ open, onOpenChange, data }: QRModalProps) {
  const qrValue = JSON.stringify(data);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${data.name}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <h2>${data.name}</h2>
          <p>S/N: ${data.serialNumber}</p>
          <div id="qr">${document.getElementById("qr-code-svg")?.innerHTML || ""}</div>
          <p style="margin-top:16px;font-size:12px;color:#666;">AssetTrack — Bank Office Asset Management</p>
          <script>window.print();window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>{data.name} — {data.serialNumber}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div id="qr-code-svg" className="rounded-lg bg-white p-4">
            <QRCodeSVG value={qrValue} size={200} level="M" />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Status: {data.status}</p>
            <p>Owner: {data.currentOwner || "Unassigned"}</p>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
