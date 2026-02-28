

## Audit Result: Why books are not being saved

### Root Cause

The database `books.id` column is of type **UUID**, but `AddBookModal.tsx` generates the book ID as `Date.now().toString()` (line 68), producing values like `"1772300372868"`. This is **not a valid UUID**, so every INSERT to the database fails with:

> `invalid input syntax for type uuid: "1772300372868"`

The error is **silently swallowed** because `BooksContext.tsx` uses `.then()` with no error handler on the Supabase insert call (line 101). The book appears locally in React state but never persists to the database.

### Fix

Two changes needed:

1. **`src/components/AddBookModal.tsx` (line 68)**: Replace `Date.now().toString()` with `crypto.randomUUID()` to generate a proper UUID.

2. **`src/contexts/BooksContext.tsx`**: Add error handling to the `addBook`, `updateBook`, `deleteBook`, and `markPAL` database calls so failures are surfaced (e.g., via toast notifications) instead of silently ignored.

### Technical Detail

```text
Current flow:
  AddBookModal → id: "1772300372868" → BooksContext.addBook()
    → setBooks([...prev, book])     ✅ local state updated
    → supabase.insert(book).then()  ❌ DB rejects invalid UUID, error ignored

Fixed flow:
  AddBookModal → id: crypto.randomUUID() → BooksContext.addBook()
    → setBooks([...prev, book])     ✅ local state updated
    → supabase.insert(book).then()  ✅ valid UUID, DB accepts
```

