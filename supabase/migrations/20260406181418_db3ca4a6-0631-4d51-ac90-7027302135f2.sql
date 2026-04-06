
CREATE TABLE public.reading_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.reading_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" ON public.reading_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON public.reading_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activity" ON public.reading_activity FOR DELETE USING (auth.uid() = user_id);
