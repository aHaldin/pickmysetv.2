import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import {
  fetchGigById,
  fetchSetlistsSimple,
  fetchSetlistSongsDetailed,
} from "../lib/data";

function getStorageKey(gigId, setlistId, suffix) {
  return `pickmyset:perform:${gigId}:${setlistId}:${suffix}`;
}

export default function PerformGig() {
  const { gigId } = useParams();
  const [searchParams] = useSearchParams();
  const [gig, setGig] = useState(null);
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlistId, setSelectedSetlistId] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playedSongIds, setPlayedSongIds] = useState([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [gigData, setlistData] = await Promise.all([
          fetchGigById(gigId),
          fetchSetlistsSimple(),
        ]);
        setGig(gigData);
        setSetlists(setlistData);
        const fallbackId = setlistData[0]?.id || "";
        const preferredId = searchParams.get("setlistId");
        const hasPreferred = preferredId && setlistData.some((list) => list.id === preferredId);
        const hasBase = setlistData.some((list) => list.id === gigData.base_setlist_id);
        const defaultId = hasPreferred ? preferredId : hasBase ? gigData.base_setlist_id : fallbackId;
        setSelectedSetlistId(defaultId);
        setError("");
      } catch (err) {
        setError("Not authorized");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gigId]);

  useEffect(() => {
    if (!selectedSetlistId) {
      setSongs([]);
      return;
    }
    const loadSongs = async () => {
      try {
        const items = await fetchSetlistSongsDetailed(selectedSetlistId);
        setSongs(items);
      } catch (err) {
        setError("Unable to load setlist songs.");
      }
    };
    loadSongs();
  }, [selectedSetlistId]);

  useEffect(() => {
    if (!gigId || !selectedSetlistId) return;
    const indexKey = getStorageKey(gigId, selectedSetlistId, "index");
    const playedKey = getStorageKey(gigId, selectedSetlistId, "played");
    const storedIndex = Number(localStorage.getItem(indexKey) || 0);
    const storedPlayed = JSON.parse(localStorage.getItem(playedKey) || "[]");
    setCurrentIndex(Number.isFinite(storedIndex) ? storedIndex : 0);
    setPlayedSongIds(Array.isArray(storedPlayed) ? storedPlayed : []);
  }, [gigId, selectedSetlistId]);

  useEffect(() => {
    if (!gigId || !selectedSetlistId) return;
    const indexKey = getStorageKey(gigId, selectedSetlistId, "index");
    localStorage.setItem(indexKey, String(currentIndex));
  }, [gigId, selectedSetlistId, currentIndex]);

  useEffect(() => {
    if (!gigId || !selectedSetlistId) return;
    const playedKey = getStorageKey(gigId, selectedSetlistId, "played");
    localStorage.setItem(playedKey, JSON.stringify(playedSongIds));
  }, [gigId, selectedSetlistId, playedSongIds]);

  const currentSong = songs[currentIndex]?.song || null;
  const upNext = useMemo(() => songs.slice(currentIndex + 1, currentIndex + 4), [songs, currentIndex]);

  const handleJumpTo = (index) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(songs.length - 1, prev + 1));
  };

  const handleMarkPlayed = () => {
    if (!currentSong) return;
    setPlayedSongIds((prev) => {
      if (prev.includes(currentSong.id)) {
        return prev.filter((id) => id !== currentSong.id);
      }
      return [...prev, currentSong.id];
    });
    if (currentIndex < songs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading gig mode...</p>
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

  return (
    <div className="min-h-screen bg-midnight text-white px-4 py-10">
      <SEO title="Gig Mode | PickMySet" robots="noindex, nofollow" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gig Mode</p>
            <h1 className="text-3xl font-extrabold">{gig?.title}</h1>
            <p className="text-sm text-white/65">
              {gig?.event_date ? new Date(gig.event_date).toLocaleDateString() : "Date TBD"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs uppercase tracking-wide text-white/50">Setlist</label>
            <select
              value={selectedSetlistId}
              onChange={(e) => setSelectedSetlistId(e.target.value)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white focus:border-brandPink focus:outline-none"
            >
              {setlists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {songs.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 soft-border text-center">
            <p className="text-sm text-white/70">No songs in this setlist. Add songs in Dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 soft-border space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Now playing</p>
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-extrabold">{currentSong?.title}</h2>
                  <p className="text-lg text-white/70">{currentSong?.original_artist || "Artist N/A"}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkPlayed}
                    className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
                  >
                    Mark played
                  </button>
                  {currentSong?.backing_track_url && (
                    <a
                      href={currentSong.backing_track_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                    >
                      Open track
                    </a>
                  )}
                  {currentSong?.lyrics && (
                    <button
                      type="button"
                      onClick={() => setShowLyrics((prev) => !prev)}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                    >
                      {showLyrics ? "Hide lyrics" : "Lyrics"}
                    </button>
                  )}
                </div>
              </div>

              {showLyrics && currentSong?.lyrics && (
                <div className="glass-card rounded-3xl p-6 soft-border space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Lyrics</p>
                  <div className="text-sm text-white/80 whitespace-pre-wrap">
                    {currentSong.lyrics}
                  </div>
                </div>
              )}

              <div className="glass-card rounded-3xl p-6 soft-border space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Up next</p>
                {upNext.length === 0 && (
                  <p className="text-sm text-white/60">End of setlist.</p>
                )}
                <div className="space-y-2">
                  {upNext.map((item, idx) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                      <p className="font-semibold text-white">{currentIndex + idx + 2}. {item.song?.title}</p>
                      <p className="text-xs text-white/60">{item.song?.original_artist || "Artist N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 soft-border space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Full setlist</p>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {songs.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isPlayed = playedSongIds.includes(item.song?.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleJumpTo(idx)}
                      className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${
                        isCurrent
                          ? "border-brandPink/70 bg-white/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <p className={`text-white ${isPlayed ? "line-through text-white/50" : ""}`}>
                        {idx + 1}. {item.song?.title}
                      </p>
                      <p className="text-xs text-white/60">{item.song?.original_artist || "Artist N/A"}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
