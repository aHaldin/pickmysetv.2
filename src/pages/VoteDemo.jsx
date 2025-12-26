import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import LiveVoteDemo from "../components/LiveVoteDemo";
import SEO from "../components/SEO";
import { getSession, vote, reset, subscribeToSession } from "../hooks/useSessionStore";

export default function VoteDemo() {
  const { code: rawCode } = useParams();
  const code = (rawCode || "").toUpperCase();
  const [session, setSession] = useState(() => getSession(code));

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

  const handleVote = (songId) => {
    vote(code, songId);
    reload();
  };

  const handleReset = () => {
    reset(code);
    reload();
  };

  return (
    <main className="py-10 space-y-8">
      <SEO
        title="Audience Voting | PickMySet"
        description="Vote on the next song in real time with PickMySet — no app, no login, just vote."
      />
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Audience Voting Demo</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold">Audience Voting Demo</h1>
        <p className="text-sm text-white/65">No app. No login. Just vote.</p>
      </div>

      <div>
        <LiveVoteDemo songs={sortedSongs} topSong={topSong} onVote={handleVote} onReset={handleReset} />
      </div>
    </main>
  );
}
