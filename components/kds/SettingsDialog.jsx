// =====================================================
// components/kds/dialogs/SettingsDialog.jsx (JavaScript)
// =====================================================

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function SettingsDialog({
  open,
  onOpenChange,
  language,
  setLanguage,
  t,
}) {
  const { theme, setTheme } = useTheme();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <div className="font-bold mb-2">Theme</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={theme === "dark" ? "default" : "secondary"}
                onClick={() => setTheme("dark")}
                className="font-bold"
              >
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "default" : "secondary"}
                onClick={() => setTheme("light")}
                className="font-bold"
              >
                Light
              </Button>
            </div>
          </div>
          <div>
            <div className="font-bold mb-2">Language</div>
            <div className="grid grid-cols-2 gap-2">
              {["en"].map((lng) => (
                <Button
                  key={lng}
                  variant={language === lng ? "default" : "secondary"}
                  onClick={() => setLanguage(lng)}
                  className="font-bold"
                >
                  {lng.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
