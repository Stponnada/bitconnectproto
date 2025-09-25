import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import your pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // A layout component is good practice

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route: Anyone can see the login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes: Only logged-in users can see these */}
          <Route element={<ProtectedRoute />}>
            {/* You can wrap protected routes in a layout if you want */}
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                {/* Add other protected routes here */}
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;