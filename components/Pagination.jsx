// app/kds-pro/components/Pagination.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export function Pagination({ totalPages, currentPage, setCurrentPage }) {
  return (
    <footer className="p-4 flex justify-center gap-2 border-t bg-background">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Button
          key={n}
          variant={n === currentPage ? "default" : "secondary"}
          onClick={() => setCurrentPage(n)}
          className="px-4"
        >
          {n}
        </Button>
      ))}
    </footer>
  );
}
