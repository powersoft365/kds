// app/kds-pro/components/FullscreenOrderDialog.jsx
"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderCard } from "./OrderCard";

export function FullscreenOrderDialog({
  open,
  onOpenChange,
  orderId,
  orders,
  completed,
  toggleItemState,
  onPrimaryAction,
  setEtaDialog,
  t,
  timeElapsedMin,
  calcSubStatus,
  actionLabelAndClass,
  statusBorder,
  triBoxCls,
  selectedDepts,
}) {
  const fullOrder = useMemo(
    () =>
      orders.find((o) => o.id === orderId) ||
      completed.find((o) => o.id === orderId),
    [orderId, orders, completed]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl ">
        <DialogHeader>
          <DialogTitle>Order Details #{fullOrder?.id}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {fullOrder ? (
            <OrderCard
              order={fullOrder}
              toggleItemState={toggleItemState}
              onPrimaryAction={onPrimaryAction}
              setEtaDialog={setEtaDialog}
              setOrderDialog={() => {}}
              t={t}
              timeElapsedMin={timeElapsedMin}
              calcSubStatus={calcSubStatus}
              actionLabelAndClass={actionLabelAndClass}
              statusBorder={statusBorder}
              triBoxCls={triBoxCls}
              selectedDepts={selectedDepts}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
