
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (user) {
    navigate('/');
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
        });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: username,
            full_name: fullName,
            email: data.user.email,
          });
          if (profileError) throw profileError;
          setMessage('Account created! Please check your email for a confirmation link.');
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-gray-100">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
        <h1 className="text-3xl font-bold mb-4 text-center text-green-400">BitsConnect</h1>
        <div className="flex border-b border-gray-700 mb-6">
          <button onClick={() => setIsLogin(true)} className={`w-1/2 py-3 text-center font-semibold ${isLogin ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}>
            Login
          </button>
          <button onClick={() => setIsLogin(false)} className={`w-1/2 py-3 text-center font-semibold ${!isLogin ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}>
            Sign Up
          </button>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" disabled={loading} className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors duration-200 disabled:bg-gray-500">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        {message && <p className="mt-4 text-green-400 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default Login;
