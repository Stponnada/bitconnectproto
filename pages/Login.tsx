// src/pages/Login.tsx (Simplified)

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

// ... (Your BITS_DOMAINS constant) ...

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    // ... (Your handleAuth logic remains exactly the same) ...
  };

  // THE FIX: We now use the loading state from the context to decide.
  // If the context is loading, we show a spinner.
  // If loading is done and a user exists, we redirect to the homepage.
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen bg-dark"><Spinner /></div>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If loading is done and there's no user, we show the login form.
  return (
    // ... (Your Login page JSX remains exactly the same) ...
  );
};

export default Login;