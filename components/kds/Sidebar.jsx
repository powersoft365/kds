"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  PackageX,
} from "lucide-react";

/**
 * Sidebar (KDS Project)
 * - Polished, accessible, performant
 * - Collapsible with smooth width animation
 * - Persists open/closed state to localStorage
 * - Keyboard shortcut: Ctrl/Cmd + B toggles
 * - Search filter for quick finding items
 * - Department subtotals + global total
 *
 * Props:
 *  - sidebarOpen (bool): controlled open state
 *  - setSidebarOpen (fn): controlled setter
 *  - totalsByDept (object): { [dept]: { [itemName]: qtyNumber } }
 *  - t (fn): i18n translator, defaults to identity
 */
export default function Sidebar({
  sidebarOpen: controlledOpen,
  setSidebarOpen,
  totalsByDept = {},
  t = (s) => s,
}) {
  // Support both controlled and uncontrolled usage (with persistence)
  const isControlled =
    typeof controlledOpen === "boolean" && typeof setSidebarOpen === "function";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(() => {
    if (isControlled) return false; // ignored
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("kds_sidebar_open");
    return stored === null ? true : stored === "1";
  });
  const sidebarOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (updater) => {
      if (isControlled) {
        setSidebarOpen((prev) =>
          typeof updater === "function" ? updater(prev) : !!updater
        );
      } else {
        setUncontrolledOpen((prev) => {
          const next =
            typeof updater === "function" ? updater(prev) : !!updater;
          try {
            window.localStorage.setItem("kds_sidebar_open", next ? "1" : "0");
          } catch {}
          return next;
        });
      }
    },
    [isControlled, setSidebarOpen]
  );

  // Keyboard shortcut: Ctrl/Cmd + B to toggle
  useEffect(() => {
    const onKey = (e) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Focus management for accessibility
  const toggleBtnRef = useRef(null);
  useEffect(() => {
    // If closing, keep focus on the toggle button to avoid focus loss
    if (!sidebarOpen && toggleBtnRef.current) {
      toggleBtnRef.current.focus({ preventScroll: true });
    }
  }, [sidebarOpen]);

  // Derived data (memoized)
  const { sections, grandTotalItems, grandTotalQty } = useMemo(() => {
    const entries = Object.entries(totalsByDept || {});
    const normalized = entries
      .map(([dept, items]) => {
        const itemEntries = Object.entries(items || {});
        const subtotalQty = itemEntries.reduce(
          (acc, [, q]) => acc + (Number(q) || 0),
          0
        );
        return {
          dept,
          items: itemEntries.sort((a, b) =>
            a[0].localeCompare(b[0], undefined, { sensitivity: "base" })
          ),
          subtotalQty,
          itemCount: itemEntries.length,
        };
      })
      .sort((a, b) =>
        a.dept.localeCompare(b.dept, undefined, { sensitivity: "base" })
      );
    const totals = normalized.reduce(
      (acc, s) => {
        acc.items += s.itemCount;
        acc.qty += s.subtotalQty;
        return acc;
      },
      { items: 0, qty: 0 }
    );
    return {
      sections: normalized,
      grandTotalItems: totals.items,
      grandTotalQty: totals.qty,
    };
  }, [totalsByDept]);

  // Search filter
  const [query, setQuery] = useState("");
  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => {
        const filteredItems = s.items.filter(([name]) =>
          name.toLowerCase().includes(q)
        );
        const subtotalQty = filteredItems.reduce(
          (acc, [, q]) => acc + (Number(q) || 0),
          0
        );
        return {
          ...s,
          items: filteredItems,
          subtotalQty,
          itemCount: filteredItems.length,
        };
      })
      .filter((s) => s.itemCount > 0);
  }, [sections, query]);

  // Formatters
  const formatNumber = (n) => new Intl.NumberFormat().format(n);

  return (
    <aside
      aria-label={t("sidebar")}
      className={[
        "relative h-full flex flex-col border-r bg-muted/30 supports-[backdrop-filter]:bg-muted/40",
        "backdrop-blur-sm transition-[width] duration-300 ease-out",
        sidebarOpen ? "w-[320px]" : "w-[72px]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-background/40 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={[
              "inline-flex items-center justify-center rounded-lg",
              "bg-primary/10 text-primary",
              sidebarOpen ? "w-8 h-8" : "w-6 h-6",
              "shrink-0",
            ].join(" ")}
            aria-hidden="true"
          >
            <Layers className={sidebarOpen ? "w-4 h-4" : "w-3.5 h-3.5"} />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h2 className="font-extrabold text-lg leading-5 tracking-tight truncate">
                {t("totals")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("items")}:{" "}
                <span className="font-medium">
                  {formatNumber(grandTotalItems)}
                </span>{" "}
                • {t("qty")}:{" "}
                <span className="font-medium">
                  {formatNumber(grandTotalQty)}
                </span>
              </p>
            </div>
          )}
        </div>

        <Button
          ref={toggleBtnRef}
          variant="ghost"
          size="icon"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0"
          aria-label={sidebarOpen ? t("collapse_sidebar") : t("expand_sidebar")}
          aria-expanded={sidebarOpen}
          aria-controls="kds-sidebar-scroll"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Search (only when expanded) */}
      {sidebarOpen && (
        <div className="px-3 py-2 border-b bg-background/30">
          <div className="relative">
            <input
              type="text"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search_items_placeholder") || "Search items…"}
              aria-label={t("search_items") || "Search items"}
              className={[
                "w-full rounded-lg pr-3 pl-9 py-2 text-sm",
                "bg-background border focus:outline-none focus:ring-2 focus:ring-ring",
              ].join(" ")}
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea id="kds-sidebar-scroll" className="p-3">
        {/* Empty states */}
        {Object.keys(totalsByDept || {}).length === 0 && (
          <div
            className={[
              "flex flex-col items-center justify-center text-center py-10 rounded-lg",
              sidebarOpen ? "px-6" : "px-1",
              "border bg-background/20",
            ].join(" ")}
          >
            <PackageX className="w-6 h-6 mb-2 text-muted-foreground" />
            {sidebarOpen ? (
              <>
                <p className="text-sm font-medium">
                  {t("no_totals_title") || "No totals to show"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("no_totals_help") ||
                    "Add items to see department totals here."}
                </p>
              </>
            ) : (
              <span className="sr-only">
                {t("no_totals_title") || "No totals to show"}
              </span>
            )}
          </div>
        )}

        {Object.keys(totalsByDept || {}).length > 0 &&
          filteredSections.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              {t("no_results") || "No results match your search."}
            </div>
          )}

        {/* Sections */}
        {filteredSections.map(({ dept, items, subtotalQty, itemCount }) => (
          <section
            key={dept}
            className="mb-4 rounded-lg border bg-background/40 overflow-hidden"
            aria-label={`${dept} ${t("section") || "section"}`}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
              <div className="min-w-0">
                <div className="font-bold text-sm leading-5 truncate">
                  {dept}
                </div>
                {sidebarOpen && (
                  <div className="text-xs text-muted-foreground">
                    {t("items")}:{" "}
                    <span className="font-medium">
                      {formatNumber(itemCount)}
                    </span>{" "}
                    • {t("qty")}:{" "}
                    <span className="font-medium">
                      {formatNumber(subtotalQty)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ul className="divide-y">
              {items.map(([name, qty]) => (
                <li
                  key={name}
                  className={[
                    "flex items-center gap-2 px-3 py-2 text-sm",
                    "hover:bg-muted/20 transition-colors",
                  ].join(" ")}
                  title={name}
                >
                  <span
                    className={[
                      "truncate",
                      sidebarOpen ? "mr-2" : "sr-only",
                    ].join(" ")}
                  >
                    {name}
                  </span>
                  <span
                    className={[
                      "ml-auto inline-flex items-center justify-center rounded-md border text-xs font-semibold",
                      "px-2 py-1 bg-primary/10 text-primary",
                      !sidebarOpen && "ml-0",
                    ].join(" ")}
                    aria-label={`${formatNumber(qty)} ${t("units") || "units"}`}
                  >
                    {formatNumber(qty)}x
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </ScrollArea>

      {/* Footer Hints */}
      <div className="mt-auto p-3 border-t text-[11px] text-muted-foreground bg-background/40">
        {sidebarOpen ? (
          <div className="flex items-center justify-between">
            <span className="truncate">
              {t("shortcut_hint") || "Toggle sidebar"}
            </span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/50">
              ⌘/Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/50">B</kbd>
          </div>
        ) : (
          <span className="sr-only">
            {t("shortcut_hint") || "Toggle sidebar with Cmd/Ctrl + B"}
          </span>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool,
  setSidebarOpen: PropTypes.func,
  totalsByDept: PropTypes.object,
  t: PropTypes.func,
};
