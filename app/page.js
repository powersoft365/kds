// app/kds-pro/KdsPro.jsx
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Toaster, toast } from "sonner";

import SignalRBridge from "@/components/SignalRBridge";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Pagination } from "@/components/Pagination";
import { SettingsDialog } from "@/components/SettingsDialog";
import { EtaDialog } from "@/components/EtaDialog";
import { FullscreenOrderDialog } from "@/components/FullscreenOrderDialog";
import { OrderCard } from "@/components/OrderCard";
import { OrderSkeleton } from "@/components/OrderSkeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

import {
  listBatchOrders,
  listBatchOrderHeaders,
  getBatchOrderByShoppingCart,
  bulkChangeBatchOrderStatus,
  listTableSettings,
  listFloorTables,
  readOrdersList,
  readTotalCount,
} from "@/lib/api";

/* i18n */
const i18n = {
  en: {
    active_orders: "Active Orders",
    scheduled: "Scheduled",
    history: "History",
    totals: "TOTALS",
    search_placeholder: "Search orders (Enter = fetch by cart code)…",
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
};
const useT =
  (lng = "en") =>
  (k) =>
    (i18n[lng] && i18n[lng][k]) || k;

/* helpers */
const minutesSince = (ts) => {
  const n = typeof ts === "number" ? ts : Date.parse(ts);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.floor((Date.now() - n) / 60000));
};
const calcSubStatus = (o) => {
  if (o?.status === "completed") return "completed";
  if (o?.onHold) return "on-hold";
  if (o?.cooking) return "cooking";
  if (o?.delayed) return "delayed";
  if (minutesSince(o.createdAt) > o.eta) return "delayed";
  return "";
};
const statusBorder = (o) => {
  if (o?.status === "completed") return "border-emerald-500";
  if (o?.onHold) return "border-violet-500";
  if (o?.delayed) return "border-red-500";
  if (o?.cooking) return "border-amber-500";
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

function normalizeOrders(list, page, pageSize) {
  return list.map((raw, idx) => {
    const id =
      raw.batch_invoice_number_365 ||
      raw.batch_invoice_code_365 ||
      raw.batch_invoice_code ||
      raw.invoice_365_code ||
      raw.shopping_cart_code ||
      raw.id ||
      `row-${page}-${idx + 1}`;

    const itemsRaw =
      raw.list_invoice_details || raw.list_invoice_lines || raw.items || [];

    const items = itemsRaw.map((it, i) => ({
      id: it.line_id_365 || it.item_code_365 || `${id}-line-${i + 1}`,
      name: it.item_name || it.item_code_365 || it.name || "Item",
      dept: it.item_department_code_365 || it.dept || "General",
      mods: Array.isArray(it.list_modifiers)
        ? it.list_modifiers.map(
            (m) => m.modifier_name || m.modifier_code_365 || m.name
          )
        : [],
      qty: Number(it.line_quantity || it.qty || 1),
      itemStatus: "none",
    }));

    return {
      id,
      dest:
        raw.table?.table_name ||
        raw.table?.table_number ||
        raw.agent_code_365 ||
        raw.station_code_365 ||
        "Counter",
      type: raw.invoice_type || "I",
      createdAt: raw.invoice_date_utc0 || raw.created_at || Date.now(),
      status: raw.status_code_365 || "pending",
      cooking: raw.status_code_365 === "INPROC",
      delayed: false,
      onHold: false,
      eta: 10,
      items,
      _raw: raw,
    };
  });
}

function buildTotalsByDept(orders) {
  const acc = {};
  for (const o of orders) {
    for (const it of o.items || []) {
      const dept = it.dept || "General";
      if (!acc[dept]) acc[dept] = {};
      acc[dept][it.name] = (acc[dept][it.name] || 0) + (it.qty || 1);
    }
  }
  return acc;
}

function KdsPro() {
  const [language, setLanguage] = useState("en");
  const t = useT(language);

  const [orders, setOrders] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [scheduled, setScheduled] = useState([]);

  const [departments, setDepartments] = useState(["All"]);
  const [selectedDepts, setSelectedDepts] = useState(["All"]);

  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [totalPages, setTotalPages] = useState(1);

  const [etaDialog, setEtaDialog] = useState({ open: false, orderId: null });
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    orderId: null,
  });
  const [settingsDialog, setSettingsDialog] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const i = setInterval(() => {
      try {
        setCurrentTime(new Date().toLocaleTimeString("en-GB"));
      } catch {}
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const fetchPage = useCallback(async () => {
    const mySeq = ++requestSeq.current;
    try {
      abortRef.current?.abort?.();
    } catch {}
    abortRef.current = new AbortController();

    const deptFilter = selectedDepts.includes("All")
      ? ""
      : selectedDepts.join(",");
    setIsLoading(true);

    try {
      const countPayload = await listBatchOrders({
        pageNumber: 1,
        pageSize: 1,
        onlyCounted: "Y",
        itemDepartmentSelection: deptFilter,
      });
      if (mySeq !== requestSeq.current) return;
      const total = Math.max(1, Number(readTotalCount(countPayload)) || 1);
      const pages = Math.max(1, Math.ceil(total / itemsPerPage));
      setTotalPages(pages);
      if (currentPage > pages) setCurrentPage(pages);

      const dataPayload = await listBatchOrders({
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        onlyCounted: "N",
        itemDepartmentSelection: deptFilter,
      });
      if (mySeq !== requestSeq.current) return;

      const list = readOrdersList(dataPayload) || [];
      const normalized = normalizeOrders(list, currentPage, itemsPerPage);

      setOrders(normalized.filter((o) => o.status !== "completed"));
      setCompleted(normalized.filter((o) => o.status === "completed"));

      const deptSet = new Set(["All"]);
      normalized.forEach((o) =>
        (o.items || []).forEach((it) => deptSet.add(it.dept || "General"))
      );
      setDepartments(Array.from(deptSet));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders from API");
    } finally {
      if (mySeq === requestSeq.current) setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedDepts]);

  useEffect(() => {
    fetchPage();
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch {}
    };
  }, [fetchPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepts.join(","), activeTab]);

  useEffect(() => {
    listBatchOrderHeaders({ pageNumber: 1, pageSize: 10, onlyCounted: "N" })
      .then((payload) => console.log("[KDS] Headers sample:", payload))
      .catch(() => {});
  }, []);
  useEffect(() => {
    listTableSettings({ pageNumber: 1, pageSize: 20, onlyCounted: "N" })
      .then((payload) => console.log("[KDS] Table settings sample:", payload))
      .catch(() => {});
  }, []);
  useEffect(() => {
    listFloorTables({})
      .then((payload) => console.log("[KDS] Floor tables sample:", payload))
      .catch(() => {});
  }, []);

  const onSearchEnter = useCallback(async (term) => {
    if (!term) return;
    try {
      setIsLoading(true);
      const payload = await getBatchOrderByShoppingCart({
        shopping_cart_code: term,
        by_365_code: true,
      });
      const list = Array.isArray(payload)
        ? payload
        : readOrdersList(payload) ||
          (payload && typeof payload === "object" ? [payload] : []);
      const normalized = normalizeOrders(list, 1, list.length || 1);
      if (!normalized.length) {
        toast("No order found for that shopping cart code");
        return;
      }

      setOrders(normalized.filter((o) => o.status !== "completed"));
      setCompleted(normalized.filter((o) => o.status === "completed"));

      const deptSet = new Set(["All"]);
      normalized.forEach((o) =>
        (o.items || []).forEach((it) => deptSet.add(it.dept || "General"))
      );
      setDepartments(Array.from(deptSet));
      setOrderDialog({ open: true, orderId: normalized[0].id });
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch order by shopping cart code");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOrderUpdate = useCallback(() => {
    toast.info("Live update received", { description: "Refreshing orders…" });
    fetchPage();
  }, [fetchPage]);

  const allForTab = useMemo(() => {
    if (activeTab === "completed") return completed;
    if (activeTab === "scheduled") return scheduled;
    return orders;
  }, [activeTab, orders, scheduled, completed]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const selectedAll = selectedDepts.includes("All");
    return allForTab.filter((order) => {
      const matchesSearch =
        !search ||
        order.id.toString().includes(search) ||
        String(order.dest || "")
          .toLowerCase()
          .includes(search) ||
        (order.items || []).some((i) =>
          String(i.name || "")
            .toLowerCase()
            .includes(search)
        );
      const matchesDept =
        selectedAll ||
        (order.items || []).some((it) => selectedDepts.includes(it.dept));
      return matchesSearch && matchesDept;
    });
  }, [allForTab, searchTerm, selectedDepts]);

  const totalsByDept = useMemo(() => buildTotalsByDept(filtered), [filtered]);
  const counts = {
    active: orders.length,
    scheduled: scheduled.length,
    completed: completed.length,
  };

  const actionLabelAndClass = useCallback(
    (o) => {
      if ((o.items || []).every((i) => i.itemStatus === "checked"))
        return {
          label: t("complete"),
          cls: "bg-emerald-600 hover:bg-emerald-700",
        };
      if (o.cooking)
        return { label: t("cooking"), cls: "bg-amber-500 hover:bg-amber-600" };
      return {
        label: t("start_cooking"),
        cls: "bg-blue-600 hover:bg-blue-700",
      };
    },
    [t]
  );

  const toggleItemState = useCallback(
    (orderId, itemId) => {
      if (activeTab === "completed") return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id !== orderId
            ? o
            : {
                ...o,
                items: (o.items || []).map((it) => {
                  if (it.id !== itemId) return it;
                  const states = ["none", "checked", "cancelled"];
                  const next =
                    states[(states.indexOf(it.itemStatus) + 1) % states.length];
                  return { ...it, itemStatus: next };
                }),
              }
        )
      );
    },
    [activeTab]
  );

  const onPrimaryAction = useCallback(
    async (order) => {
      try {
        const code365 =
          order._raw?.batch_invoice_number_365 ||
          order._raw?.batch_invoice_code_365 ||
          order.id;

        if ((order.items || []).every((i) => i.itemStatus === "checked")) {
          await bulkChangeBatchOrderStatus([
            {
              batch_invoice_number_365: String(code365),
              line_id_365: "",
              status_code_365: "APPROVED",
              item_department_code_365: "",
              time_to_complete: 0,
            },
          ]);
          toast.success(`Order #${order.id} completed`);
          await fetchPage();
          return;
        }

        await bulkChangeBatchOrderStatus([
          {
            batch_invoice_number_365: String(code365),
            line_id_365: "",
            status_code_365: "INPROC",
            item_department_code_365: "",
            time_to_complete: 0,
          },
        ]);
        toast.info(`Order #${order.id} ${t("started_cooking")}`);
        await fetchPage();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update order status");
      }
    },
    [fetchPage, t]
  );

  const onUndoAction = useCallback(
    async (order) => {
      try {
        const code365 =
          order._raw?.batch_invoice_number_365 ||
          order._raw?.batch_invoice_code_365 ||
          order.id;
        await bulkChangeBatchOrderStatus([
          {
            batch_invoice_number_365: String(code365),
            line_id_365: "",
            status_code_365: "INPROC",
            item_department_code_365: "",
            time_to_complete: 0,
          },
        ]);
        toast(`Order #${order.id}: ${t("undone_to_active")}`);
        await fetchPage();
      } catch (e) {
        console.error(e);
        toast.error("Failed to undo completion");
      }
    },
    [fetchPage, t]
  );

  const toggleDept = (dept) => {
    if (dept === "All") return setSelectedDepts(["All"]);
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
      <SignalRBridge
        onOrderUpdate={() => {
          toast.info("Live update received", {
            description: "Refreshing orders…",
          });
          fetchPage();
        }}
      />
      <Toaster richColors position="top-right" />

      <Header
        currentTime={currentTime}
        headerTabs={headerTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchEnter={onSearchEnter}
        t={t}
        departments={departments}
        selectedDepts={selectedDepts}
        toggleDept={toggleDept}
        setSettingsDialog={setSettingsDialog}
      />

      {/* IMPORTANT: min-h-0 enables inner scrollers (sidebar + content) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <SidebarSkeleton
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            t={t}
          />
        ) : (
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            totalsByDept={totalsByDept}
            t={t}
          />
        )}

        <section className="flex-1 min-h-0 p-4 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto">
            {isLoading ? (
              <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <OrderSkeleton key={`s-${i}`} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground w-full py-16">
                No orders to display.
              </p>
            ) : (
              <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((o, idx) => (
                  <OrderCard
                    key={`${o.id}-${idx}`}
                    order={o}
                    toggleItemState={toggleItemState}
                    onPrimaryAction={onPrimaryAction}
                    onUndoAction={onUndoAction}
                    setEtaDialog={setEtaDialog}
                    setOrderDialog={setOrderDialog}
                    t={t}
                    timeElapsedMin={(ord) => minutesSince(ord.createdAt)}
                    calcSubStatus={calcSubStatus}
                    actionLabelAndClass={(ord) => {
                      if (
                        (ord.items || []).every(
                          (i) => i.itemStatus === "checked"
                        )
                      )
                        return {
                          label: t("complete"),
                          cls: "bg-emerald-600 hover:bg-emerald-700",
                        };
                      if (ord.cooking)
                        return {
                          label: t("cooking"),
                          cls: "bg-amber-500 hover:bg-amber-600",
                        };
                      return {
                        label: t("start_cooking"),
                        cls: "bg-blue-600 hover:bg-blue-700",
                      };
                    }}
                    statusBorder={statusBorder}
                    triBoxCls={triBoxCls}
                    selectedDepts={selectedDepts}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {!isLoading && totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onJump={(n) => setCurrentPage(n)}
        />
      )}

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
        setEtaDialog={setEtaDialog}
        t={t}
        timeElapsedMin={(ord) => minutesSince(ord.createdAt)}
        calcSubStatus={calcSubStatus}
        actionLabelAndClass={(o) => {
          if ((o.items || []).every((i) => i.itemStatus === "checked"))
            return {
              label: t("complete"),
              cls: "bg-emerald-600 hover:bg-emerald-700",
            };
          if (o.cooking)
            return {
              label: t("cooking"),
              cls: "bg-amber-500 hover:bg-amber-600",
            };
          return {
            label: t("start_cooking"),
            cls: "bg-blue-600 hover:bg-blue-700",
          };
        }}
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
