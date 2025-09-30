// app/kds-pro/components/OrderCard.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Maximize2, Check, X, Clock, Undo2, ChevronRight } from "lucide-react";

export function OrderCard({
  order,
  toggleItemState,
  onPrimaryAction,
  onUndoAction,
  setEtaDialog,
  setOrderDialog,
  t,
  timeElapsedMin,
  calcSubStatus,
  actionLabelAndClass,
  statusBorder,
  triBoxCls,
  selectedDepts,
}) {
  const elapsed = timeElapsedMin(order);
  const sub = calcSubStatus(order);
  const { label, cls } = actionLabelAndClass(order);
  const isCompleted = order.status === "completed";

  // Minimal slide-to-undo
  const [undoOpen, setUndoOpen] = React.useState(false);
  const [slideVal, setSlideVal] = React.useState([0]);
  const [isConfirming, setIsConfirming] = React.useState(false);

  const openUndo = () => {
    setSlideVal([0]);
    setIsConfirming(false);
    setUndoOpen(true);
  };
  const closeUndo = () => {
    setUndoOpen(false);
    setIsConfirming(false);
    setSlideVal([0]);
  };
  const triggerUndo = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      onUndoAction && onUndoAction(order);
    } finally {
      setTimeout(() => closeUndo(), 150);
    }
  };
  const onSlideCommit = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (val >= 100) triggerUndo();
  };

  const itemsByDept = (order.items || []).reduce((acc, it) => {
    const d = it.dept || "General";
    if (!acc[d]) acc[d] = [];
    acc[d].push(it);
    return acc;
  }, {});

  const showDeptHeaders =
    Array.isArray(selectedDepts) &&
    selectedDepts.includes("All") &&
    Object.keys(itemsByDept).length > 1;

  const subStatusBadge = (val) => {
    if (!val) return "";
    const base = "px-2.5 py-1 rounded-full text-xs font-bold";
    if (val === "delayed") return `${base} bg-red-500 text-white`;
    if (val === "on-hold") return `${base} bg-violet-500 text-white`;
    if (val === "cooking") return `${base} bg-amber-500 text-white`;
    if (val === "completed") return `${base} bg-emerald-600 text-white`;
    return `${base} bg-slate-600 text-white`;
  };

  return (
    <>
      <Card
        className={`h-full border-t-8 ${statusBorder(order)} ${
          sub === "on-hold" ? "shadow-[0_0_25px_rgba(139,92,246,0.6)]" : ""
        } hover:shadow-lg transition-shadow grid grid-rows-[auto_1fr_auto]`}
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50 py-3">
          <div className="space-y-0.5">
            <div className="font-extrabold text-xl tracking-tight">
              #{order.id}
            </div>
            <div className="text-sm text-muted-foreground">
              {order.dest} ({order.type})
            </div>
          </div>
          {sub ? (
            <span className={subStatusBadge(sub)}>{sub.toUpperCase()}</span>
          ) : null}
        </CardHeader>

        {/* Content */}
        <CardContent className="pt-4 pb-2">
          <div className="relative max-h-[38vh] md:max-h-[28vh] lg:max-h-[240px] overflow-y-auto pr-1">
            {Object.entries(itemsByDept).map(([dept, items]) => (
              <div key={dept} className="mb-3">
                {showDeptHeaders && (
                  <div className="font-bold text-base border-b pb-1 mb-2">
                    {dept}
                  </div>
                )}
                <ul className="space-y-2">
                  {items.map((it) => {
                    const isChecked = it.itemStatus === "checked";
                    const isCancelled = it.itemStatus === "cancelled";
                    const canToggle = !isCompleted;

                    return (
                      <li
                        key={`${order.id}-${dept}-${it.id}`}
                        className="grid grid-cols-[auto_auto_1fr] gap-3 items-center pb-2 border-b last:border-0 rounded cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          canToggle && toggleItemState(order.id, it.id)
                        }
                      >
                        <div className={triBoxCls(it.itemStatus)}>
                          {isChecked ? (
                            <Check className="w-4 h-4" />
                          ) : isCancelled ? (
                            <X className="w-4 h-4" />
                          ) : null}
                        </div>

                        <div className="font-extrabold text-lg md:text-xl">
                          {it.qty}x
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`font-bold text-base md:text-lg truncate ${
                              it.itemStatus !== "none"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {it.name}
                          </div>
                          <div
                            className={`text-xs md:text-sm truncate ${
                              isCancelled
                                ? "line-through text-red-600"
                                : isChecked
                                ? "line-through text-muted-foreground"
                                : "text-muted-foreground"
                            }`}
                            title={(it.mods || []).join(", ")}
                          >
                            {(it.mods || []).join(", ")}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="bg-muted/50 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 items-center">
          {/* ETA */}
          <button
            className="text-left md:text-center order-2 md:order-1"
            onClick={() => setEtaDialog({ open: true, orderId: order.id })}
          >
            <div className="text-xs text-muted-foreground font-medium">
              {t("time_eta")}
            </div>
            <div className="font-extrabold text-lg md:text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" /> {elapsed} / {order.eta} min
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 order-1 md:order-2">
            {isCompleted ? (
              <Button
                className="bg-slate-700 hover:bg-slate-800 font-bold"
                onClick={openUndo}
                title={t("undo_completed")}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                {t("undo_completed")}
              </Button>
            ) : (
              <Button
                className={`${cls} font-bold`}
                onClick={() => onPrimaryAction(order)}
              >
                {label}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOrderDialog({ open: true, orderId: order.id })}
              aria-label={t("view_order_details") || "View details"}
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Minimal Slide-to-Undo Dialog (shadcn-only, accessible) */}
      <Dialog
        open={undoOpen}
        onOpenChange={(o) => (o ? openUndo() : closeUndo())}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader>
            {/* Required for a11y, visually hidden */}
            <DialogTitle className="sr-only">
              {t("slide_right_to_undo") || "Slide right to undo"}
            </DialogTitle>
          </DialogHeader>

          {/* Compact handle */}
          <div className="flex items-center justify-center py-3 bg-muted/50">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </div>

          {/* Big, obvious slider with full-rail drag */}
          <SlideToUndo
            value={slideVal[0]}
            setValue={(p) => setSlideVal([p])}
            onCommit={() => onSlideCommit(slideVal)}
            label={t("slide_right_to_undo") || "Slide right to undo"}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * SlideToUndo
 * - Whole rail is draggable (pointer events on container)
 * - Large pill "button" that can be dragged from left to right
 * - Still uses shadcn Slider underneath for keyboard/a11y
 */
function SlideToUndo({ value, setValue, onCommit, label }) {
  const railRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const clamp = (n) => Math.max(0, Math.min(100, n));

  const updateFromClientX = (clientX) => {
    const el = railRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setValue(clamp(pct));
  };

  const onPointerDown = (e) => {
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onCommit?.();
  };

  // Keyboard / a11y path via Slider:
  const onSliderChange = (v) => setValue(Array.isArray(v) ? v[0] : v);
  const onSliderCommit = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (val >= 100) onCommit?.();
  };

  return (
    <div className="p-4 sm:p-6 pt-4">
      <div className="text-center font-bold text-base sm:text-lg mb-3 select-none">
        {label}
      </div>

      <div
        ref={railRef}
        className="relative h-16 w-full rounded-2xl bg-muted border border-muted-foreground/20 shadow-inner select-none touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-2xl bg-emerald-500/25 pointer-events-none"
          style={{ width: `${Math.min(value, 100)}%` }}
        />

        {/* Center hint (fades as you drag) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity"
          style={{ opacity: value < 15 ? 1 : 0 }}
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            <ChevronRight className="w-4 h-4" />

            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Big draggable pill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-background border border-muted-foreground/30 shadow flex items-center justify-center font-semibold px-2 h-12  pointer-events-none"
          style={{ left: `calc(${Math.min(value, 100)}% + 8px)` }}
          aria-hidden="true"
        >
          <Undo2 className="w-5 h-5 mr-2" />
        </div>

        {/* Hidden-but-focusable Slider for keyboard & screen readers */}
        <Slider
          value={[value]}
          onValueChange={onSliderChange}
          onValueCommit={onSliderCommit}
          min={0}
          max={100}
          step={1}
          aria-label={label}
          className="absolute inset-0 opacity-0"
        />
      </div>

      {/* Tiny footer row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] sm:text-xs text-muted-foreground select-none">
          {Math.round(value)}%
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground select-none">
          {value >= 100 ? "Release to confirm" : "Drag to the end"}
        </div>
      </div>
    </div>
  );
}
