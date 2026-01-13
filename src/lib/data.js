import { createClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";

function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase env missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then restart dev server."
    );
  }
  return client;
}

export function createShareToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function fetchSongs() {
  const client = getClient();
  const { data, error } = await client
    .from("songs")
    .select("id,title,original_artist,lyrics,backing_track_url,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchSongsPage({ search, from = 0, to = 9 }) {
  const client = getClient();
  let query = client
    .from("songs")
    .select("id,title,original_artist,lyrics,backing_track_url,created_at")
    .order("created_at", { ascending: false });
  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `title.ilike.%${term}%,original_artist.ilike.%${term}%`
    );
  }
  const { data, error } = await query.range(from, to);
  if (error) throw error;
  return data || [];
}

export async function createSong(payload) {
  const client = getClient();
  const { data, error } = await client
    .from("songs")
    .insert(payload)
    .select("id,title,original_artist,lyrics,backing_track_url,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function insertSongsBatch(payloads) {
  if (!payloads.length) return [];
  const client = getClient();
  const { data, error } = await client.from("songs").insert(payloads).select("id");
  if (error) throw error;
  return data || [];
}

export async function updateSong(id, payload) {
  const client = getClient();
  const { data, error } = await client
    .from("songs")
    .update(payload)
    .eq("id", id)
    .select("id,title,original_artist,lyrics,backing_track_url,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSong(id) {
  const client = getClient();
  const { error } = await client.from("songs").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteSetlistItemsBySong(songId) {
  const client = getClient();
  const { error } = await client
    .from("setlist_items")
    .delete()
    .eq("song_id", songId);
  if (error) throw error;
}

export async function fetchSetlists() {
  const client = getClient();
  const { data, error } = await client
    .from("setlists")
    .select("id,name,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createSetlist(payload) {
  const client = getClient();
  const { data, error } = await client
    .from("setlists")
    .insert(payload)
    .select("id,name,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSetlist(id, payload) {
  const client = getClient();
  const { data, error } = await client
    .from("setlists")
    .update(payload)
    .eq("id", id)
    .select("id,name,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSetlist(id) {
  const client = getClient();
  const { error } = await client.from("setlists").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSetlistItems(setlistId) {
  const client = getClient();
  const { data, error } = await client
    .from("setlist_items")
    .select(
      "id,position,song:songs(id,title,original_artist,lyrics,backing_track_url)"
    )
    .eq("setlist_id", setlistId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchSubmissionItems(submissionId) {
  const client = getClient();
  const { data, error } = await client
    .from("submission_items")
    .select("song_id,position")
    .eq("submission_id", submissionId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addSetlistItem(payload) {
  const client = getClient();
  const { data, error } = await client
    .from("setlist_items")
    .insert(payload)
    .select(
      "id,position,song:songs(id,title,original_artist,lyrics,backing_track_url)"
    )
    .single();
  if (error) throw error;
  return data;
}

export async function upsertSetlistItems(items) {
  if (!items.length) return [];
  const client = getClient();
  const { data, error } = await client
    .from("setlist_items")
    .upsert(items, { onConflict: "setlist_id,song_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data || [];
}

export async function updateSetlistItemPositions(items) {
  const client = getClient();
  const { error } = await client.from("setlist_items").upsert(items);
  if (error) throw error;
}

export async function removeSetlistItem(id) {
  const client = getClient();
  const { error } = await client.from("setlist_items").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchGigs() {
  const client = getClient();
  const { data, error } = await client
    .from("gigs")
    .select(
      "id,title,client_name,event_date,share_token,created_at,base_setlist_id,client_submissions(id,submitted_at,notes,submission_items(id,position,song:songs(id,title)))"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteGig(gigId) {
  const client = getClient();
  const { error } = await client.from("gigs").delete().eq("id", gigId);
  if (error) throw error;
}

export async function fetchGigSubmissions(gigId) {
  const client = getClient();
  const { data, error } = await client
    .from("client_submissions")
    .select("id,submitted_at,notes,items:submission_items(id,position,song:songs(id,title,original_artist))")
    .eq("gig_id", gigId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchGigsList() {
  const client = getClient();
  const { data, error } = await client
    .from("gigs")
    .select("id,title,event_date,base_setlist_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchGigById(gigId) {
  const client = getClient();
  const { data, error } = await client
    .from("gigs")
    .select("id,title,event_date,base_setlist_id")
    .eq("id", gigId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateGigBaseSetlist(gigId, setlistId) {
  const client = getClient();
  const { data, error } = await client
    .from("gigs")
    .update({ base_setlist_id: setlistId })
    .eq("id", gigId)
    .select("id,base_setlist_id")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSetlistsSimple(userId) {
  const client = getClient();
  let query = client.from("setlists").select("id,name").order("created_at", {
    ascending: false,
  });
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchSetlistItemCounts(setlistIds) {
  if (!setlistIds.length) return {};
  const client = getClient();
  const { data, error } = await client
    .from("setlist_items")
    .select("setlist_id")
    .in("setlist_id", setlistIds);
  if (error) throw error;
  const counts = {};
  (data || []).forEach((row) => {
    counts[row.setlist_id] = (counts[row.setlist_id] || 0) + 1;
  });
  return counts;
}

export async function fetchSetlistSongsDetailed(setlistId) {
  const client = getClient();
  const { data, error } = await client
    .from("setlist_items")
    .select("id,position,song:songs(id,title,original_artist,lyrics,backing_track_url)")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createGig(payload) {
  const client = getClient();
  const { data, error } = await client
    .from("gigs")
    .insert(payload)
    .select(
      "id,title,client_name,event_date,share_token,created_at,base_setlist_id"
    )
    .single();
  if (error) throw error;
  return data;
}

function getPublicEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then restart dev server."
    );
  }
  return { url, anon };
}

function getPublicClient(shareToken) {
  const { url, anon } = getPublicEnv();
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: {
        "x-gig-token": shareToken,
      },
    },
  });
}

export async function fetchPublicGigAndSongs(shareToken) {
  const client = getPublicClient(shareToken);
  const { data: gig, error: gigError } = await client
    .from("gigs")
    .select("id,title,event_date,user_id,base_setlist_id")
    .eq("share_token", shareToken)
    .single();
  if (gigError) throw gigError;

  const { data: songs, error: songsError } = await client
    .from("songs")
    .select("id,title,original_artist")
    .eq("user_id", gig.user_id)
    .order("created_at", { ascending: false });
  if (songsError) throw songsError;

  return {
    gig: {
      id: gig.id,
      title: gig.title,
      eventDate: gig.event_date,
    },
    songs: (songs || []).map((song) => ({
      id: song.id,
      title: song.title,
      originalArtist: song.original_artist,
    })),
    preselectedSongIds: [],
  };
}

export async function submitPublicSetlist({ shareToken, songIdsOrdered, notes }) {
  const client = getPublicClient(shareToken);
  const { data: gig, error: gigError } = await client
    .from("gigs")
    .select("id")
    .eq("share_token", shareToken)
    .single();
  if (gigError) throw gigError;

  const { data: submission, error: submissionError } = await client
    .from("client_submissions")
    .insert({ gig_id: gig.id, notes: notes || null })
    .select("id")
    .single();
  if (submissionError) throw submissionError;

  if (!songIdsOrdered.length) return { id: submission.id };
  const items = songIdsOrdered.map((songId, index) => ({
    submission_id: submission.id,
    song_id: songId,
    position: index + 1,
  }));
  const { error: itemsError } = await client
    .from("submission_items")
    .insert(items);
  if (itemsError) throw itemsError;

  return { id: submission.id };
}
