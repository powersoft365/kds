// app/kds-pro/KdsPro.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { OrderCard } from "@/components/OrderCard";
import { Pagination } from "@/components/Pagination";
import { SettingsDialog } from "@/components/SettingsDialog";
import { EtaDialog } from "@/components/EtaDialog";
import { FullscreenOrderDialog } from "@/components/FullscreenOrderDialog";

function KdsPro() {
  // ----- Seeded state from the mockup -----
  const initialOrders = [
    {
      id: 801,
      dest: "Table 12",
      type: "Dine-In",
      ts: Date.now() - 360000,
      status: "active",
      subStatus: "cooking",
      eta: 15,
      items: [
        {
          id: 1,
          name: "Steak Frites",
          dept: "Grill",
          mods: ["Medium Rare"],
          qty: 1,
          itemStatus: "none",
        },
        {
          id: 2,
          name: "Fries",
          dept: "Fryer",
          mods: [],
          qty: 2,
          itemStatus: "none",
        },
      ],
    },
    {
      id: 802,
      dest: "Sarah K",
      type: "Takeout",
      ts: Date.now() - 120000,
      status: "pending",
      subStatus: null,
      eta: 12,
      items: [
        {
          id: 3,
          name: "Caesar Salad",
          dept: "Salads",
          mods: ["No Croutons"],
          qty: 1,
          itemStatus: "none",
        },
        {
          id: 4,
          name: "Classic Burger",
          dept: "Grill",
          mods: [],
          qty: 1,
          itemStatus: "none",
        },
      ],
    },
    {
      id: 803,
      dest: "Wolt #A4B2",
      type: "Delivery",
      ts: Date.now() - 900000,
      status: "active",
      subStatus: null,
      eta: 12,
      items: [
        {
          id: 5,
          name: "Classic Burger",
          dept: "Grill",
          mods: [],
          qty: 1,
          itemStatus: "checked",
        },
        {
          id: 6,
          name: "House Wine",
          dept: "Bar",
          mods: [],
          qty: 2,
          itemStatus: "checked",
        },
      ],
    },
    {
      id: 804,
      dest: "VIP",
      type: "Dine-In",
      ts: Date.now() - 60000,
      status: "active",
      subStatus: "on-hold",
      eta: 20,
      items: [
        {
          id: 7,
          name: "Oysters",
          dept: "Kitchen",
          mods: [],
          qty: 1,
          itemStatus: "none",
        },
      ],
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 900 + i,
      dest: `Table ${i + 20}`,
      type: "Dine-In",
      ts: Date.now() - i * 60000,
      status: "pending",
      subStatus: null,
      eta: 10,
      items: [
        {
          id: 100 + i,
          name: "Fries",
          dept: "Fryer",
          mods: [],
          qty: 1,
          itemStatus: "none",
        },
      ],
    })),
  ];

  // History contains a (possibly colliding) id on purpose to show key safety
  const initialCompleted = [
    {
      id: 7001,
      dest: "John D.",
      type: "Takeout",
      ts: Date.now() - 86400000,
      status: "completed",
      subStatus: null,
      eta: 10,
      items: [
        {
          id: 200,
          name: "Pasta",
          dept: "Kitchen",
          mods: [],
          qty: 1,
          itemStatus: "checked",
        },
      ],
    },
  ];

  const i18n = {
    en: {
      active_orders: "Active Orders",
      scheduled: "Scheduled",
      history: "History",
      totals: "TOTALS",
      search_placeholder: "Search orders...",
      start_cooking: "START COOKING",
      complete: "COMPLETE",
      cooking: "COOKING",
      undo_completed: "UNDO",
      time_eta: "TIME / ETA",
      settings: "Settings",
      undone_to_active: "Order moved back to Active.",
      started_cooking: "started cooking.",
      completed_to_history: "Order has been moved to completed history",
    },
    es: {
      active_orders: "Pedidos Activos",
      scheduled: "Programados",
      history: "Historial",
      totals: "TOTALES",
      search_placeholder: "Buscar pedidos...",
      start_cooking: "EMPEZAR A COCINAR",
      complete: "COMPLETAR",
      cooking: "COCINANDO",
      undo_completed: "DESHACER COMPLETADO",
      time_eta: "TIEMPO / ETA",
      settings: "Ajustes",
      undone_to_active: "Pedido devuelto a Activos.",
      started_cooking: "empezó a cocinar.",
      completed_to_history: "El pedido se ha movido al historial completado",
    },
  };

  const [orders, setOrders] = useState(initialOrders);
  const [completed, setCompleted] = useState(initialCompleted);
  const [scheduled, setScheduled] = useState([]);

  const [activeTab, setActiveTab] = useState("active");

  const [language, setLanguage] = useState("en");
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([
    "All",
    "Grill",
    "Fryer",
    "Salads",
    "Kitchen",
    "Pastry",
    "Bar",
  ]);
  const [selectedDepts, setSelectedDepts] = useState(["All"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Dialog state
  const [etaDialog, setEtaDialog] = useState({ open: false, orderId: null });
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    orderId: null,
  });
  const [settingsDialog, setSettingsDialog] = useState(false);

  const t = (key) => (i18n[language] && i18n[language][key]) || key;

  useEffect(() => {
    const i = setInterval(() => {
      try {
        setCurrentTime(new Date().toLocaleTimeString("en-GB"));
      } catch (e) {
        setCurrentTime("");
      }
    }, 1000);
    return () => clearInterval(i);
  }, []);

  // ----- Filtering, sorting, pagination -----
  const allForTab = useMemo(() => {
    if (activeTab === "completed") return completed;
    if (activeTab === "scheduled") return scheduled;
    return orders;
  }, [activeTab, orders, scheduled, completed]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const selectedAll = selectedDepts.includes("All");
    return allForTab
      .filter((order) => {
        const matchesSearch =
          !search ||
          order.id.toString().includes(search) ||
          order.dest.toLowerCase().includes(search) ||
          order.items.some((i) => i.name.toLowerCase().includes(search));
        const matchesDept =
          selectedAll ||
          order.items.some((it) => selectedDepts.includes(it.dept));
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        if (a.status === b.status) return a.ts - b.ts;
        return a.status === "active" ? -1 : 1;
      });
  }, [allForTab, searchTerm, selectedDepts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedDepts.join(",")]);

  // ----- Helpers -----
  const statusBorder = (order) => {
    if (order.status === "active") return "border-amber-500";
    if (order.status === "pending") return "border-blue-500";
    if (order.status === "completed") return "border-emerald-500";
    return "border-slate-500";
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

  const toggleItemState = (orderId, itemId) => {
    if (activeTab === "completed") return;
    const lists = { orders: [...orders], completed: [...completed] };
    const sourceKey = lists.orders.find((o) => o.id === orderId)
      ? "orders"
      : lists.completed.find((o) => o.id === orderId)
      ? "completed"
      : null;
    if (!sourceKey) return;
    const list = lists[sourceKey];
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx < 0) return;
    const order = { ...list[idx] };
    const items = order.items.map((it) => {
      if (it.id !== itemId) return it;
      const states = ["none", "checked", "cancelled"];
      const next = states[(states.indexOf(it.itemStatus) + 1) % states.length];
      return { ...it, itemStatus: next };
    });
    order.items = items;
    list[idx] = order;
    if (sourceKey === "orders") setOrders(list);
    else setCompleted(list);
    const changed = items.find((i) => i.id === itemId);
    toast(`Item "${changed.name}" set to ${changed.itemStatus}.`, {
      description: new Date().toLocaleTimeString(),
      icon: "🔄",
    });
  };

  const onPrimaryAction = (order) => {
    if (order.items.every((i) => i.itemStatus === "checked")) {
      // Complete
      const without = orders.filter((o) => o.id !== order.id);
      setOrders(without);
      setCompleted([{ ...order, status: "completed" }, ...completed]);
      toast.success(`Order #${order.id} completed!`, {
        description: t("completed_to_history"),
        icon: "✅",
      });
      return;
    }
    if (order.status === "pending") {
      // Start cooking
      const updated = orders.map((o) =>
        o.id === order.id ? { ...o, status: "active", subStatus: "cooking" } : o
      );
      setOrders(updated);
      toast.info(`Order #${order.id} ${t("started_cooking")}`, {
        description: "Kitchen has been notified",
        icon: "👨‍🍳",
      });
    }
  };

  // NEW: Undo completion -> move from completed back to active
  const onUndoAction = (order) => {
    // Remove from completed
    const remaining = completed.filter((o) => o.id !== order.id);
    setCompleted(remaining);
    // Re-add to active orders (keep items as-is, but set status/flags)
    const revived = {
      ...order,
      status: "active",
      subStatus: "cooking", // or null; choose what fits your flow
      // keep ts so elapsed time is consistent; or set ts = Date.now() to "restart"
    };
    setOrders([revived, ...orders]);
    toast(`Order #${order.id}: ${t("undone_to_active")}`, {
      description: new Date().toLocaleTimeString(),
      icon: "↩️",
    });
  };

  const counts = {
    active: orders.length,
    scheduled: scheduled.length,
    completed: completed.length,
  };

  const totalsByDept = useMemo(() => {
    const source = filtered;
    const acc = {};
    source.forEach((o) => {
      o.items.forEach((it) => {
        if (!acc[it.dept]) acc[it.dept] = {};
        acc[it.dept][it.name] = (acc[it.dept][it.name] || 0) + it.qty;
      });
    });
    return acc;
  }, [filtered]);

  const timeElapsedMin = (o) => Math.floor((Date.now() - o.ts) / 60000);

  const calcSubStatus = (o) => {
    let sub = o.subStatus;
    if (timeElapsedMin(o) > o.eta && !sub) sub = "delayed";
    return sub;
  };

  const actionLabelAndClass = (o) => {
    if (o.items.every((i) => i.itemStatus === "checked"))
      return {
        label: t("complete"),
        cls: "bg-emerald-600 hover:bg-emerald-700",
      };
    if (o.status === "active")
      return { label: t("cooking"), cls: "bg-amber-500 hover:bg-amber-600" };
    return { label: t("start_cooking"), cls: "bg-blue-600 hover:bg-blue-700" };
  };

  const toggleDept = (dept) => {
    if (dept === "All") {
      setSelectedDepts(["All"]);
      return;
    }
    let next = selectedDepts.filter((d) => d !== "All");
    if (next.includes(dept)) next = next.filter((d) => d !== dept);
    else next = [...next, dept];
    if (next.length === 0) next = ["All"];
    setSelectedDepts(next);
  };

  const headerTabs = [
    { key: "active", label: t("active_orders") },
    { key: "scheduled", label: t("scheduled") },
    { key: "completed", label: t("history") },
  ];

  return (
    <div className="h-dvh flex flex-col bg-background text-foreground transition-colors">
      <Header
        currentTime={currentTime}
        headerTabs={headerTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        t={t}
        departments={departments}
        selectedDepts={selectedDepts}
        toggleDept={toggleDept}
        setSettingsDialog={setSettingsDialog}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          totalsByDept={totalsByDept}
          t={t}
        />

        <section className="flex-1 p-4 overflow-y-auto">
          {pageSlice.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground w-full">
              No orders to display.
            </p>
          ) : (
            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-1 md:grid-cols-2  2xl:grid-cols-4">
              {pageSlice.map((o, idx) => (
                <OrderCard
                  key={`${o.id}-${o.ts}-${o.dest}-${idx}`} // collision-proof key
                  order={o}
                  toggleItemState={toggleItemState}
                  onPrimaryAction={onPrimaryAction}
                  onUndoAction={onUndoAction} // pass undo
                  setEtaDialog={setEtaDialog}
                  setOrderDialog={setOrderDialog}
                  t={t}
                  timeElapsedMin={timeElapsedMin}
                  calcSubStatus={calcSubStatus}
                  actionLabelAndClass={actionLabelAndClass}
                  statusBorder={statusBorder}
                  triBoxCls={triBoxCls}
                  selectedDepts={selectedDepts}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* Dialogs */}
      <EtaDialog
        open={etaDialog.open}
        onOpenChange={(open) =>
          setEtaDialog({ open, orderId: open ? etaDialog.orderId : null })
        }
        orderId={etaDialog.orderId}
        orders={orders}
        setOrders={setOrders}
        toast={toast}
      />

      <FullscreenOrderDialog
        open={orderDialog.open}
        onOpenChange={(open) =>
          setOrderDialog({ open, orderId: open ? orderDialog.orderId : null })
        }
        orderId={orderDialog.orderId}
        orders={orders}
        completed={completed}
        toggleItemState={toggleItemState}
        onPrimaryAction={onPrimaryAction}
        // Optional: could pass onUndoAction here too if you want undo inside dialog
        setEtaDialog={setEtaDialog}
        t={t}
        timeElapsedMin={timeElapsedMin}
        calcSubStatus={calcSubStatus}
        actionLabelAndClass={actionLabelAndClass}
        statusBorder={statusBorder}
        triBoxCls={triBoxCls}
        selectedDepts={selectedDepts}
      />

      <SettingsDialog
        open={settingsDialog}
        onOpenChange={setSettingsDialog}
        language={language}
        setLanguage={setLanguage}
        i18n={i18n}
        t={t}
      />
    </div>
  );
}

export default KdsPro;
