

## Audit Results: Image Display Across All Components

After searching all `.tsx` files for `<img` tags, I found **8 files** with images. Here's the status:

### Already correct (object-cover + overflow-hidden on container)
- `FlipBookCard.tsx` — `w-full h-full object-cover`, container has `overflow-hidden` ✅
- `AddBookModal.tsx` — `w-full h-full object-cover`, container has `overflow-hidden` ✅
- `EditBookModal.tsx` — `w-full h-full object-cover`, container has `overflow-hidden` ✅
- `BookDetailModal.tsx` — `w-full h-full object-cover`, container has `overflow-hidden` ✅
- `LoanRegistryContent.tsx` (2 tables) — `w-full h-full object-cover`, container has `overflow-hidden` ✅
- `UpcomingReleasesCard.tsx` — `h-full w-full object-cover`, container has `overflow-hidden` ✅
- `LastSessionCard.tsx` — `h-full w-full object-cover`, container has `overflow-hidden` ✅
- `Dashboard.tsx` (book cover) — `h-full w-full object-cover`, container has `overflow-hidden` ✅

### Intentional exception
- `Dashboard.tsx` (Éclat d'Encre icon) — uses `object-contain` deliberately since it's a UI icon, not a book cover

### What needs fixing
None of the images are missing `object-cover` or `overflow-hidden`. However, **none have explicit `object-position: center`** for balanced cropping. I'll add `object-center` to every book cover `<img>` tag across all 8 files (10 image instances total) to guarantee centered cropping on all aspect ratios.

### Files to edit
1. **`src/components/FlipBookCard.tsx`** — add `object-center`
2. **`src/components/AddBookModal.tsx`** — add `object-center`
3. **`src/components/EditBookModal.tsx`** — add `object-center`
4. **`src/components/BookDetailModal.tsx`** — add `object-center`
5. **`src/components/LoanRegistryContent.tsx`** — add `object-center` (2 instances)
6. **`src/components/dashboard/UpcomingReleasesCard.tsx`** — add `object-center`
7. **`src/components/dashboard/LastSessionCard.tsx`** — add `object-center`
8. **`src/pages/Dashboard.tsx`** — add `object-center` to book cover image

Each change is a single class addition (`object-center`) to the existing `<img>` className.

