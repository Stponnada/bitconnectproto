// src/App.tsx (Updated)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext'; // <-- 1. IMPORT THE NEW PROVIDER

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage';
import ProfileSetup from './pages/ProfileSetup';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App = () => {
  return (
    <AuthProvider>
      <PostsProvider> {/* <-- 2. WRAP YOUR ROUTES WITH IT */}
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/setup" element={<ProfileSetup />} />
                <Route path="/post/:postId" element={<PostPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} /> 
          </Routes>
        </Router>
      </PostsProvider> {/* <-- 3. CLOSE THE WRAPPER */}
    </AuthProvider>
  );
};

export default App;