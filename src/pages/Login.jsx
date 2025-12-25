import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 soft-border w-full max-w-md space-y-6 text-center">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">PickMySet</p>
          <h1 className="text-3xl font-extrabold">Coming soon</h1>
          <p className="text-sm text-white/60">
            We are opening performer accounts in phases. Join the waitlist to get early access.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/#waitlist"
            className="button-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            Join the waitlist
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
