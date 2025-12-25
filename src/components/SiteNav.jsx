import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getUser, onAuthStateChange, signOut } from "../lib/auth";

const links = [
  { to: '/', label: 'Home' },
  { to: '/vote/demo', label: 'Audience Demo' },
  { to: '/performer/demo', label: 'Performer Demo' },
];

const linkClasses = ({ isActive }) =>
  `text-sm font-semibold transition ${
    isActive ? 'text-white' : 'text-white/70 hover:text-white'
  }`;

export default function SiteNav() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsub;
    getUser().then((u) => setUser(u)).catch(() => setUser(null));
    unsub = onAuthStateChange((_evt, u) => setUser(u));
    return () => unsub && unsub();
  }, []);

  return (
    <header className="flex items-center justify-between py-6">
      <Link to="/" className="text-xl font-semibold tracking-tight">
        PickMy<span className="gradient-text">Set</span>
      </Link>
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/#waitlist"
            className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            Join the waitlist
          </Link>
        )}
      </div>
    </header>
  );
}
