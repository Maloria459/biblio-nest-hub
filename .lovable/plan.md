

## Problem

Cover images uploaded via file input use `URL.createObjectURL()`, which creates a temporary blob URL (e.g., `blob:https://...`). This URL is stored in the `cover_url` database column but is only valid for the current browser session. On page refresh, the blob URL is gone and the image breaks.

This affects both `AddBookModal` and `EditBookModal`.

## Solution

Use Lovable Cloud file storage to persist uploaded cover images permanently.

### Step 1: Create a storage bucket via migration

- Create a public `book-covers` storage bucket
- Add RLS policies so authenticated users can upload/read/delete their own covers (using a `user_id/filename` path convention)

### Step 2: Create a helper function for cover upload

- Create `src/lib/uploadCover.ts`
- Takes a `File` object and the user ID
- Uploads to `book-covers/{user_id}/{uuid}.{ext}`
- Returns the permanent public URL
- Handles errors gracefully

### Step 3: Update AddBookModal

- When cover mode is "upload" and a file is selected, keep the local blob URL for preview only
- Store the raw `File` object in state
- On submit, upload the file to storage first, then use the returned public URL as `coverUrl`
- Show a loading state during upload

### Step 4: Update EditBookModal

- Same approach: upload file on submit, not on file selection
- If the user switches from an uploaded cover to a new one, the old file remains (acceptable; no cleanup needed initially)

### Step 5: Update BookDetailModal cover display

- No changes needed — it already uses `eb.coverUrl` which will now be a permanent URL

### Technical details

```sql
-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- RLS: anyone can read (public bucket)
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');

-- RLS: authenticated users upload to their own folder
CREATE POLICY "Users upload own covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can delete their own covers
CREATE POLICY "Users delete own covers" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
```

Upload helper pattern:
```typescript
const { data, error } = await supabase.storage
  .from('book-covers')
  .upload(`${userId}/${crypto.randomUUID()}.${ext}`, file);
const url = supabase.storage.from('book-covers').getPublicUrl(data.path).data.publicUrl;
```

