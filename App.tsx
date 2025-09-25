import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import all your pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProfileSetup from './pages/ProfileSetup'; // Make sure this is imported
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* 
                  HERE IS THE FIX:
                  This is the line that was missing. It tells the router
                  to render the ProfileSetup component for the /setup path.
                */}
                <Route path="/setup" element={<ProfileSetup />} /> 

            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;