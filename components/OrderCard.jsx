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

/**
 * OrderCard
 * - FIX: when sub-status is "delayed" the card top border becomes RED.
 * - If order is cooking and NOT ready to complete → clicking primary button opens "revert" slider.
 * - If all items are checked (button shows COMPLETE) → clicking completes (no revert modal).
 */
export function OrderCard({
  order,
  toggleItemState,
  onPrimaryAction, // START COOKING or COMPLETE
  onUndoAction, // completed → active
  onRevertAction, // cooking → pending (revert)
  setEtaDialog,
  setOrderDialog,
  t = (s) => s,
  timeElapsedMin,
  calcSubStatus,
  actionLabelAndClass,
  statusBorder, // function that returns a border class for non-delayed states
  triBoxCls,
  selectedDepts,
}) {
  const elapsed = timeElapsedMin(order);
  const sub = calcSubStatus(order); // e.g. "cooking", "delayed", "on-hold", "completed"
  const { label: actionText = "Action", cls: actionClass = "" } =
    actionLabelAndClass(order) || {};
  const isCompleted = order.status === "completed";
  const isCooking = !!order.cooking && !isCompleted;

  // Are all items checked (ready to COMPLETE)?
  const readyToComplete = React.useMemo(
    () =>
      Array.isArray(order.items) &&
      order.items.length > 0 &&
      order.items.every((i) => i.itemStatus === "checked"),
    [order.items]
  );

  // Detect if rendered inside a dialog (to tweak layout)
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

  // ---- Slide-to-Undo (completed → active) ----
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

  // ---- Slide-to-Revert (cooking → pending) ----
  const [revertOpen, setRevertOpen] = React.useState(false);
  const [slideValRev, setSlideValRev] = React.useState([0]);
  const [confirmingRevert, setConfirmingRevert] = React.useState(false);

  const openRevert = () => {
    setSlideValRev([0]);
    setConfirmingRevert(false);
    setRevertOpen(true);
  };
  const closeRevert = () => {
    setRevertOpen(false);
    setConfirmingRevert(false);
    setSlideValRev([0]);
  };
  const triggerRevert = () => {
    if (confirmingRevert) return;
    setConfirmingRevert(true);
    try {
      onRevertAction && onRevertAction(order);
    } finally {
      setTimeout(() => closeRevert(), 150);
    }
  };
  const onSlideRevertCommit = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (val >= 100) triggerRevert();
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
    if (val === "delayed") return `${base} bg-red-600 text-white`;
    if (val === "on-hold") return `${base} bg-violet-600 text-white`;
    if (val === "cooking") return `${base} bg-amber-500 text-white`;
    if (val === "completed") return `${base} bg-emerald-600 text-white`;
    return `${base} bg-slate-600 text-white`;
  };

  // ✅ Keep old UI: open revert slider only when cooking and NOT ready to complete.
  const handlePrimaryClick = () => {
    if (isCooking && !readyToComplete) {
      openRevert();
    } else {
      onPrimaryAction && onPrimaryAction(order);
    }
  };

  // ✅ NEW: if sub-status is "delayed", force red top border
  const borderCls = sub === "delayed" ? "border-red-600" : statusBorder(order);

  return (
    <>
      <div ref={rootRef} className="contents">
        <Card
          className={`h-full border-t-8 ${borderCls} ${
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

          {/* Footer */}
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
                !isCompleted ? (
                  <div className="flex justify-center">
                    <Button
                      className={`w-full sm:max-w-xs justify-center font-bold ${actionClass}`}
                      onClick={handlePrimaryClick}
                    >
                      {actionText}
                    </Button>
                  </div>
                ) : null
              ) : (
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
                      onClick={handlePrimaryClick}
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

      {/* Slide-to-Undo (completed → active) */}
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

          <div className="flex items-center justify-center py-3 bg-muted/50">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </div>

          <SlideToConfirm
            value={slideVal[0]}
            setValue={(p) => setSlideVal([p])}
            onCommit={() => onSlideCommit(slideVal)}
            label={t("Slide right to undo")}
            icon={<Undo2 className="w-5 h-5 mr-2" />}
          />
        </DialogContent>
      </Dialog>

      {/* Slide-to-Revert (cooking → pending) */}
      <Dialog
        open={revertOpen}
        onOpenChange={(o) => (o ? openRevert() : closeRevert())}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">Slide right to revert</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center py-3 bg-muted/50">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </div>

          <SlideToConfirm
            value={slideValRev[0]}
            setValue={(p) => setSlideValRev([p])}
            onCommit={() => onSlideRevertCommit(slideValRev)}
            label="Slide right to revert"
            icon={<Undo2 className="w-5 h-5 mr-2" />}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Generic slide-to-confirm (used for Undo and Revert) */
function SlideToConfirm({ value, setValue, onCommit, label, icon }) {
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

  // keyboard / a11y path via hidden slider
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
          {icon}
        </div>

        {/* hidden slider for keyboard/a11y */}
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
