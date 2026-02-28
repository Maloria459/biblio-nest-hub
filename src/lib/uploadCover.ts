import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a cover image to cloud storage and return a permanent public URL.
 */
export async function uploadCover(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("book-covers")
    .upload(path, file, { upsert: false });

  if (error || !data) {
    throw new Error(error?.message || "Échec de l'upload de la couverture");
  }

  const { data: urlData } = supabase.storage
    .from("book-covers")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
