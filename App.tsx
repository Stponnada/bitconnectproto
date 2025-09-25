import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import all your pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProfileSetup from './pages/ProfileSetup'; // Assuming you have this page too
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // Using a layout for consistent UI is good practice

const App = () => {
  return (
    // The AuthProvider wraps the entire app, making user data available everywhere
    <AuthProvider>
      <Router>
        <Routes>
          {/* ============================================= */}
          {/* PUBLIC ROUTES                                 */}
          {/* These routes can be accessed by anyone.     */}
          {/* ============================================= */}
          <Route path="/login" element={<Login />} />


          {/* ============================================= */}
          {/* PROTECTED ROUTES                              */}
          {/* These routes are protected by the             */}
          {/* ProtectedRoute component. If a user is not    */}
          {/* logged in, they will be redirected to /login. */}
          {/* ============================================= */}
          <Route element={<ProtectedRoute />}>
            {/* The Layout component can provide a consistent header, sidebar, etc. */}
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* This is the route you were missing for the edit profile page */}
                <Route path="/settings" element={<Settings />} />

                {/* You can also add other protected routes here */}
                <Route path="/profile-setup" element={<ProfileSetup />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;