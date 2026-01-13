import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import useHashScroll from '../hooks/useHashScroll';

const steps = [
  {
    title: 'Build your song library',
    copy: 'Store lyrics, backing tracks, and originals in one place.'
  },
  {
    title: 'Create a client link',
    copy: 'Send a private link to collect a custom setlist before the gig.'
  },
  {
    title: 'Approve the final order',
    copy: 'See their request and lock the perfect flow for the event.'
  },
];

const benefits = [
  {
    label: 'For performers',
    items: ['Less back-and-forth', 'Better prep', 'Clear expectations'],
  },
  {
    label: 'For clients',
    items: ['Curated options', 'Confidence in the set', 'Fast turnaround'],
  },
];

function Hero() {
  return (
    <section className="grid gap-10 py-10 lg:grid-cols-2 lg:items-center" id="top">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 soft-border">
            Client-ready setlists
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brandPurple to-brandPink shadow-soft" />
          </p>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Organized prep
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Turn client requests into polished setlists.
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            PickMySet helps performers build a song library, share a private link, and collect client setlists before the show.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="/signup"
            className="button-glow flex items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            Start free trial
          </a>
          <a
            href="#how"
            className="flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
          >
            See how it works
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Song library</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Client links</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Setlist flow</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/70 sm:max-w-md">
          <Stat label="Saved prep time" value="-3 hrs" />
          <Stat label="Request clarity" value="+58%" />
          <Stat label="Client confidence" value="+41%" />
          <Stat label="Setlist revisions" value="-2" />
        </div>
        <p className="text-xs text-white/50">Example results from recent events</p>
      </div>

      <div className="relative">
        <div className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-gradient-to-r from-brandPurple to-brandPink opacity-60 blur-[60px]" />
        <ClientRequestPreview />
      </div>
    </section>
  );
}

export default function Home() {
  useHashScroll();
  return (
    <>
      <SEO />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Pricing />
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
          <h2 className="text-2xl font-bold">Three steps from inbox to stage</h2>
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
          <h2 className="text-2xl font-bold">Benefits on both sides of the booking</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {benefits.map((benefit) => (
          <div key={benefit.label} className="glass-card rounded-2xl p-6 soft-border">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{benefit.label}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {benefit.label === 'For performers' ? 'Stay in control' : 'Feel heard'}
            </h3>
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
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pricing</p>
          <h2 className="text-3xl font-extrabold">Plans for every kind of gig</h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-brandPink/40 bg-brandPink/10 px-4 py-2 text-xs font-semibold text-white">
            30-day free trial – no card required
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <PricingCard
            name="Starter"
            price="£9.99"
            label="Recommended"
            description="Everything you need to build setlists and run gigs."
            features={[
              "Song library",
              "Unlimited songs",
              "Setlists",
              "Client request links",
              "Live gig mode (online)",
              "Lyrics view",
              "Backing track links (Spotify / YouTube / direct URL)",
              "CSV import",
            ]}
            cta="Start free trial"
            highlight
          />
          <PricingCard
            name="Performer Pro"
            price="£19.99"
            label="Coming soon"
            description="Built for performers who need reliability anywhere."
            features={[
              "Everything in Starter",
              "Offline setlists (airplane mode)",
              "Download setlists to device",
              "Offline lyrics & notes",
              "Reliable gig mode without internet",
            ]}
            disabled
          />
          <PricingCard
            name="Pro Live"
            price="£49.99"
            label="Coming soon"
            description="Turn your gig into an interactive experience."
            features={[
              "Everything in Performer Pro",
              "Live audience song voting",
              "Audience tipping",
              "Real-time request ranking",
              "Branded audience page",
              "Performance & tip insights",
            ]}
            disabled
          />
        </div>
        <p className="text-center text-sm text-white/60">Cancel anytime. No contracts.</p>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  label,
  description,
  features,
  cta,
  highlight,
  disabled,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 text-left transition duration-300 ${
        highlight
          ? "border-brandPink/60 bg-white/10 shadow-soft"
          : "border-white/10 bg-white/5"
      } ${highlight ? "hover:-translate-y-1" : ""}`}
    >
      {highlight && (
        <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-soft">
          Recommended
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">{name}</p>
        <p className="text-3xl font-extrabold text-white">
          {price} <span className="text-sm font-semibold text-white/60">/ month</span>
        </p>
        <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${disabled ? "text-white/40" : "text-white/60"}`}>
          {label}
        </p>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-white/70">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-brandPurple to-brandPink" />
            <span>
              {feature}{" "}
              {feature.includes("Backing track") && (
                <span className="ml-1 inline-flex items-center gap-1 text-xs text-white/50">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px]">i</span>
                  <span>Links stay in your library</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {!disabled && (
        <button
          type="button"
          className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
            highlight
              ? "button-glow bg-gradient-to-r from-brandPurple to-brandPink text-white shadow-soft hover:opacity-95"
              : "border border-white/15 bg-white/5 text-white/70 hover:border-brandPink hover:text-white"
          }`}
        >
          {cta}
        </button>
      )}
    </div>
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

function ClientRequestPreview() {
  return (
    <div className="glass-card rounded-3xl p-6 soft-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Client request</p>
          <h3 className="text-lg font-semibold text-white">Jasmin & Andre Wedding</h3>
          <p className="text-xs text-white/60">April 12 · 18 songs selected</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Draft</span>
      </div>
      <div className="space-y-2">
        {[
          'First Dance',
          'Golden Hour',
          'City Lights',
          'Midnight Pulse',
          'Velvet Sky',
        ].map((song, idx) => (
          <div key={song} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            <span>{idx + 1}. {song}</span>
            <span className="text-xs text-white/50">Client pick</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="button-glow w-full rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
      >
        Generate link
      </button>
    </div>
  );
}
