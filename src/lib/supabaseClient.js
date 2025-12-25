import { createClient } from "@supabase/supabase-js";

let supabaseInstance;
let initialized = false;

export function getSupabaseClient() {
  if (initialized) return supabaseInstance;
  initialized = true;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const envInfo = {
    urlPresent: Boolean(url),
    anonPresent: Boolean(anon),
    urlPreview: url ? `${url.slice(0, 24)}...` : "missing",
  };

  console.info("Supabase env detected", envInfo);

  if (!url || !anon) {
    console.warn("Missing Supabase env vars, skipping client init");
    supabaseInstance = null;
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anon);
  } catch (e) {
    console.warn("Failed to init Supabase client", e);
    supabaseInstance = null;
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
