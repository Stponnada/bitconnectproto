import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const BITS_DOMAINS = [
  'hyderabad.bits-pilani.ac.in',
  'goa.bits-pilani.ac.in',
  'pilani.bits-pilani.ac.in',
  'dubai.bits-pilani.ac.in'
];

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const validateEmail = (email: string) => {
    const domain = email.split('@')[1];
    return BITS_DOMAINS.includes(domain);
  };
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }
        if (!validateEmail(email)) {
            throw new Error("Please use a valid BITS Pilani email address.");
        }

        // ============================ THE FIX IS HERE ============================
        // We now ONLY sign up the user and pass the username.
        // The database trigger will automatically create the profile.
        // The manual .insert() call has been removed.
        // =======================================================================
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { username: username } // This is perfect
          }
        });

        if (error) throw error;
        
        // After successful sign-up, the user is now automatically
        // sent to the profile setup page, just like you wanted.
        navigate('/setup');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || session) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-bits-red">BITS Connect</h1>
        <p className="text-gray-400 mt-2">The exclusive social network for BITSians.</p>
      </div>

      <div className="w-full max-w-md bg-dark-secondary p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder={isLogin ? "Email" : "BITS Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"
          />
          {!isLogin && (
             <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"
            />
          )}
          <button type="submit" disabled={loading} className="bg-bits-red text-white font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-red-700 disabled:bg-red-900">
            {loading ? <Spinner /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        {error && <p className="mt-4 text-red-400 text-center text-sm">{error}</p>}
        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-gray-400 hover:text-white">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;