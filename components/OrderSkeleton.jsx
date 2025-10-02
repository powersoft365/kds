// app/kds-pro/components/OrderSkeleton.jsx
"use client";

import React from "react";

export function OrderSkeleton() {
  return (
    <div className="h-full border rounded-lg border-border bg-muted/10 overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="h-5 w-24 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="p-4">
        <div className="space-y-3">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-52 bg-muted animate-pulse rounded" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex gap-3">
          <div className="h-9 flex-1 bg-muted animate-pulse rounded" />
          <div className="h-9 flex-1 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
