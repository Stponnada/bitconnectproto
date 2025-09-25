import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const ProfileSetup: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        campus: '',
        admission_year: '',
        branch: '',
        relationship_status: '',
        dorm_building: '',
        dorm_room: '',
        dining_hall: '',
        bio: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('User not found. Please log in again.');
            return;
        }
        setLoading(true);
        setError(null);

        const updates = {
            id: user.id,
            ...formData,
            admission_year: parseInt(formData.admission_year, 10),
            profile_complete: true,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            setError(error.message);
        } else {
            // Force a reload of the auth context state if possible, or just navigate
            // Navigating will trigger a profile refresh in the main app layout
            navigate(0); // Force refresh to get new profile state
        }
        setLoading(false);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const Input = ({ name, label, required = false, ...props }: any) => (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label} {required && '*'}</label>
        <input name={name} id={name} required={required} onChange={handleChange} value={formData[name as keyof typeof formData]} {...props} className="w-full p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red" />
      </div>
    );

    const Select = ({ name, label, required = false, children }: any) => (
       <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label} {required && '*'}</label>
        <select name={name} id={name} required={required} onChange={handleChange} value={formData[name as keyof typeof formData]} className="w-full p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red">
          {children}
        </select>
      </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-dark p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-bits-red">Almost there!</h1>
                    <p className="text-gray-400 mt-2">Let's set up your profile so others can find you.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-dark-secondary p-8 rounded-lg shadow-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3"><Input name="full_name" label="Full Name" required /></div>
                        <Select name="campus" label="Campus" required>
                            <option value="">Select Campus</option>
                            <option value="Pilani">Pilani</option>
                            <option value="Goa">Goa</option>
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Dubai">Dubai</option>
                        </Select>
                        <Select name="admission_year" label="Admission Year" required>
                           <option value="">Select Year</option>
                           {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                         <Select name="branch" label="Branch">
                           <option value="">Select Branch</option>
                           <option value="Computer Science">Computer Science</option>
                           <option value="Electronics & Communication">Electronics & Communication</option>
                           <option value="Electrical & Electronics">Electrical & Electronics</option>
                           <option value="Mechanical">Mechanical</option>
                           <option value="Chemical">Chemical</option>
                           <option value="Civil">Civil</option>
                           <option value="Manufacturing">Manufacturing</option>
                           <option value="Economics">Economics</option>
                           <option value="Mathematics">Mathematics</option>
                           <option value="Physics">Physics</option>
                           <option value="Chemistry">Chemistry</option>
                           <option value="Biology">Biology</option>
                        </Select>
                    </div>
                     <Select name="relationship_status" label="Relationship Status">
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="In a relationship">In a relationship</option>
                        <option value="It's complicated">It's complicated</option>
                    </Select>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input name="dorm_building" label="Dorm Building" placeholder="e.g. Ram Bhawan" />
                        <Input name="dorm_room" label="Dorm Room" placeholder="e.g. 101" />
                        <Input name="dining_hall" label="Dining Hall" placeholder="e.g. Mess 1" />
                    </div>
                     <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea name="bio" id="bio" onChange={handleChange} value={formData.bio} rows={3} placeholder="Tell us a little about yourself..." className="w-full p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"></textarea>
                    </div>
                    
                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                    
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-bits-red text-white font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-red-700 disabled:bg-red-900">
                            {loading ? <Spinner /> : 'Save Profile & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;