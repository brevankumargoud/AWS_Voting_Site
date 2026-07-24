import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useVotingSession } from './hooks/useVotingSession';

import { Landing } from './pages/Landing';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreateVoting } from './pages/CreateVoting';
import { Voting } from './pages/Voting';
import { Results } from './pages/Results';

export function App() {
  const { activeSession } = useVotingSession();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <ToastProvider />
          <Navbar activeSession={activeSession} />

          <main className="flex-1">
            <Routes>
              {/* Landing / Role Selector */}
              <Route path="/" element={<Landing />} />

              {/* Voter Flow */}
              <Route path="/voter" element={<Voting />} />

              {/* Admin Authentication */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/create-voting"
                element={
                  <ProtectedRoute>
                    <CreateVoting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
