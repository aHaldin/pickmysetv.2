import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { getUser, onAuthStateChange, signUpWithEmail } from "../lib/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe;
    getUser()
      .then((u) => {
        if (u) navigate("/dashboard", { replace: true });
      })
      .catch(() => {});

    unsubscribe = onAuthStateChange((_event, u) => {
      if (u) navigate("/dashboard", { replace: true });
    });

    return () => unsubscribe && unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to sign up. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4">
      <SEO
        title="Create an Account | PickMySet"
        description="Create your PickMySet performer account."
        robots="noindex, nofollow"
      />
      <div className="glass-card rounded-3xl p-8 soft-border w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">PickMySet</p>
          <h1 className="text-3xl font-extrabold">Create account</h1>
          <p className="text-sm text-white/60">
            Start your performer account to manage setlists and shows.
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
          <label className="block text-sm font-semibold text-white/80">
            Password
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              placeholder="Create a password"
            />
          </label>
          <label className="block text-sm font-semibold text-white/80">
            Confirm password
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              placeholder="Repeat your password"
            />
          </label>
          {error ? (
            <p className="text-sm text-brandPink">{error}</p>
          ) : null}
          <button
            type="submit"
            className="button-glow w-full rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <div className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-white hover:text-white/80">
            Log in
          </Link>
        </div>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
