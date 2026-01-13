import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SiteNav from "./components/SiteNav";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientRequest from "./pages/ClientRequest";
import PerformList from "./pages/PerformList";
import PerformGig from "./pages/PerformGig";
import PerformLive from "./pages/PerformLive";

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perform"
              element={
                <ProtectedRoute>
                  <PerformList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perform/:gigId"
              element={
                <ProtectedRoute>
                  <PerformGig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perform/live"
              element={
                <ProtectedRoute>
                  <PerformLive />
                </ProtectedRoute>
              }
            />
            <Route path="/c/:shareToken" element={<ClientRequest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
