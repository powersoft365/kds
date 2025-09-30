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
  onUndoAction, // called after slide hits 100%
  setEtaDialog,
  setOrderDialog,
  t = (s) => s, // safe fallback for i18n
  timeElapsedMin,
  calcSubStatus,
  actionLabelAndClass,
  statusBorder,
  triBoxCls,
  selectedDepts,
}) {
  const elapsed = timeElapsedMin(order);
  const sub = calcSubStatus(order);
  const { label: actionText = "Action", cls: actionClass = "" } =
    actionLabelAndClass(order) || {};
  const isCompleted = order.status === "completed";

  // Detect if this card is being rendered inside a dialog (modal).
  // If yes, hide the “Details” button and center the remaining action button.
  const rootRef = React.useRef(null);
  const [insideDialog, setInsideDialog] = React.useState(false);
  React.useEffect(() => {
    try {
      const el = rootRef.current;
      if (!el) return;
      const inDialog = !!el.closest('[role="dialog"]');
      setInsideDialog(inDialog);
    } catch {
      setInsideDialog(false);
    }
  }, []);

  // ---- Slide-to-Undo (enabled only for completed orders) ----
  const [undoOpen, setUndoOpen] = React.useState(false);
  const [slideVal, setSlideVal] = React.useState([0]);
  const [confirmingUndo, setConfirmingUndo] = React.useState(false);

  const openUndo = () => {
    setSlideVal([0]);
    setConfirmingUndo(false);
    setUndoOpen(true);
  };
  const closeUndo = () => {
    setUndoOpen(false);
    setConfirmingUndo(false);
    setSlideVal([0]);
  };
  const triggerUndo = () => {
    if (confirmingUndo) return;
    setConfirmingUndo(true);
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

  // ---- Group items by department for display ----
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
      <div ref={rootRef} className="contents">
        <Card
          className={`h-full border-t-8 ${statusBorder(order)} ${
            sub === "on-hold" ? "shadow-[0_0_25px_rgba(139,92,246,0.6)]" : ""
          } hover:shadow-lg transition-shadow grid grid-rows-[auto_1fr_auto] overflow-hidden`}
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

          {/* Footer — full-bleed background attached to the bottom */}
          <CardFooter className="p-0">
            <div className="bg-muted/50 w-full flex flex-col gap-3 p-4">
              {/* centered time row */}
              <button
                className="w-full text-center"
                onClick={() => setEtaDialog({ open: true, orderId: order.id })}
              >
                <div className="text-xs text-muted-foreground font-medium">
                  {t("time_eta")}
                </div>
                <div className="font-extrabold text-base flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t("Time")} {elapsed}/{order.eta}
                </div>
              </button>

              {/* actions */}
              {insideDialog ? (
                // In modal: if completed, hide the Undo button entirely.
                // If not completed, show a single centered primary action.
                !isCompleted ? (
                  <div className="flex justify-center">
                    <Button
                      className={`w-full sm:max-w-xs justify-center font-bold ${actionClass}`}
                      onClick={() => onPrimaryAction(order)}
                    >
                      {actionText}
                    </Button>
                  </div>
                ) : null
              ) : (
                // In grid: primary + details (and show Undo for completed)
                <div className="grid grid-cols-2 gap-3">
                  {isCompleted ? (
                    <Button
                      className="w-full justify-center font-bold bg-slate-700 hover:bg-slate-800"
                      onClick={openUndo}
                      title={t("Undo")}
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      {t("Undo")}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full justify-center font-bold ${actionClass}`}
                      onClick={() => onPrimaryAction(order)}
                    >
                      {actionText}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-center font-bold"
                    onClick={() =>
                      setOrderDialog({ open: true, orderId: order.id })
                    }
                    aria-label={t("View details")}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    {t("Details")}
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Slide-to-Undo dialog (only used from the completed tab) */}
      <Dialog
        open={undoOpen}
        onOpenChange={(o) => (o ? openUndo() : closeUndo())}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {t("Slide right to undo")}
            </DialogTitle>
          </DialogHeader>

          {/* drag handle */}
          <div className="flex items-center justify-center py-3 bg-muted/50">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </div>

          <SlideToUndo
            value={slideVal[0]}
            setValue={(p) => setSlideVal([p])}
            onCommit={() => onSlideCommit(slideVal)}
            label={t("Slide right to undo")}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * SlideToUndo
 * - Whole rail is draggable (pointer events on container)
 * - Large pill that drags left→right
 * - Uses shadcn Slider under the hood for keyboard / a11y
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

  // Keyboard / a11y path via Slider
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
        {/* progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-2xl bg-emerald-500/25 pointer-events-none"
          style={{ width: `${Math.min(value, 100)}%` }}
        />

        {/* center hint */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity"
          style={{ opacity: value < 15 ? 1 : 0 }}
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* draggable pill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-background border border-muted-foreground/30 shadow flex items-center justify-center font-semibold px-2 h-12 pointer-events-none"
          style={{ left: `calc(${Math.min(value, 100)}% + 8px)` }}
          aria-hidden="true"
        >
          <Undo2 className="w-5 h-5 mr-2" />
        </div>

        {/* hidden slider for a11y */}
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

      {/* tiny footer */}
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
