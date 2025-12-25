import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUser, onAuthStateChange } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    getUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    unsubscribe = onAuthStateChange((_event, u) => {
      setUser(u);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Checking session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
