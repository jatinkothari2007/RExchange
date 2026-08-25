import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { KarmaAnimationProvider } from './context/KarmaAnimationContext';
import { LandingPage } from './pages/LandingPage';
import { FeedPage } from './pages/FeedPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { NeedsBoardPage } from './pages/NeedsBoardPage';
import { MyExchangesPage } from './pages/MyExchangesPage';
import { ChatPage } from './pages/ChatPage';
import { ImpactDashboardPage } from './pages/ImpactDashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <KarmaAnimationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Core Campus App Screens */}
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/needs" element={<NeedsBoardPage />} />
            <Route path="/impact" element={<ImpactDashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Authenticated Actions */}
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateListingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exchanges"
              element={
                <ProtectedRoute>
                  <MyExchangesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exchanges/:id"
              element={
                <ProtectedRoute>
                  <MyExchangesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exchanges/:id/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </KarmaAnimationProvider>
  );
};

export default App;
