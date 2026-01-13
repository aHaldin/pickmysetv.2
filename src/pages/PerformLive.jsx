import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import { fetchSetlistSongsDetailed, fetchSetlistsSimple } from "../lib/data";

function getStorageKey(setlistId) {
  return `pickmyset:live:${setlistId}`;
}

export default function PerformLive() {
  const [searchParams] = useSearchParams();
  const [setlistId, setSetlistId] = useState("");
  const [setlistName, setSetlistName] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playedSongIds, setPlayedSongIds] = useState([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerIdRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const ytTickRef = useRef(null);
  const ytApiReadyRef = useRef(null);
  const ytIsDraggingRef = useRef(false);
  const ytDurationRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackError, setTrackError] = useState("");
  const [ytReady, setYtReady] = useState(false);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytCurrentSec, setYtCurrentSec] = useState(0);
  const [ytDurationSec, setYtDurationSec] = useState(0);
  const [ytIsDragging, setYtIsDragging] = useState(false);
  const [ytDragValue, setYtDragValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = searchParams.get("setlist") || "";
    setSetlistId(id);
  }, [searchParams]);

  useEffect(() => {
    if (!setlistId) return;
    const load = async () => {
      try {
        const [lists, items] = await Promise.all([
          fetchSetlistsSimple(),
          fetchSetlistSongsDetailed(setlistId),
        ]);
        const list = lists.find((entry) => entry.id === setlistId);
        setSetlistName(list?.name || "Setlist");
        setSongs(items);
        setError("");
      } catch (err) {
        setError("Unable to load setlist.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setlistId]);

  useEffect(() => {
    if (!setlistId) return;
    const raw = localStorage.getItem(getStorageKey(setlistId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed?.currentIndex)) {
        setCurrentIndex(parsed.currentIndex);
      }
      if (Array.isArray(parsed?.playedSongIds)) {
        setPlayedSongIds(parsed.playedSongIds);
      }
    } catch (_err) {
      // ignore
    }
  }, [setlistId]);

  useEffect(() => {
    if (!setlistId) return;
    localStorage.setItem(
      getStorageKey(setlistId),
      JSON.stringify({ currentIndex, playedSongIds, updatedAt: Date.now() })
    );
  }, [setlistId, currentIndex, playedSongIds]);

  const currentSong = songs[currentIndex]?.song || null;
  const upNext = useMemo(() => songs.slice(currentIndex + 1, currentIndex + 4), [songs, currentIndex]);
  const trackUrl = currentSong?.backing_track_url || "";
  const isAudioFile = /\.(mp3|wav|m4a)(\?.*)?$/i.test(trackUrl);
  const spotifyMatch =
    trackUrl.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/) ||
    trackUrl.match(/spotify:track:([a-zA-Z0-9]+)/);
  const spotifyId = spotifyMatch ? spotifyMatch[1] : "";
  const isSpotify = Boolean(spotifyId);
  const extractYouTubeId = (url) => {
    if (!url) return "";
    const match =
      url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
      url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/) ||
      url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : "";
  };
  const videoId = useMemo(() => extractYouTubeId(trackUrl), [trackUrl]);
  const isYouTube = Boolean(videoId);
  const hasTrack = Boolean(trackUrl);

  useEffect(() => {
    ytIsDraggingRef.current = ytIsDragging;
  }, [ytIsDragging]);

  useEffect(() => {
    ytDurationRef.current = ytDurationSec;
  }, [ytDurationSec]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex((prev) => Math.min(songs.length - 1, prev + 1));

  const handleMarkPlayed = () => {
    if (!currentSong) return;
    setPlayedSongIds((prev) =>
      prev.includes(currentSong.id)
        ? prev.filter((id) => id !== currentSong.id)
        : [...prev, currentSong.id]
    );
    if (currentIndex < songs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleJumpTo = (index) => setCurrentIndex(index);

  const ensureYouTubeApi = () => {
    if (window.YT?.Player) return Promise.resolve();
    if (ytApiReadyRef.current) return ytApiReadyRef.current;
    ytApiReadyRef.current = new Promise((resolve) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === "function") prevReady();
        resolve();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    });
    return ytApiReadyRef.current;
  };

  const cleanupYouTube = () => {
    try {
      if (ytTickRef.current) {
        clearInterval(ytTickRef.current);
        ytTickRef.current = null;
      }
    } catch (_) {}
    try {
      ytPlayerRef.current?.stopVideo?.();
    } catch (_) {}
    try {
      ytPlayerRef.current?.destroy?.();
    } catch (_) {}
    ytPlayerRef.current = null;
    setYtLoading(false);
    setYtReady(false);
    setYtPlaying(false);
    setYtCurrentSec(0);
    setYtDurationSec(0);
    setYtIsDragging(false);
    setYtDragValue(0);
  };

  useEffect(() => {
    setTrackError("");
    setIsPlaying(false);
    setIsLoading(false);
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [trackUrl]);

  useEffect(() => {
    if (!videoId) {
      cleanupYouTube();
      return undefined;
    }
    let cancelled = false;

    (async () => {
      cleanupYouTube();
      setYtLoading(true);
      await ensureYouTubeApi();
      if (cancelled) return;
      const el = document.getElementById(ytContainerIdRef.current);
      if (!el) {
        console.error("YT container missing");
        setYtLoading(false);
        return;
      }
      try {
        ytPlayerRef.current = new window.YT.Player(ytContainerIdRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              setYtReady(true);
              setYtLoading(false);
              try {
                setYtDurationSec(ytPlayerRef.current?.getDuration?.() || 0);
              } catch (_) {}
              ytTickRef.current = window.setInterval(() => {
                try {
                  if (!ytPlayerRef.current) return;
                  if (ytIsDraggingRef.current) return;
                  const t = ytPlayerRef.current.getCurrentTime?.() || 0;
                  const d = ytPlayerRef.current.getDuration?.() || 0;
                  setYtCurrentSec(t);
                  if (d && !ytDurationRef.current) setYtDurationSec(d);
                } catch (_) {}
              }, 250);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const playing = e?.data === window.YT.PlayerState.PLAYING;
              setYtPlaying(playing);
            },
            onError: (e) => {
              console.error("YT error", e);
              if (cancelled) return;
              setYtLoading(false);
            },
          },
        });
      } catch (err) {
        console.error("Failed to create YT player", err);
        setYtLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      cleanupYouTube();
    };
  }, [videoId]);

  const handleTogglePlay = async () => {
    if (!hasTrack) return;
    if (isYouTube && ytPlayerRef.current) {
      if (!ytReady) return;
      if (ytPlaying) {
        ytPlayerRef.current.pauseVideo?.();
      } else {
        ytPlayerRef.current.setVolume?.(100);
        ytPlayerRef.current.playVideo?.();
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      return;
    }
    try {
      await audioRef.current.play();
    } catch (_err) {
      setTrackError("Track can’t be loaded");
    }
  };

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value);
    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo?.(nextTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  };

  const handleYTDrag = (event) => {
    const nextValue = Number(event.target.value);
    setYtIsDragging(true);
    setYtDragValue(nextValue);
  };

  const handleYTSeek = () => {
    if (!ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo?.(ytDragValue, true);
    setYtCurrentSec(ytDragValue);
    setYtIsDragging(false);
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading live mode...</p>
      </div>
    );
  }

  if (!setlistId || error) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-6 soft-border text-center space-y-2">
          <p className="text-sm text-white/70">{error || "Setlist not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight text-white px-4 py-10">
      <SEO title="Live Mode | PickMySet" robots="noindex, nofollow" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Live Mode</p>
          <h1 className="text-3xl font-extrabold">{setlistName}</h1>
        </header>
        <div
          id={ytContainerIdRef.current}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />

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
                  {hasTrack && (
                    <span className="sr-only">Track available</span>
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
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">Backing track</p>
                    {trackError && !isSpotify && !isYouTube && (
                      <span className="text-xs text-brandPink">{trackError}</span>
                    )}
                  </div>
                  {!hasTrack ? (
                    <p className="text-sm text-white/60">No backing track for this song.</p>
                  ) : isSpotify ? (
                    <div className="space-y-3">
                      <iframe
                        title="Spotify track"
                        src={`https://open.spotify.com/embed/track/${spotifyId}`}
                        width="100%"
                        height="152"
                        style={{ borderRadius: "16px" }}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        Open in Spotify
                      </a>
                    </div>
                  ) : isYouTube ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        disabled={!ytReady}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                      >
                        {ytLoading || !ytReady ? "Loading..." : ytPlaying ? "Pause" : "Play"}
                      </button>
                      <div className="text-xs text-white/60">
                        {formatTime(ytIsDragging ? ytDragValue : ytCurrentSec)} / {formatTime(ytDurationSec)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={ytDurationSec || 0}
                        step="0.25"
                        value={ytIsDragging ? ytDragValue : ytCurrentSec}
                        onChange={handleYTDrag}
                        onMouseUp={handleYTSeek}
                        onTouchEnd={handleYTSeek}
                        className="w-full accent-brandPink"
                      />
                    </div>
                  ) : isAudioFile ? (
                    <div className="space-y-3">
                      <audio
                        ref={audioRef}
                        src={trackUrl}
                        onLoadedMetadata={(event) => {
                          setDuration(event.currentTarget.duration || 0);
                          setIsLoading(false);
                        }}
                        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsLoading(true)}
                        onCanPlay={() => setIsLoading(false)}
                        onError={() => {
                          setTrackError("Track can’t be loaded");
                          setIsLoading(false);
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTogglePlay}
                          disabled={isLoading}
                          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                        >
                          {isPlaying ? "Pause" : "Play"}
                        </button>
                        <div className="text-xs text-white/60 min-w-[70px]">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full accent-brandPink"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">
                      Unsupported link. Use direct audio file or Spotify track URL.
                    </p>
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
