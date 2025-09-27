// src/App.tsx (Updated with the new PostPage route)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage'; // <-- 1. IMPORT THE NEW PAGE
import ProfileSetup from './pages/ProfileSetup';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/setup" element={<ProfileSetup />} />
              
              {/* 2. ADD THE NEW DYNAMIC ROUTE FOR SINGLE POSTS */}
              <Route path="/post/:postId" element={<PostPage />} />

            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} /> 
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;