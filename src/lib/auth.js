import { getSupabaseClient } from "./supabaseClient";

export async function getUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signUpWithEmail(email, password) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase env missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then restart dev server.");
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email, password) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase env missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then restart dev server.");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function sendPasswordReset(email) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase env missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then restart dev server.");
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login",
  });
  if (error) throw error;
}

export async function signOut() {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.warn(err.message);
  }
}

export function onAuthStateChange(callback) {
  try {
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session?.user ?? null);
    });
    return () => {
      data?.subscription.unsubscribe();
    };
  } catch (err) {
    console.warn(err.message);
    return () => {};
  }
}
