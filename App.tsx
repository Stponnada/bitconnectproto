// src/App.tsx (Corrected)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import pages and components
import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile'; // Import the new ProfilePage
import Settings from './pages/Settings';
import ProfileSetup from './pages/ProfileSetup';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              
              {/* THIS IS THE FIX: The route is now dynamic */}
              <Route path="/profile/:username" element={<ProfilePage />} />

              <Route path="/setup" element={<ProfileSetup />} />
              <Route path="/settings" element={<Settings />} /> {/* Kept for consistency */}
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} /> 
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;