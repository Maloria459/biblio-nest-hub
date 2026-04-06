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

    const cleanIsbn = isbn.replace(/-/g, "").trim();

    // Search with exact match first
    const { data, error } = await supabase
      .from("books")
      .select("title, author, cover_url, publisher, series, pages, publication_date, genre, format, isbn, synopsis, chapters, has_prologue, has_epilogue")
      .eq("isbn", cleanIsbn)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return new Response(JSON.stringify({ book: data[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try with original isbn (with dashes)
    const { data: data2, error: error2 } = await supabase
      .from("books")
      .select("title, author, cover_url, publisher, series, pages, publication_date, genre, format, isbn, synopsis, chapters, has_prologue, has_epilogue")
      .eq("isbn", isbn.trim())
      .limit(1);

    if (error2) throw error2;

    if (data2 && data2.length > 0) {
      return new Response(JSON.stringify({ book: data2[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Broader search: fetch recent books and match cleaned ISBN
    const { data: data3 } = await supabase
      .from("books")
      .select("title, author, cover_url, publisher, series, pages, publication_date, genre, format, isbn, synopsis, chapters, has_prologue, has_epilogue")
      .not("isbn", "is", null)
      .limit(500);

    const match = (data3 || []).find(b => b.isbn && b.isbn.replace(/-/g, "").trim() === cleanIsbn);
    if (match) {
      return new Response(JSON.stringify({ book: match }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ book: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
