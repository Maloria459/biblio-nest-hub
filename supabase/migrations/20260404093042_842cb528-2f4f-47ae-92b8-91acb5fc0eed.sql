ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_prologue boolean DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_epilogue boolean DEFAULT false;