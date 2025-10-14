"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Read-only viewer: shows ONLY current modifiers attached to the item.
 * (No search, no apply.)
 */
export default function ModifierDialog({ open, onOpenChange, item }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* no max-w / no outer padding per your rule */}
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base font-extrabold">
            Modifiers for {item?.name || "Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {Array.isArray(item?.mods) && item.mods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.mods.map((m, i) => (
                <span
                  key={`cur-${i}`}
                  className="inline-flex items-center rounded-full text-xs font-bold bg-muted px-3 py-1"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No modifiers for this item.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
