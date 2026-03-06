
-- Collections table
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER handle_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Junction table for collection <-> book
CREATE TABLE public.collection_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (collection_id, book_id)
);

ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collection books" ON public.collection_books FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own collection books" ON public.collection_books FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own collection books" ON public.collection_books FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
