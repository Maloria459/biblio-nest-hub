
-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  rating INTEGER,
  coup_de_coeur BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Acheté',
  genre TEXT,
  format TEXT,
  publisher TEXT,
  series TEXT,
  pages INTEGER,
  pages_read INTEGER,
  chapters INTEGER,
  publication_date TEXT,
  price NUMERIC,
  spicy_level INTEGER,
  mature_content BOOLEAN DEFAULT false,
  recommandation_du_mois BOOLEAN DEFAULT false,
  recommandation_month TEXT,
  start_date TEXT,
  end_date TEXT,
  avis TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  passages_preferes TEXT,
  personnages_preferes TEXT,
  chapter_notes JSONB DEFAULT '{}'::jsonb,
  chapter_notes_enabled BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
