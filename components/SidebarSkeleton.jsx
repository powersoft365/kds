// app/kds-pro/components/SidebarSkeleton.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarSkeleton({ sidebarOpen, setSidebarOpen, t = (s) => s }) {
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
        {/* skeleton groups */}
        {Array.from({ length: sidebarOpen ? 10 : 2 }).map((_, i) => (
          <div key={i} className="mb-4">
            {sidebarOpen ? (
              <>
                <div className="h-8 rounded-lg bg-muted animate-pulse mb-2" />
                <div className="space-y-2">
                  <div className="h-6 rounded bg-muted animate-pulse" />
                  <div className="h-6 rounded bg-muted animate-pulse" />
                  <div className="h-6 rounded bg-muted animate-pulse" />
                </div>
              </>
            ) : (
              <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
            )}
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
