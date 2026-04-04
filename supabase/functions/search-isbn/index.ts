import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { isbn } = await req.json();
    if (!isbn || typeof isbn !== "string") {
      return new Response(JSON.stringify({ error: "ISBN required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Search for books with matching ISBN from any user, return first match
    const { data, error } = await supabase
      .from("books")
      .select("title, author, cover_url, publisher, series, pages, publication_date, genre, format, isbn, synopsis, chapters, has_prologue, has_epilogue")
      .eq("isbn", isbn.replace(/-/g, "").trim())
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      // Also try with dashes removed from stored ISBNs
      const cleanIsbn = isbn.replace(/-/g, "").trim();
      const { data: data2 } = await supabase
        .from("books")
        .select("title, author, cover_url, publisher, series, pages, publication_date, genre, format, isbn, synopsis, chapters, has_prologue, has_epilogue")
        .limit(100);
      
      const match = (data2 || []).find(b => b.isbn && b.isbn.replace(/-/g, "") === cleanIsbn);
      if (match) {
        return new Response(JSON.stringify({ book: match }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ book: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ book: data[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
