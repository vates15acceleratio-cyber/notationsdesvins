import { supabase } from "./supabase";

export async function uploadLabelPhoto(file: File, wineId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${wineId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("labels").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("labels").getPublicUrl(path);
  return data.publicUrl;
}
