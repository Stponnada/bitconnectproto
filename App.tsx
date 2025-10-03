// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
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
import UnauthenticatedRoute from './components/UnauthenticatedRoute'; // <-- NEW: Import the component

const App = () => {
  return (
    <AuthProvider>
      <PostsProvider>
        <Router>
          <Routes>
            {/* --- MODIFIED: Routes for users who are NOT logged in --- */}
            <Route element={<UnauthenticatedRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* --- Routes for users who ARE logged in --- */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/post/:postId" element={<PostPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:username" element={<ChatPage />} />   
              </Route>
              
              <Route path="/setup" element={<ProfileSetup />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} /> 
          </Routes>
        </Router>
      </PostsProvider>
    </AuthProvider>
  );
};

export default App;