import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SiteNav from "./components/SiteNav";
import SEO from "./components/SEO";

import Home from "./pages/Home";
import VotePage from "./pages/VoteDemo";
import PerformerPage from "./pages/PerformerDemo";
import Dashboard from "./pages/Dashboard";
import { createSession } from "./hooks/useSessionStore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

function BackgroundDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -left-24 -top-24 h-72 w-72 bg-brandPurple opacity-30 blur-[140px]" />
      <div className="absolute right-0 top-10 h-80 w-80 bg-brandPink opacity-20 blur-[140px]" />
      <div className="absolute left-1/3 top-1/2 h-72 w-72 bg-brandPurple opacity-20 blur-[120px]" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-midnight text-white relative overflow-hidden">
      <BackgroundDecor />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-16 sm:px-10">
        <SiteNav />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/vote/demo" element={<VoteRedirect />} />
            <Route path="/performer/demo" element={<PerformerRedirect />} />
            <Route path="/vote/:code" element={<VotePage />} />
            <Route path="/performer/:code" element={<PerformerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function VoteRedirect() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const code = createSession();
    navigate(`/vote/${code}`, { replace: true });
  }, [navigate]);
  return (
    <SEO
      title="Audience Voting Demo | PickMySet"
      description="Try the PickMySet audience voting demo — no app, no login, just vote."
      canonicalPath="/vote/demo"
    />
  );
}

function PerformerRedirect() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const code = createSession();
    navigate(`/performer/${code}`, { replace: true });
  }, [navigate]);
  return (
    <SEO
      title="Performer Screen Demo | PickMySet"
      description="Explore the PickMySet performer demo with live voting, setlists, lyrics, and backing tracks."
      canonicalPath="/performer/demo"
    />
  );
}
