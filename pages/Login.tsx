import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../components/icons';
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
  const [typedText, setTypedText] = useState('');
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /*
  const idleImageUrl =
    'https://phnrjmvfowtptnonftcs.supabase.co/storage/v1/object/public/assets/Screenshot%202025-09-27%20at%2010.57.42%20PM.png';
  const activeImageUrl =
    'https://phnrjmvfowtptnonftcs.supabase.co/storage/v1/object/public/assets/Screenshot%202025-09-27%20at%2010.41.01%20PM.png';

  const [activeImage, setActiveImage] = useState<string>(idleImageUrl);
*/

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Typewriter effect for tagline
  useEffect(() => {
    const fullText = 'The exclusive social network for BITSians.';
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

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
      } else {
        if (/\s/.test(username)) throw new Error('Username cannot contain spaces.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        if (!validateEmail(email)) throw new Error('Please use a valid BITS Pilani email address.');

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Sign up successful, but no user data returned.');

        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          username: username.trim(),
          email: data.user.email
        });
        if (profileError) throw profileError;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || session) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-primary-light dark:bg-primary p-4 overflow-hidden">

      {/* === Animated Tech Circuit Background === */}
      {/* Light mode: faster, brighter */}
      {theme === 'light' ? (
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(0,255,100,0.7)_0%,transparent_70%),radial-gradient(circle_at_85%_75%,rgba(0,255,150,0.15)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_0%,rgba(0,255,100,0.17)_10%,transparent_20%,rgba(0,255,150,0.22)_30%,transparent_40%,rgba(0,255,100,0.25)_50%,transparent_60%)]
                          bg-[length:400%_400%] animate-[circuitFlowSmooth_18s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(310deg,transparent_0%,rgba(0,255,180,0.7)_10%,transparent_20%,rgba(0,255,100,0.2)_30%,transparent_40%,rgba(0,255,180,0.18)_50%,transparent_60%)]
                          bg-[length:600%_600%] mix-blend-overlay animate-[circuitFlowSmooth_28s_ease-in-out_infinite_reverse]"></div>
        </div>
      ) : (
        /* Dark mode: smoother, calmer */
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(0,255,100,0.7)_0%,transparent_70%),radial-gradient(circle_at_85%_75%,rgba(0,255,150,0.15)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_0%,rgba(0,255,100,0.17)_10%,transparent_20%,rgba(0,255,150,0.22)_30%,transparent_40%,rgba(0,255,100,0.25)_50%,transparent_60%)]
                          bg-[length:400%_400%] animate-[circuitFlowSmooth_18s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(310deg,transparent_0%,rgba(0,255,180,0.7)_10%,transparent_20%,rgba(0,255,100,0.2)_30%,transparent_40%,rgba(0,255,180,0.18)_50%,transparent_60%)]
                          bg-[length:600%_600%] mix-blend-overlay animate-[circuitFlowSmooth_28s_ease-in-out_infinite_reverse]"></div>
        </div>
      )}

      {/* === Left Side: Mascot & Card === */}
  
      <div className="relative z-10 w-full max-w-md lg:w-1/2 flex flex-col items-center justify-center p-8">
       {/*  <img
          src={activeImage}
          alt="Mascot"
          className="w-48 h-48 mb-8 object-contain transition-transform duration-300 ease-in-out transform hover:scale-105"
        />*/}

        <div className="w-full bg-secondary-light dark:bg-secondary p-8 rounded-lg shadow-lg relative backdrop-blur-sm bg-opacity-90 dark:bg-opacity-80">
          <h2 className="text-2xl font-bold text-center text-text-main-light dark:text-text-main mb-6">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder={isLogin ? 'Email' : 'BITS Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
              //onFocus={() => setActiveImage(activeImageUrl)}
              //onBlur={() => setActiveImage(idleImageUrl)}
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
                //onFocus={() => setActiveImage(activeImageUrl)}
                //onBlur={() => setActiveImage(idleImageUrl)}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-green text-black font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50"
            >
              {loading ? <Spinner /> : isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          {error && <p className="mt-4 text-red-400 text-center text-sm">{error}</p>}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      </div>
      

      {/* === Right Side: Branding === */}
      <div className="relative z-10 w-full max-w-md lg:w-1/2 flex items-center justify-center p-8 order-first lg:order-last">
        <div className="text-center lg:text-left">
          <h1 className="text-8xl lg:text-8xl font-raleway font-black text-brand-green drop-shadow-[0_0_20px_rgba(0,255,150,0.3)]">
            litelelo.
          </h1>
          <p className="text-text-tertiary-light dark:text-text-tertiary mt-4 text-lg min-h-[28px]">
            {typedText}
            {typedText.length < 45 && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>

      {/* === Theme Toggle === */}
      <button
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        aria-label="Toggle theme"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary shadow-lg flex items-center justify-center text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
      >
        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default Login;