// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import { ChatProvider } from './contexts/ChatContext'; // <-- Import ChatProvider
import ChatPage from './pages/ChatPage';

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage';
import ProfileSetup from './pages/ProfileSetup';
import DirectoryPage from './pages/DirectoryPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';

const App = () => {
  return (
    <AuthProvider>
      <PostsProvider>
        <ChatProvider> {/* <-- Wrap routes with ChatProvider */}
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                {/* Routes that use the main Layout (with side/bottom bars) */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/directory" element={<DirectoryPage />} />
                  <Route path="/profile/:username" element={<ProfilePage />} />
                  <Route path="/setup" element={<ProfileSetup />} />
                  <Route path="/post/:postId" element={<PostPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/:username" element={<ChatPage />} />
                </Route>
                
                {/* The Search page is a protected, full-screen route without the main layout */}
                <Route path="/search" element={<SearchPage />} />

              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ChatProvider>
      </PostsProvider>
    </AuthProvider>
  );
};

export default App;