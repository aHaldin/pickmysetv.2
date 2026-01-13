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

    const body = await req.json().catch(() => null);
    const token = body?.token;
    const songIdsOrdered = body?.songIdsOrdered;
    const notes = body?.notes || null;

    if (!token || !Array.isArray(songIdsOrdered)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false },
    });

    const { data: gig, error: gigError } = await supabase
      .from("gigs")
      .select("id,user_id")
      .eq("share_token", token)
      .single();

    if (gigError || !gig) {
      return new Response(
        JSON.stringify({ error: "Gig not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: songRows, error: songError } = await supabase
      .from("songs")
      .select("id")
      .eq("user_id", gig.user_id)
      .in("id", songIdsOrdered);

    if (songError) {
      return new Response(
        JSON.stringify({ error: songError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedIds = new Set((songRows || []).map((row) => row.id));
    const filtered = songIdsOrdered.filter((id) => allowedIds.has(id));

    if (!filtered.length) {
      return new Response(
        JSON.stringify({ error: "No valid songs submitted." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: submission, error: submissionError } = await supabase
      .from("client_submissions")
      .insert({ gig_id: gig.id, notes })
      .select("id")
      .single();

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: submissionError?.message || "Unable to create submission." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const items = filtered.map((songId, index) => ({
      submission_id: submission.id,
      song_id: songId,
      position: index + 1,
    }));

    const { error: itemsError } = await supabase
      .from("submission_items")
      .insert(items);

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: itemsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ id: submission.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
