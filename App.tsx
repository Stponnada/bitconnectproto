// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// --- THIS IS THE CORRECTED IMPORT BLOCK ---
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
// ------------------------------------------
import { PostsProvider } from './contexts/PostsContext';
import { ChatProvider } from './contexts/ChatContext';

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage';
import ProfileSetup from './pages/ProfileSetup';
import DirectoryPage from './pages/DirectoryPage';
import MentionsPage from './pages/MentionsPage';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import Spinner from './components/Spinner';

/**
 * This component consumes the AuthContext and contains all the routing logic.
 * It will only render after the AuthProvider has a value.
 */
const AppRoutes = () => {
  const { user, profile, isLoading } = useAuth();

  // 1. Show a full-screen loader while the initial session and profile are being fetched.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // 2. If loading is done and there's no user, show only the login page.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Redirect any other path to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. If there IS a user, but their profile is not complete, show only the setup page.
  if (user && !profile?.profile_complete) {
     return (
        <Routes>
            <Route path="/setup" element={<ProfileSetup />} />
            {/* Redirect any other path to /setup */}
            <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
     )
  }

  // 4. If the user is logged in AND their profile is complete, show the main app.
  return (
    <Routes>
      {/* Routes that use the main Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/mentions" element={<MentionsPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:username" element={<ChatPage />} />
      </Route>

      {/* Standalone protected routes */}
      <Route path="/search" element={<SearchPage />} />

      {/* Redirect login/setup to home if user is already fully authenticated */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PostsProvider>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
        </PostsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;