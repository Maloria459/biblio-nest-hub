
ALTER TABLE public.books ADD COLUMN reread_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.reading_sessions ADD COLUMN reread_number integer NOT NULL DEFAULT 0;
