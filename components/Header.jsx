// app/kds-pro/components/Header.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Power,
  Search,
  Menu,
  ChevronDown,
  X,
  Moon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export function Header({
  currentTime,
  headerTabs = [],
  activeTab,
  setActiveTab,
  counts = {},
  searchTerm,
  setSearchTerm,
  onSearchEnter = () => {}, // <<< NEW (used to GET by shopping cart code)
  t = (k) => k,
  departments = [],
  selectedDepts = [],
  toggleDept = () => {},
  setSettingsDialog = () => {},
}) {
  const [isMobileTrayOpen, setIsMobileTrayOpen] = React.useState(false);

  const selectedCountLabel = React.useMemo(() => {
    const isAll = selectedDepts.includes("All");
    const count = isAll ? 1 : selectedDepts.length || 0;
    return `${count} Dept(s) Selected`;
  }, [selectedDepts]);

  const onToggleMobileTray = () => setIsMobileTrayOpen((v) => !v);
  const closeMobileTray = () => setIsMobileTrayOpen(false);

  const DeptPills = (
    <div className="flex items-center">
      <div className="flex gap-1 bg-muted/70 rounded-md p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent md:overflow-visible">
        {departments.map((d) => {
          const isActive = selectedDepts.includes(d);
          return (
            <Button
              key={d}
              size="sm"
              variant={isActive ? "default" : "ghost"}
              onClick={() => toggleDept(d)}
              className={`${
                isActive ? "" : "text-muted-foreground"
              } whitespace-nowrap`}
              aria-pressed={isActive}
              aria-label={`Filter by ${d}`}
            >
              {d}
            </Button>
          );
        })}
      </div>
    </div>
  );

  const DeptDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          aria-label="Departments filter"
        >
          {selectedCountLabel}
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-56">
        <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {departments.map((d) => (
          <DropdownMenuCheckboxItem
            key={d}
            checked={selectedDepts.includes(d)}
            onCheckedChange={() => toggleDept(d)}
            className="cursor-pointer"
          >
            {d}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      className="w-full border-b bg-background sticky top-0 z-30"
      style={{ borderBottomWidth: 3 }}
    >
      <div className="flex h-[60px] md:h-[65px] items-center justify-between gap-2 md:gap-3 px-3 md:px-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <h1 className="tracking-widest font-extrabold text-lg md:text-xl lg:text-2xl truncate">
            Baresto Pro
          </h1>
          <div
            className="text-muted-foreground text-[12px] md:text-sm min-w-[80px] md:min-w-[90px] whitespace-nowrap"
            aria-label="Current time"
          >
            {currentTime}
          </div>
        </div>

        <nav className="hidden md:flex items-stretch gap-1">
          {headerTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative font-bold text-sm md:text-base px-3 lg:px-4 h-[60px] md:h-[65px] -mb-[3px] border-b-4 transition-colors ${
                  isActive
                    ? "border-blue-600 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground/80"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-pressed={isActive}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span className="ml-2 inline-flex align-middle">
                  <Badge variant="secondary" className="font-bold">
                    {Number.isFinite(counts?.[tab.key]) ? counts[tab.key] : 0}
                  </Badge>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop search with Enter handler */}
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchEnter(e.target.value.trim());
              }}
              placeholder={t("search_placeholder")}
              className="pl-9 w-[160px] md:w-[220px] lg:w-[280px]"
              inputMode="search"
              aria-label="Search"
            />
          </div>

          <div className="hidden lg:block">
            {departments.length <= 5 ? DeptPills : DeptDropdown}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsDialog(true)}
            aria-label="Open settings"
          >
            <Moon className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Power">
            <Power className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleMobileTray}
            aria-expanded={isMobileTrayOpen}
            aria-controls="mobile-tray"
            aria-label={isMobileTrayOpen ? "Close menu" : "Open menu"}
          >
            {isMobileTrayOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* mobile tabs */}
      <nav className="md:hidden border-t px-2 pb-1">
        <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          {headerTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative font-semibold text-sm px-3 h-12 -mb-[3px] border-b-4 transition-colors snap-start shrink-0 ${
                  isActive
                    ? "border-blue-600 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground/80"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-pressed={isActive}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span className="ml-2 inline-flex align-middle">
                  <Badge variant="secondary" className="font-bold">
                    {Number.isFinite(counts?.[tab.key]) ? counts[tab.key] : 0}
                  </Badge>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile tray */}
      <div
        id="mobile-tray"
        className={`md:hidden grid grid-cols-1 gap-3 px-3 pb-3 border-t overflow-hidden transition-[max-height,opacity] duration-300 ${
          isMobileTrayOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchEnter(e.target.value.trim());
                onToggleMobileTray();
              }
            }}
            placeholder={t("search_placeholder")}
            className="pl-9 w-full"
            inputMode="search"
            aria-label="Search orders"
          />
        </div>

        <div className="lg:hidden">
          {departments.length <= 5 ? (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              {DeptPills}
            </div>
          ) : (
            <div className="flex justify-start">{DeptDropdown}</div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setSettingsDialog(true);
              onToggleMobileTray();
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t("settings") || "Settings"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onToggleMobileTray}
          >
            Done
          </Button>
        </div>
      </div>
    </header>
  );
}
