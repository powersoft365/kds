// ==========================================
// components/kds/OrderCard.jsx (JavaScript)
// ==========================================

"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, Maximize2 } from "lucide-react";

export default function OrderCard({
  order,
  selectedDepts,
  statusBorder,
  calcSubStatus,
  timeElapsedMin,
  actionLabelAndClass,
  toggleItemState,
  onPrimaryAction,
  onOpenEta,
  onOpenDetails,
}) {
  const elapsed = timeElapsedMin(order);
  const sub = calcSubStatus(order);
  const { label, cls } = actionLabelAndClass(order);

  const itemsByDept = useMemo(() => {
    return order.items.reduce((acc, it) => {
      if (!acc[it.dept]) acc[it.dept] = [];
      acc[it.dept].push(it);
      return acc;
    }, {});
  }, [order.items]);

  const showDeptHeaders =
    selectedDepts.includes("All") && Object.keys(itemsByDept).length > 1;

  const subStatusBadge = (sub) => {
    if (!sub) return "";
    const base = "px-2 py-1 rounded-full text-xs font-bold";
    if (sub === "delayed") return `${base} bg-red-500 text-white`;
    if (sub === "on-hold") return `${base} bg-violet-500 text-white`;
    if (sub === "cooking") return `${base} bg-amber-500 text-white`;
    return `${base} bg-slate-600 text-white`;
  };

  const triBoxCls = (state) => {
    const base =
      "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mr-3";
    if (state === "checked")
      return `${base} bg-emerald-600 border-emerald-600 text-white`;
    if (state === "cancelled")
      return `${base} bg-red-600 border-red-600 text-white`;
    return `${base} border-slate-500`;
  };

  return (
    <Card
      className={`flex flex-col border-t-8 ${statusBorder(order)} ${
        sub === "on-hold" ? "shadow-[0_0_25px_rgba(139,92,246,0.6)]" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 py-3">
        <div className="space-y-0.5">
          <div className="font-extrabold text-xl tracking-tight">
            #{order.id}
          </div>
          <div className="text-sm text-muted-foreground">
            {order.dest} ({order.type})
          </div>
        </div>
        <div>
          {sub ? (
            <span className={subStatusBadge(sub)}>{sub.toUpperCase()}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <div className="relative max-h-[200px] overflow-y-auto pr-1">
          {Object.entries(itemsByDept).map(([dept, items]) => (
            <div key={dept} className="mb-3">
              {showDeptHeaders && (
                <div className="font-bold text-base border-b pb-1 mb-2">
                  {dept}
                </div>
              )}
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center pb-2 border-b last:border-0 cursor-pointer"
                    onClick={() => toggleItemState(order.id, it.id)}
                  >
                    <div className={triBoxCls(it.itemStatus)}>
                      {it.itemStatus === "checked" ? (
                        <Check className="w-4 h-4" />
                      ) : it.itemStatus === "cancelled" ? (
                        <X className="w-4 h-4" />
                      ) : null}
                    </div>
                    <div className="font-extrabold text-xl mr-3">{it.qty}x</div>
                    <div className="flex-1">
                      <div
                        className={`font-bold text-lg ${
                          it.itemStatus !== "none"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {it.name}
                      </div>
                      <div
                        className={`text-sm ${
                          it.itemStatus === "cancelled"
                            ? "line-through text-red-600"
                            : it.itemStatus === "checked"
                            ? "line-through text-muted-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {(it.mods || []).join(", ")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex items-center justify-between">
        <button className="text-center" onClick={onOpenEta}>
          <div className="text-xs text-muted-foreground font-medium">
            TIME / ETA
          </div>
          <div className="font-extrabold text-xl flex items-center gap-2">
            <Clock className="w-5 h-5" /> {elapsed} / {order.eta} min
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button
            className={`${cls} font-bold`}
            onClick={() => onPrimaryAction(order)}
          >
            {label}
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenDetails}>
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
