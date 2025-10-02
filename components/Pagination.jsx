// app/kds-pro/components/Pagination.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

function pagesToShow(total, current, max = 9) {
  // returns an array like [1, '…', 10, 11, 12, '…', 99]
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  const range = [];
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  range.push(1);
  if (left > 2) range.push("…");
  for (let n = left; n <= right; n++) range.push(n);
  if (right < total - 1) range.push("…");
  range.push(total);
  return range;
}

export function Pagination({
  totalPages,
  currentPage,
  onPrev,
  onNext,
  onJump,
}) {
  const nums = pagesToShow(totalPages, currentPage);

  return (
    <footer className="sticky bottom-0 z-20 w-full bg-background/95 backdrop-blur border-t">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Page <span className="font-bold">{currentPage}</span> of{" "}
          <span className="font-bold">{totalPages}</span>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrev}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

          {nums.map((n, i) =>
            n === "…" ? (
              <span
                key={`e-${i}`}
                className="px-2 text-muted-foreground select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={n}
                size="sm"
                variant={n === currentPage ? "default" : "ghost"}
                className="min-w-9"
                onClick={() => onJump(n)}
                aria-current={n === currentPage ? "page" : undefined}
              >
                {n}
              </Button>
            )
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onNext}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </nav>
      </div>
    </footer>
  );
}
