

## Problem

The wishlist grid uses `gridTemplateColumns: "repeat(8, 190px)"` (line ~196), creating a fixed 1520px+ wide grid. When the content area is narrower, the grid overflows horizontally.

## Fix

Two changes in `src/components/WishlistContent.tsx`:

1. **Replace the fixed 8-column grid** with a responsive approach using `repeat(auto-fill, 190px)` so columns adapt to available width.

2. **Add `overflow-x: hidden`** to the container div to prevent any residual horizontal scroll.

This keeps the 190px card width and visual layout but wraps cards to fit the available space instead of forcing 8 columns.

