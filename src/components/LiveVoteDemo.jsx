import React, { useLayoutEffect, useRef, useState, useMemo } from "react";

export default function LiveVoteDemo({ songs, topSong, onVote, onReset }) {
  const isControlled = Array.isArray(songs) && typeof onVote === "function";

  const [localSongs, setLocalSongs] = useState([
    { id: 'midnight-pulse', title: 'Midnight Pulse', artist: 'Solea', votes: 182 },
    { id: 'neon-echoes', title: 'Neon Echoes', artist: 'Aero', votes: 164 },
    { id: 'city-lights', title: 'City Lights', artist: 'Nova', votes: 143 },
    { id: 'velvet-sky', title: 'Velvet Sky', artist: 'Lumen', votes: 118 },
  ]);

  const localTop = useMemo(() => [...localSongs].sort((a, b) => b.votes - a.votes)[0], [localSongs]);

  const list = isControlled ? songs : [...localSongs].sort((a, b) => b.votes - a.votes);
  const currentTop = isControlled ? topSong : localTop;
  const vote = isControlled
    ? onVote
    : (id) => setLocalSongs((prev) => prev.map((s) => (s.id === id ? { ...s, votes: s.votes + 1 } : s)));
  const reset = isControlled
    ? onReset ?? (() => {})
    : () => setLocalSongs([
        { id: 'midnight-pulse', title: 'Midnight Pulse', artist: 'Solea', votes: 182 },
        { id: 'neon-echoes', title: 'Neon Echoes', artist: 'Aero', votes: 164 },
        { id: 'city-lights', title: 'City Lights', artist: 'Nova', votes: 143 },
        { id: 'velvet-sky', title: 'Velvet Sky', artist: 'Lumen', votes: 118 },
      ]);

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-soft soft-border">
      <div className="flex items-start justify-between pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Top voted song</p>
          <p className="mt-1 text-xl font-semibold">{currentTop?.title}</p>
          <p className="text-sm text-white/50">by {currentTop?.artist}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-4 py-2 text-xs font-bold text-white">
            {currentTop?.votes} votes
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-white/60 hover:text-white transition"
          >
            Reset demo
          </button>
        </div>
      </div>
      <SongList songs={list} onVote={vote} />
    </div>
  );
}

export function SongList({ songs, onVote }) {
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
          el.style.transition = 'transform 0s';
          el.style.transform = `translateY(${deltaY}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 220ms ease';
            el.style.transform = '';
          });
        }
      }
    });

    prevPositions.current = newPositions;
  }, [songs]);

  return (
    <div className="rounded-xl bg-white/5 p-3 soft-border">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/50">
        <span>Rank</span>
        <span>Votes</span>
      </div>
      <ul className="space-y-2">
        {songs.map((entry, idx) => (
          <li
            key={entry.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(entry.id, el);
              } else {
                itemRefs.current.delete(entry.id);
              }
            }}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-3 text-sm text-white/80"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white/70">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{entry.title}</p>
                <p className="text-xs text-white/60">{entry.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{entry.votes}</span>
              {onVote && (
                <button
                  type="button"
                  onClick={() => onVote(entry.id)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  Vote
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
