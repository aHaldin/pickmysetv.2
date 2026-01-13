import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { fetchSetlistItemCounts, fetchSetlistsSimple } from "../lib/data";

export default function PerformList() {
  const [setlists, setSetlists] = useState([]);
  const [setlistCounts, setSetlistCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const setlistsData = await fetchSetlistsSimple();
        setSetlists(setlistsData);
        const counts = await fetchSetlistItemCounts(setlistsData.map((list) => list.id));
        setSetlistCounts(counts);
        setError("");
      } catch (err) {
        setError(err?.message || "Unable to load gigs.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uniqueSetlists = useMemo(() => {
    const map = new Map();
    setlists.forEach((list) => {
      if (!map.has(list.id)) map.set(list.id, list);
    });
    return Array.from(map.values());
  }, [setlists]);

  return (
    <main className="py-10 space-y-6">
      <SEO title="Gig Mode | PickMySet" robots="noindex, nofollow" />
      <div className="mx-auto max-w-5xl space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gig Mode</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold">Choose a setlist</h1>
        <p className="text-sm text-white/65">Click a setlist to start live mode.</p>
      </div>

      {error && (
        <div className="mx-auto max-w-5xl rounded-2xl border border-brandPink/40 bg-brandPink/10 px-4 py-3 text-sm text-white/80">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-5xl grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-white/60">Loading setlists...</p>}
        {!loading && uniqueSetlists.length === 0 && (
          <p className="text-sm text-white/60">No setlists yet. Add one in your dashboard.</p>
        )}
        {uniqueSetlists.map((list) => {
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => navigate(`/perform/live?setlist=${list.id}`)}
              className="glass-card group rounded-2xl p-5 soft-border text-left transition hover:-translate-y-1 hover:border-brandPink/70 hover:shadow-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-white">{list.name}</p>
              </div>
              <p className="text-xs text-white/60">{setlistCounts[list.id] || 0} songs</p>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition group-hover:border-brandPink/60">
                  Start live mode
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
