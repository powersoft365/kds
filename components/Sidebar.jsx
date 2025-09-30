// app/kds-pro/components/Sidebar.jsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export function Sidebar({ sidebarOpen, setSidebarOpen, totalsByDept, t }) {
  // State to track which departments are expanded
  const [expandedDepts, setExpandedDepts] = useState({});

  const toggleDeptExpand = (dept) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  // Initialize all departments as expanded by default
  React.useEffect(() => {
    const initialExpanded = {};
    Object.keys(totalsByDept).forEach((dept) => {
      initialExpanded[dept] = true;
    });
    setExpandedDepts(initialExpanded);
  }, [totalsByDept]);

  return (
    <aside
      className={`transition-all border-r bg-gradient-to-b from-background to-muted/20 ${
        sidebarOpen ? "w-[320px]" : "w-[72px]"
      } h-full overflow-y-auto flex flex-col shadow-lg`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && (
          <h2 className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t("totals")}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen((o) => !o)}
          className="shrink-0 rounded-full hover:bg-accent"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>
      <ScrollArea className="p-4">
        {Object.keys(totalsByDept).length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">
            No totals to show.
          </div>
        )}
        {Object.entries(totalsByDept).map(([dept, items]) => (
          <div key={dept} className="mb-5 last:mb-0">
            <div
              className="font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg px-4 py-2.5 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => toggleDeptExpand(dept)}
            >
              <span>{dept}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {expandedDepts[dept] ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {expandedDepts[dept] && (
              <ul className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                {Object.entries(items).map(([name, qty]) => (
                  <li
                    key={`${dept}-${name}`}
                    className="flex justify-between text-sm px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="truncate font-medium">{name}</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {qty}x
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
