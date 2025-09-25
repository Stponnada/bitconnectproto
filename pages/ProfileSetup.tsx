import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext'; // <--- IMPORT THE NEW HOOK
import Spinner from '../components/Spinner';

const ProfileSetup = () => {
  const { user } = useAuth(); // <--- 1. GET THE USER FROM THE CONTEXT.
  const navigate = useNavigate();

  // State for your setup form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // This check is optional but good practice. The ProtectedRoute should handle this,
  // but it ensures the page doesn't crash if something unexpected happens.
  useEffect(() => {
    if (!user) {
      console.error("ProfileSetup page loaded without a user. This shouldn't happen.");
      navigate('/login'); // Redirect to login if user is missing
    }
  }, [user, navigate]);

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // Safety check

    setLoading(true);
    setMessage('');
    try {
      // Assuming your 'profiles' table has 'id', 'username', and 'full_name' columns
      const { error } = await supabase.from('profiles').insert({
        id: user.id, // Link the profile to the authenticated user
        username: username,
        full_name: fullName,
        updated_at: new Date(),
      });

      if (error) {
        throw error;
      }

      setMessage('Profile created successfully! Redirecting...');
      // Redirect to the user's new profile page or home page after setup
      setTimeout(() => navigate('/profile'), 2000);

    } catch (error: any) {
      console.error('Error setting up profile:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render the form
  return (
    <div>
      <h2>Complete Your Profile</h2>
      <p>Set up your public username and name.</p>
      <form onSubmit={handleProfileSetup}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <Spinner /> : 'Save and Continue'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ProfileSetup;