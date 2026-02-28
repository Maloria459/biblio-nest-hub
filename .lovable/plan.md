

## Problem
The cover image in the reading sheet (BookDetailModal) has `minHeight: 260` but no fixed/max height, so taller images stretch the container differently per book.

## Fix
In `BookDetailModal.tsx`, change the cover container from `minHeight: 260` to a fixed `height: 260px` (matching the "Où est la vraie vie ?" reference). The image already uses `object-cover` so it will crop/fill uniformly regardless of the source image's aspect ratio.

### Change (single line edit)
In the cover `<div>` around line 103, replace:
```tsx
style={{ minHeight: 260 }}
```
with:
```tsx
style={{ height: 260 }}
```

This ensures every book's cover occupies exactly the same space in the reading sheet.

