"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OrderCard from "@/components/kds/OrderCard";

export default function OrderDialog({ open, onOpenChange, order }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details {order ? `#${order.id}` : ""}</DialogTitle>
        </DialogHeader>
        <div>
          {order ? (
            <OrderCard
              order={order}
              selectedDepts={["All"]}
              statusBorder={() => "border-blue-500"}
              calcSubStatus={(o) => o.subStatus}
              timeElapsedMin={(o) => Math.floor((Date.now() - o.ts) / 60000)}
              actionLabelAndClass={() => ({ label: "OK", cls: "" })}
              toggleItemState={() => {}}
              onPrimaryAction={() => {}}
              onOpenEta={() => {}}
              onOpenDetails={() => {}}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
