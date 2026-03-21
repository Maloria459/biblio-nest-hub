
-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT '',
  reward_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_tiers table
CREATE TABLE public.challenge_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  parent_tier_id UUID REFERENCES public.challenge_tiers(id) ON DELETE CASCADE,
  action_type TEXT,
  threshold INTEGER NOT NULL DEFAULT 1,
  reward_type TEXT,
  reward_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.challenge_tiers(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tier_id)
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Challenges: readable by all authenticated users
CREATE POLICY "Authenticated users can read challenges"
ON public.challenges FOR SELECT TO authenticated USING (true);

-- Challenge tiers: readable by all authenticated users
CREATE POLICY "Authenticated users can read challenge tiers"
ON public.challenge_tiers FOR SELECT TO authenticated USING (true);

-- User progress: users can only access their own
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
