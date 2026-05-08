CREATE TABLE public.manual_page_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  update_date timestamptz NOT NULL DEFAULT now(),
  pages_delta integer NOT NULL DEFAULT 0,
  pages_value integer NOT NULL DEFAULT 0,
  reread_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.manual_page_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own manual_page_updates" ON public.manual_page_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own manual_page_updates" ON public.manual_page_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own manual_page_updates" ON public.manual_page_updates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own manual_page_updates" ON public.manual_page_updates FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_manual_page_updates_user_date ON public.manual_page_updates(user_id, update_date);