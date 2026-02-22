
-- Reading sessions
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  last_page_reached INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.reading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.reading_sessions FOR DELETE USING (auth.uid() = user_id);

-- Literary events
CREATE TABLE public.literary_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  location TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.literary_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own literary events" ON public.literary_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own literary events" ON public.literary_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own literary events" ON public.literary_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own literary events" ON public.literary_events FOR DELETE USING (auth.uid() = user_id);

-- Book club events
CREATE TABLE public.book_club_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  location TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.book_club_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own book club events" ON public.book_club_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own book club events" ON public.book_club_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own book club events" ON public.book_club_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own book club events" ON public.book_club_events FOR DELETE USING (auth.uid() = user_id);
