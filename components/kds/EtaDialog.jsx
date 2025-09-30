// ===============================================
// components/kds/dialogs/EtaDialog.jsx (JavaScript)
// ===============================================

"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EtaDialog({
  open,
  orderId,
  order,
  onOpenChange,
  onSave,
}) {
  const [etaValue, setEtaValue] = useState(0);
  useEffect(() => {
    if (open && order) setEtaValue(order.eta);
  }, [open, order]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust ETA for Order #{orderId}</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-3">
            {[-5, -1, +1, +5].map((step) => (
              <Button
                key={step}
                variant="secondary"
                className="w-16 h-16 text-2xl font-extrabold"
                onClick={() =>
                  setEtaValue((v) => Math.max(1, parseInt(v || 1) + step))
                }
              >
                {step > 0 ? `+${step}` : step}
              </Button>
            ))}
          </div>
          <div className="text-6xl font-extrabold">{etaValue}</div>
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              value={etaValue}
              onChange={(e) => setEtaValue(e.target.value)}
              className="w-24 text-center text-2xl font-extrabold"
            />
            <span className="text-xl">min</span>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onSave(orderId, etaValue)}
              className="font-bold"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
