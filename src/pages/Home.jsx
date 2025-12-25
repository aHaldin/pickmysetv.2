import React, { useEffect, useState } from 'react';
import LiveVoteDemo from '../components/LiveVoteDemo';
import WaitlistEmbed from '../components/WaitlistEmbed';
import useHashScroll from '../hooks/useHashScroll';

const steps = [
  {
    title: 'Create your setlist',
    copy: 'Queue up tracks you are ready to play and set optional time limits.'
  },
  {
    title: 'Share the voting link/QR',
    copy: 'Audience scans or taps—no apps to install, no logins needed.'
  },
  {
    title: "Play what's winning",
    copy: 'See the leader in real time and roll seamlessly into the next track.'
  },
];

const benefits = [
  {
    label: 'For performers',
    items: ['Stay in control', 'Higher engagement', 'Fewer interruptions'],
  },
  {
    label: 'For audiences',
    items: ['Interactive & fun', 'Transparent voting', 'Instant feedback'],
  },
];

function Hero() {
  return (
    <section className="grid gap-10 py-10 lg:grid-cols-2 lg:items-center" id="top">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 soft-border">
            Live crowd picks
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brandPurple to-brandPink shadow-soft" />
          </p>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            All-in-one setlist
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Let the crowd pick the next song.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            Real-time voting for singers, bands and DJs — with lyrics, backing tracks, and everything you need for a set in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#waitlist"
            className="button-glow flex items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            Get early access
          </a>
          <a
            href="#how"
            className="flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
          >
            See how it works
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Lyrics</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Backing tracks</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Setlist control</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/70 sm:max-w-md">
          <Stat label="Audience stay rate" value="+28%" />
          <Stat label="Avg. song votes" value="1.4k" />
          <Stat label="Setup time" value="< 2 min" />
          <Stat label="Noise complaints" value="-63%" />
        </div>
        <p className="text-xs text-white/50">Example results from live events</p>
      </div>

      <div className="relative">
        <div className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-gradient-to-r from-brandPurple to-brandPink opacity-60 blur-[60px]" />
        <LiveVoteDemo />
      </div>
    </section>
  );
}

export default function Home() {
  useHashScroll();
  return (
    <>
      <Hero />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <Waitlist />
      <Footer />
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 text-left soft-border">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="py-12" id="how">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-brandPurple to-brandPink" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">How it works</p>
          <h2 className="text-2xl font-bold">Three steps from stage to screen</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, idx) => (
          <div key={step.title} className="glass-card h-full rounded-2xl p-5 soft-border">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink text-sm font-bold text-white">
              {idx + 1}
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-white/65">{step.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="py-12" id="benefits">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-brandPurple to-brandPink" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Why it works</p>
          <h2 className="text-2xl font-bold">Benefits on both sides of the stage</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {benefits.map((benefit) => (
          <div key={benefit.label} className="glass-card rounded-2xl p-6 soft-border">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{benefit.label}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{benefit.label === 'For performers' ? 'Stay in flow' : 'Feel involved'}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {benefit.items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brandPurple to-brandPink" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-12" id="pricing">
      <div className="glass-card rounded-3xl p-8 text-center soft-border">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pricing</p>
        <h2 className="mt-3 text-3xl font-extrabold">
          <span className="gradient-text">£19.99</span> / month
        </h2>
        <p className="mt-2 text-sm text-white/65">Launch pricing — early users get priority access.</p>
        <a
          href="#waitlist"
          className="button-glow mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
        >
          Join the waitlist
        </a>
      </div>
    </section>
  );
}

function Waitlist() {
  const [submitted, setSubmitted] = useState(false);
  const TALLY_EMBED_URL = "https://tally.so/r/w40MgA?hideTitle=1";

  useEffect(() => {
    const handleMessage = (event) => {
      const isTallySubmit =
        event.data === 'Tally.FormSubmitted' ||
        event.data?.type === 'Tally.FormSubmitted' ||
        event.data?.type === 'tally:form-submitted';
      if (isTallySubmit) {
        setSubmitted(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <section className="py-12" id="waitlist">
      <div className="glass-card rounded-3xl p-8 soft-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-white/50">Get notified</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white">Join the waitlist</h2>
            <p className="mt-2 text-white/60">No spam. Cancel anytime. Early access invites sent in batches.</p>
          </div>
          <div className="text-sm text-green-300 min-h-[1.5rem] flex items-center">
            {submitted && "You're on the list 🎉"}
          </div>
        </div>
        <div className="mt-6">
          <WaitlistEmbed tallyUrl={TALLY_EMBED_URL} />
          <div className="mt-3 flex flex-col gap-1 text-xs text-white/60">
            <span>Early access invites sent in batches.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-auto flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="font-semibold text-white">PickMySet</div>
      <div className="flex gap-4">
        <a className="hover:text-white" href="#">Privacy</a>
        <a className="hover:text-white" href="#">Terms</a>
        <a className="hover:text-white" href="#">Contact</a>
      </div>
    </footer>
  );
}
