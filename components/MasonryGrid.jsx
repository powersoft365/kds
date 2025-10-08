"use client";

import React from "react";

/**
 * MasonryGrid
 * - Dependency-free, responsive masonry layout using absolute positioning
 * - Places each item into the current shortest column (bin-packing)
 * - Recomputes on container resize and item size changes
 *
 * Props:
 *  - items: array of data objects (must include a stable 'id')
 *  - renderItem: (item) => ReactNode (your card component)
 *  - minColumnWidth: number (px) — desired minimum column width; columns adjust responsively
 *  - gap: number (px) — space between cells
 *  - getItemKey?: (item) => string | number  (defaults to item.id)
 *
 * Styling:
 *  - Outer wrapper has no max-w and no horizontal px padding to honor your global layout rules.
 */
export default function MasonryGrid({
  items,
  renderItem,
  minColumnWidth = 280,
  gap = 16,
  getItemKey = (it) => it.id,
}) {
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Measure container width
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setContainerWidth(Math.max(0, Math.floor(w)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Column count based on container width and desired min column width
  const columnCount = React.useMemo(() => {
    if (!containerWidth || containerWidth < minColumnWidth) return 1;
    const count = Math.floor((containerWidth + gap) / (minColumnWidth + gap));
    return Math.max(1, count);
  }, [containerWidth, minColumnWidth, gap]);

  // Fixed column width used for absolute positioning
  const columnWidth = React.useMemo(() => {
    if (columnCount <= 1) return containerWidth;
    const totalGaps = (columnCount - 1) * gap;
    const width = Math.floor((containerWidth - totalGaps) / columnCount);
    return Math.max(0, width);
  }, [containerWidth, columnCount, gap]);

  // Each child wrapper gets a ref so we can measure its height.
  const itemRefs = React.useRef(new Map());
  const setItemRef = (key) => (el) => {
    if (!el) {
      itemRefs.current.delete(key);
      return;
    }
    itemRefs.current.set(key, el);
  };

  // Track measured heights via ResizeObserver (reactive to dynamic content)
  const [heights, setHeights] = React.useState({});
  React.useEffect(() => {
    const observers = [];
    const update = () => {
      const next = {};
      itemRefs.current.forEach((el, key) => {
        next[key] = Math.ceil(el.getBoundingClientRect().height);
      });
      setHeights(next);
    };

    itemRefs.current.forEach((el, key) => {
      const ro = new ResizeObserver(() => update());
      ro.observe(el);
      observers.push(ro);
    });

    // Initial sync
    update();

    return () => observers.forEach((ro) => ro.disconnect());
  }, [items, columnWidth]); // re-measure when items/width change

  // Compute positions with shortest-column bin packing
  const layout = React.useMemo(() => {
    const positions = [];
    const colHeights = new Array(columnCount).fill(0);
    items.forEach((item) => {
      const key = String(getItemKey(item));
      const h = heights[key] ?? 0;
      // pick the shortest column
      let colIndex = 0;
      let minHeight = colHeights[0];
      for (let i = 1; i < columnCount; i++) {
        if (colHeights[i] < minHeight) {
          colIndex = i;
          minHeight = colHeights[i];
        }
      }
      const left = colIndex * (columnWidth + gap);
      const top = minHeight;
      positions.push({ key, left, top, height: h });
      colHeights[colIndex] = minHeight + h + gap;
    });

    const totalHeight =
      colHeights.length > 0 ? Math.max(...colHeights) - gap : 0;

    return { positions, totalHeight: Math.max(0, totalHeight) };
  }, [items, heights, columnCount, columnWidth, gap, getItemKey]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Absolutely positioned stage — no outer px padding or max-w */}
      <div
        className="relative"
        style={{
          height: layout.totalHeight,
        }}
      >
        {items.map((item, idx) => {
          const key = String(getItemKey(item));
          const pos = layout.positions[idx] || { left: 0, top: 0 };
          return (
            <div
              key={key}
              ref={setItemRef(key)}
              className="absolute"
              style={{
                width: columnWidth,
                left: pos.left,
                top: pos.top,
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
