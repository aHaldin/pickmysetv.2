import React, { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { sendPasswordReset } from "../lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err?.message || "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
      <SEO
        title="Reset Password | PickMySet"
        description="Send a password reset link for your PickMySet account."
        robots="noindex, nofollow"
      />
      <div className="glass-card rounded-3xl p-8 soft-border w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">PickMySet</p>
          <h1 className="text-3xl font-extrabold">Reset password</h1>
          <p className="text-sm text-white/60">
            Enter your account email and we’ll send a reset link.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-white/80">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              placeholder="you@band.com"
            />
          </label>
          {error ? <p className="text-sm text-brandPink">{error}</p> : null}
          {sent ? (
            <p className="text-sm text-green-300">Reset link sent. Check your inbox.</p>
          ) : null}
          <button
            type="submit"
            className="button-glow w-full rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <div className="text-center text-sm text-white/60">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-white hover:text-white/80">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
