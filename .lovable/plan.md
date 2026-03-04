

## Problem

In `BookDetailModal.tsx`, the local `editBook` state is only re-initialized when the book ID changes (line 56: `editBook.id !== book.id`). After the timer saves and calls `updateBook` in BooksContext, the `book` prop updates from context with the new `pagesRead`, but since the ID is the same, `editBook` retains the stale value. The UI therefore shows the old page count.

## Fix

Add a sync effect: when `book.pagesRead` (or other key fields like `status`, `endDate`) changes on the prop but `editBook` still has the old value, update `editBook` accordingly. This can be done by comparing specific fields from `book` prop against `editBook` and patching when they differ — specifically after a session save.

**File**: `src/components/BookDetailModal.tsx`

Add a condition inside the existing `if (!editBook || editBook.id !== book.id)` block to also trigger when certain session-related fields on the `book` prop have changed compared to `editBook`. Specifically, expand it to also sync when `book.pagesRead !== editBook.pagesRead` or `book.status !== editBook.status` or `book.endDate !== editBook.endDate`:

```tsx
if (!editBook || editBook.id !== book.id 
    || book.pagesRead !== editBook.pagesRead 
    || book.status !== editBook.status 
    || book.endDate !== editBook.endDate) {
  const initialized = { ...book, citations: book.citations ? [...book.citations] : [], chapterNotes: book.chapterNotes ? { ...book.chapterNotes } : {} };
  setEditBook(initialized);
  setChapterNotesEnabled(book.chapterNotesEnabled || false);
  return null;
}
```

This ensures that after the timer updates the book via context, the reading sheet immediately reflects the new pages read, progression, and status.

