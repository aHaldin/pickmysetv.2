import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO";
import { fetchPublicGigAndSongs, submitPublicSetlist } from "../lib/data";

export default function ClientRequest() {
  const { shareToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gigData, setGigData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    const load = async () => {
      try {
        const data = await fetchPublicGigAndSongs(shareToken);
        if (!data) {
          setError("This client link could not be found.");
          setLoading(false);
          return;
        }
        setGigData(data);
        if (!draftLoaded) {
          const preselected = data.preselectedSongIds || [];
          if (preselected.length && data.songs?.length) {
            const available = new Set(data.songs.map((song) => song.id));
            setSelectedSongIds(preselected.filter((id) => available.has(id)));
          } else {
            setSelectedSongIds([]);
          }
        }
      } catch (err) {
        setError(err?.message || "Unable to load this client link.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareToken]);

  const songs = gigData?.songs || [];
  const selectedSongSet = useMemo(
    () => new Set(selectedSongIds),
    [selectedSongIds]
  );
  const selectedSongs = useMemo(() => {
    const byId = new Map(songs.map((song) => [song.id, song]));
    return selectedSongIds.map((id) => byId.get(id)).filter(Boolean);
  }, [songs, selectedSongIds]);
  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const term = search.trim().toLowerCase();
    return songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(term) ||
        song.originalArtist?.toLowerCase().includes(term)
    );
  }, [songs, search]);

  const handleAddSong = (song) => {
    if (selectedSongSet.has(song.id)) return;
    setSelectedSongIds((prev) => [...prev, song.id]);
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= selectedSongIds.length) return;
    const next = [...selectedSongIds];
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedSongIds(next);
  };

  const handleRemove = (songId) => {
    setSelectedSongIds((prev) => prev.filter((id) => id !== songId));
  };

  const handleSubmit = async () => {
    if (!shareToken || submitted || selectedSongIds.length === 0) return;
    try {
      await submitPublicSetlist({
        shareToken,
        notes,
        songIdsOrdered: selectedSongIds,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Unable to submit this setlist.");
    }
  };

  useEffect(() => {
    if (!shareToken || !gigData?.songs?.length) return;
    const key = `pickmyset:draft:${shareToken}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setDraftLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed?.selectedSongIds) ? parsed.selectedSongIds : [];
      const available = new Set(gigData.songs.map((song) => song.id));
      setSelectedSongIds(ids.filter((id) => available.has(id)));
    } catch (_err) {
      setSelectedSongIds([]);
    } finally {
      setDraftLoaded(true);
    }
  }, [shareToken, gigData]);

  useEffect(() => {
    if (!shareToken || !draftLoaded) return;
    const key = `pickmyset:draft:${shareToken}`;
    localStorage.setItem(
      key,
      JSON.stringify({ selectedSongIds, updatedAt: Date.now() })
    );
  }, [shareToken, selectedSongIds, draftLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
        <p className="text-sm text-white/70">Loading client link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-6 soft-border text-center space-y-2">
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  const gig = gigData?.gig;

  return (
    <div className="min-h-screen bg-midnight text-white px-4 py-10">
      <SEO
        title="Build your setlist | PickMySet"
        description="Select songs and build a custom setlist for your event."
        robots="noindex, nofollow"
      />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">PickMySet Client Request</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Build your setlist</h1>
          <p className="text-sm text-white/65">
            {gig?.title || "Your event"} {gig?.artistEmail ? `· ${gig.artistEmail}` : ""}
          </p>
        </header>

        {submitted ? (
          <div className="glass-card rounded-3xl p-8 soft-border text-center space-y-3">
            <h2 className="text-2xl font-bold">Sent to artist ✅</h2>
            <p className="text-sm text-white/70">Your setlist request has been submitted.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-3xl p-6 soft-border space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Song library</p>
                  <h3 className="text-lg font-semibold text-white">Available songs</h3>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search songs"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
                />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredSongs.length === 0 && (
                  <p className="text-sm text-white/60">No songs match your search.</p>
                )}
                {filteredSongs.map((song) => {
                  const isAdded = selectedSongSet.has(song.id);
                  return (
                  <div
                    key={song.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{song.title}</p>
                      <p className="text-xs text-white/60">{song.originalArtist || "Artist N/A"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSong(song)}
                      disabled={isAdded}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                    >
                      {isAdded ? "Added" : "Add"}
                    </button>
                  </div>
                )})}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 soft-border space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Your setlist</p>
                <h3 className="text-lg font-semibold text-white">Arrange the order</h3>
              </div>
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {selectedSongs.length === 0 && (
                  <p className="text-sm text-white/60">Pick songs from the left to begin.</p>
                )}
                {selectedSongs.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{idx + 1}. {item.title}</p>
                      <p className="text-xs text-white/60">{item.originalArtist || "Artist N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for the artist (optional)"
                rows={3}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedSongs.length === 0}
                className="button-glow w-full rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit setlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
