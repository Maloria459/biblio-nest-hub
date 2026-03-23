
CREATE TABLE public.personal_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  objective_type text NOT NULL,
  target_value integer NOT NULL,
  filter_value text NULL,
  period_type text NOT NULL DEFAULT 'month',
  start_date date NULL,
  end_date date NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own objectives"
  ON public.personal_objectives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objectives"
  ON public.personal_objectives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives"
  ON public.personal_objectives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objectives"
  ON public.personal_objectives FOR DELETE
  USING (auth.uid() = user_id);
