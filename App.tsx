// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// --- REMOVED: useEffect ---
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { PostsProvider } from './contexts/PostsContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage';
import ProfileSetup from './pages/ProfileSetup';
import DirectoryPage from './pages/DirectoryPage';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import Spinner from './components/Spinner';
import CampusPage from './pages/CampusPage';
import CampusDirectoryPage from './pages/CampusDirectoryPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LostAndFoundPage from './pages/LostAndFoundPage';
import MarketplacePage from './pages/MarketplacePage';
import SellerProfilePage from './pages/SellerProfilePage';

const AppRoutes = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user && !profile?.profile_complete) {
     return (
        <Routes>
            <Route path="/setup" element={<ProfileSetup />} />
            <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
     )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/campus/reviews" element={<CampusDirectoryPage />} />
        <Route path="/campus/reviews/:placeId" element={<PlaceDetailPage />} />
        <Route path="/campus/lost-and-found" element={<LostAndFoundPage />} />
        <Route path="/campus/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/seller/:username" element={<SellerProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:username" element={<ChatPage />} />
      </Route>

      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // --- REMOVED: Service worker registration useEffect ---

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PostsProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </PostsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;