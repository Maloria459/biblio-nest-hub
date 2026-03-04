UPDATE public.books b
SET pages_read = sub.max_page
FROM (
  SELECT rs.book_id, MAX(rs.last_page_reached) as max_page
  FROM public.reading_sessions rs
  WHERE rs.last_page_reached IS NOT NULL
  GROUP BY rs.book_id
) sub
WHERE b.id = sub.book_id AND (b.pages_read IS NULL OR b.pages_read < sub.max_page);