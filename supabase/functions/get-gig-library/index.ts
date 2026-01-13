import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) {
      return new Response(
        JSON.stringify({ error: "Server env missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false },
    });

    const { data: gig, error: gigError } = await supabase
      .from("gigs")
      .select("id,title,event_date,user_id,base_setlist_id")
      .eq("share_token", token)
      .single();

    if (gigError || !gig) {
      return new Response(
        JSON.stringify({ error: "Gig not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .select("id,title,original_artist")
      .eq("user_id", gig.user_id)
      .order("created_at", { ascending: false });

    if (songsError) {
      return new Response(
        JSON.stringify({ error: songsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let preselectedSongIds: string[] = [];
    if (gig.base_setlist_id) {
      const { data: items, error: itemsError } = await supabase
        .from("setlist_items")
        .select("song_id,position")
        .eq("setlist_id", gig.base_setlist_id)
        .order("position", { ascending: true });
      if (!itemsError && items) {
        preselectedSongIds = items.map((item) => item.song_id);
      }
    }

    return new Response(
      JSON.stringify({
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
        preselectedSongIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
