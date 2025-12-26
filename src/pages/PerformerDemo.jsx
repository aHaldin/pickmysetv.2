import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO";
import { getSession, vote, reset, subscribeToSession } from "../hooks/useSessionStore";

export default function PerformerDemo() {
  const { code: rawCode } = useParams();
  const code = (rawCode || "").toUpperCase();
  const [session, setSession] = useState(() => getSession(code));
  const [lockedSongId, setLockedSongId] = useState(() => {
    try {
      return localStorage.getItem(`pms_lock_${code}`) || null;
    } catch {
      return null;
    }
  });
  const [showPdfSong, setShowPdfSong] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hideQr, setHideQr] = useState(false);
  const [lyricsSize, setLyricsSize] = useState(1);
  const [autoScroll, setAutoScroll] = useState(false);
  const lyricsRef = useRef(null);
  const voteLink = `${window.location.origin}/vote/${code}`;

  const reload = useCallback(() => {
    setSession(getSession(code));
  }, [code]);

  useEffect(() => {
    reload();
    const unsub = subscribeToSession(code, reload);
    return unsub;
  }, [code, reload]);

  const sortedSongs = useMemo(() => [...(session?.songs || [])].sort((a, b) => b.votes - a.votes), [session?.songs]);
  const topSong = sortedSongs[0];

  const displayedSong = useMemo(() => {
    if (!lockedSongId) return topSong;
    const found = sortedSongs.find((s) => s.id === lockedSongId);
    return found || topSong;
  }, [lockedSongId, sortedSongs, topSong]);

  const trackInfo = displayedSong ? getTrackEmbed(displayedSong.backingTrackUrl) : null;

  useEffect(() => {
    if (!lockedSongId) setAutoScroll(false);
  }, [lockedSongId]);

  const handleVote = (id) => {
    vote(code, id);
    reload();
  };

  const handleReset = () => {
    reset(code);
    setLockedSongId(null);
    localStorage.removeItem(`pms_lock_${code}`);
    reload();
    setConfirmReset(false);
  };

  const handleLock = () => {
    if (topSong) {
      setLockedSongId(topSong.id);
      try {
        localStorage.setItem(`pms_lock_${code}`, topSong.id);
      } catch (e) {
        console.error("Failed to persist lock", e);
      }
    }
  };

  const handleCopy = async (text = voteLink) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <>
      <SEO
        title="Performer Screen | PickMySet"
        description="Run your set with live audience votes, lyrics, and backing tracks on PickMySet."
      />
      <main className="py-10 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brandPurple to-brandPink animate-pulse" />
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stage mode</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Performer screen</h1>
          <p className="text-sm text-white/65">Session code: {code}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6 soft-border space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brandPurple to-brandPink animate-pulse" />
                    Live top song
                  </p>
                  <h2 className="text-3xl font-extrabold text-white">{displayedSong?.title || "—"}</h2>
                  <p className="text-lg text-white/70">{displayedSong?.artist || "Artist N/A"}</p>
                  <p className="text-sm text-white/60">Votes: {displayedSong?.votes ?? 0}</p>
                  {lockedSongId && displayedSong && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-300/50 bg-green-300/10 px-3 py-1 text-xs font-semibold text-green-200">
                      Locked: {displayedSong.title}
                    </span>
                  )}
                  {lockedSongId && topSong && lockedSongId !== topSong.id && (
                    <p className="text-xs text-white/60">Live leader: {topSong.title}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLock}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                  >
                    Lock next song
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLockedSongId(null);
                      localStorage.removeItem(`pms_lock_${code}`);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                  >
                    Clear lock
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                  >
                    Reset votes
                  </button>
                </div>
              </div>
            </div>
            {trackInfo && (
              <BackingTrackPanel info={trackInfo} link={topSong?.backingTrackUrl} />
            )}
            {topSong?.lyrics && (
              <LyricsPanel
                lyrics={topSong.lyrics}
                size={lyricsSize}
                onSizeChange={setLyricsSize}
                autoScroll={autoScroll}
                onToggleScroll={setAutoScroll}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6 soft-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Audience join</p>
                  <p className="text-lg font-semibold text-white">Share the link</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={hideQr}
                    onChange={(e) => setHideQr(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent"
                  />
                  Hide QR
                </label>
              </div>
              <p className="text-sm text-white/70">Code: <span className="font-semibold text-white">{code}</span></p>
              <LinkRow label="Audience link" value={voteLink} onCopy={() => handleCopy(voteLink)} />
              {!hideQr && (
                <div className="flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(voteLink)}`}
                    alt="QR code"
                    className="rounded-xl border border-white/10 bg-white/5 p-2"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleCopy()}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10 w-full"
              >
                Copy audience link
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 soft-border">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Next up</p>
              <h3 className="text-xl font-semibold text-white">Ranked by votes</h3>
            </div>
            <p className="text-xs text-white/60">Top {Math.min(10, sortedSongs.length)}</p>
          </div>
          <NextList
            songs={sortedSongs.slice(0, 10)}
            onPdf={(song) => setShowPdfSong(song)}
          />
        </div>
      </main>

      {showPdfSong && (
        <Modal title={`${showPdfSong.title} — PDF`} onClose={() => setShowPdfSong(null)}>
          {showPdfSong.pdfUrl ? (
            <iframe title="PDF" src={showPdfSong.pdfUrl} className="w-full h-[60vh] rounded-xl border border-white/10 bg-black/60" />
          ) : (
            <p className="text-sm text-white/70">No PDF attached.</p>
          )}
        </Modal>
      )}

      {confirmReset && (
        <Modal title="Reset votes?" onClose={() => setConfirmReset(false)}>
          <p className="text-sm text-white/70">This will reset all votes in this session.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/15 bg-gradient-to-r from-brandPurple to-brandPink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Reset votes
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function getTrackEmbed(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/([\w-]+)|v=([\w-]+))/i);
  if (ytMatch) {
    const id = ytMatch[1] || ytMatch[2];
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}?rel=0` };
  }
  if (url.includes("open.spotify.com/track")) {
    const embedUrl = url.replace("open.spotify.com/track", "open.spotify.com/embed/track");
    return { type: "spotify", embedUrl };
  }
  const isAudio = /\.(mp3|wav|m4a|ogg)$/i.test(url);
  return { type: isAudio ? "audio" : "link", embedUrl: url };
}

function BackingTrackPanel({ info, link }) {
  return (
    <div className="glass-card rounded-2xl p-4 soft-border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Backing track</h4>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/70 hover:text-white underline"
          >
            Open link
          </a>
        )}
      </div>
      {info.type === "youtube" && (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
          <iframe
            title="YouTube track"
            src={info.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}
      {info.type === "spotify" && (
        <iframe
          title="Spotify track"
          src={info.embedUrl}
          width="100%"
          height="180"
          allow="encrypted-media"
          className="rounded-xl border border-white/10 bg-black/40"
        />
      )}
      {info.type === "audio" && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <audio controls className="w-full">
            <source src={info.embedUrl} />
            Your browser does not support audio.
          </audio>
        </div>
      )}
      {info.type === "link" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
          <a href={info.embedUrl} target="_blank" rel="noreferrer" className="underline text-white">
            Open backing track
          </a>
        </div>
      )}
    </div>
  );
}

function LyricsPanel({ lyrics, size, onSizeChange, autoScroll, onToggleScroll }) {
  const contentRef = useRef(null);
  const lineHeightRef = useRef(24);
  const [linesPerMinute, setLinesPerMinute] = useState(6);

  useEffect(() => {
    if (!autoScroll || !contentRef.current) return undefined;

    const pxPerMinute = lineHeightRef.current * linesPerMinute;
    const intervalMs = 200;
    const pxPerTick = pxPerMinute / (60000 / intervalMs);

    const id = setInterval(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop += pxPerTick;
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [autoScroll, linesPerMinute]);

  useEffect(() => {
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [lyrics]);

  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current.querySelector("p, div");
    if (el) {
      const computed = parseFloat(window.getComputedStyle(el).lineHeight);
      if (!Number.isNaN(computed) && computed > 0) {
        lineHeightRef.current = computed;
      } else {
        lineHeightRef.current = el.getBoundingClientRect().height;
      }
    }
  }, [lyrics]);

  const fontSize = `${Math.max(0.8, Math.min(2, size))}rem`;

  return (
    <div className="glass-card rounded-2xl p-4 soft-border space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-white">Lyrics</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
            onClick={() => onSizeChange(size + 0.1)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => onSizeChange(size - 0.1)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            A-
          </button>
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => onToggleScroll(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-transparent"
            />
            Auto-scroll
          </label>
          <div className="flex items-center gap-2 text-xs text-white/70 w-full max-w-xs">
            <span>Speed</span>
            <input
              type="range"
              min="4"
              max="20"
              step="1"
              value={linesPerMinute}
              onChange={(e) => setLinesPerMinute(Number(e.target.value))}
              className="flex-1 accent-brandPink"
            />
            <span className="w-16 text-right">{linesPerMinute} l/m</span>
          </div>
        </div>
      </div>
      <div
        ref={contentRef}
        className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 overflow-y-auto"
        style={{ maxHeight: "320px", fontSize }}
        onWheel={() => onToggleScroll(false)}
        onTouchStart={() => onToggleScroll(false)}
      >
        <div className="whitespace-pre-wrap">{lyrics}</div>
      </div>
    </div>
  );
}

function LinkRow({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70 w-full">
      <div className="truncate">
        <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
        <p className="truncate text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
      >
        Copy
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NextList({ songs, onPdf }) {
  const itemRefs = useRef(new Map());
  const prevPositions = useRef(new Map());

  useLayoutEffect(() => {
    const newPositions = new Map();
    songs.forEach((song) => {
      const el = itemRefs.current.get(song.id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      newPositions.set(song.id, rect);
      const prev = prevPositions.current.get(song.id);
      if (prev) {
        const deltaY = prev.top - rect.top;
        if (deltaY) {
          el.style.transition = "transform 0s";
          el.style.transform = `translateY(${deltaY}px)`;
          requestAnimationFrame(() => {
            el.style.transition = "transform 220ms ease";
            el.style.transform = "";
          });
        }
      }
    });
    prevPositions.current = newPositions;
  }, [songs]);

  return (
    <ul className="space-y-2">
      {songs.map((song, idx) => (
        <li
          key={song.id}
          ref={(el) => {
            if (el) itemRefs.current.set(song.id, el);
            else itemRefs.current.delete(song.id);
          }}
          className="flex flex-col gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white/80 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white/70">
              {idx + 1}
            </span>
            <div>
              <p className="text-base font-semibold text-white">{song.title}</p>
              <p className="text-xs text-white/60">{song.artist || "Artist N/A"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{song.votes ?? 0} votes</span>
            {song.pdfUrl && (
              <button
                type="button"
                onClick={() => onPdf(song)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                PDF
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
