// ============================================
// components/kds/OrdersGrid.jsx (JavaScript)
// ============================================

"use client";

import React from "react";
import OrderCard from "@/components/kds/OrderCard";

export default function OrdersGrid({
  pageSlice,
  selectedDepts,
  statusBorder,
  calcSubStatus,
  timeElapsedMin,
  actionLabelAndClass,
  toggleItemState,
  onPrimaryAction,
  setEtaDialog,
  setOrderDialog,
}) {
  return (
    <section className="flex-1 p-4 overflow-y-auto">
      {pageSlice.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground w-full">
          No orders to display.
        </p>
      ) : (
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {pageSlice.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              selectedDepts={selectedDepts}
              statusBorder={statusBorder}
              calcSubStatus={calcSubStatus}
              timeElapsedMin={timeElapsedMin}
              actionLabelAndClass={actionLabelAndClass}
              toggleItemState={toggleItemState}
              onPrimaryAction={onPrimaryAction}
              onOpenEta={() => setEtaDialog({ open: true, orderId: o.id })}
              onOpenDetails={() =>
                setOrderDialog({ open: true, orderId: o.id })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
