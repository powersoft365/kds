"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, Settings, Power, Menu, Search } from "lucide-react";

export default function Header({
  counts,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  departments,
  selectedDepts,
  toggleDept,
  currentTime,
  t,
  onOpenSettings,
}) {
  const headerTabs = (
    <div className="flex items-center">
      {[
        { key: "active", label: t("active_orders") },
        { key: "scheduled", label: t("scheduled") },
        { key: "completed", label: t("history") },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`relative font-bold text-sm md:text-base px-4 h-[65px] -mb-[3px] border-b-4 transition-colors ${
            activeTab === tab.key
              ? "border-blue-600 text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          <span>{tab.label}</span>
          <span className="ml-2 inline-flex">
            <Badge variant="secondary" className="font-bold">
              {counts[tab.key]}
            </Badge>
          </span>
        </button>
      ))}
    </div>
  );

  const deptSelector = (
    <div className="flex items-center">
      {departments.length <= 5 ? (
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {departments.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={selectedDepts.includes(d) ? "default" : "ghost"}
              onClick={() => toggleDept(d)}
              className={
                selectedDepts.includes(d) ? "" : "text-muted-foreground"
              }
            >
              {d}
            </Button>
          ))}
        </div>
      ) : (
        <div className="relative">
          <Button variant="secondary" size="sm" className="gap-2">
            {selectedDepts.includes("All") ? 1 : selectedDepts.length} Dept(s)
            Selected
            <ChevronDown className="w-4 h-4" />
          </Button>
          <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-2 shadow z-20">
            {departments.map((d) => (
              <label
                key={d}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedDepts.includes(d)}
                  onChange={() => toggleDept(d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header
      className="w-full border-b bg-background sticky top-0 z-10"
      style={{ borderBottomWidth: 3 }}
    >
      <div className="flex h-[65px] items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-4">
          <h1 className="tracking-widest font-extrabold text-xl md:text-2xl">
            KDS PRO
          </h1>
          <div className="text-muted-foreground text-sm md:text-base min-w-[90px]">
            {currentTime}
          </div>
        </div>

        <div className="hidden md:flex items-stretch gap-1">{headerTabs}</div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search_placeholder")}
              className="pl-9 w-[200px]"
            />
          </div>

          <div className="hidden lg:block">{deptSelector}</div>

          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Power className="w-5 h-5" />
          </Button>

          <div className="md:hidden">
            <Menu className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="md:hidden px-4 pb-2 border-t">{headerTabs}</div>
      <div className="lg:hidden px-4 pb-3">{deptSelector}</div>
    </header>
  );
}
