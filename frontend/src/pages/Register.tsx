import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError({ detail: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`http://${window.location.hostname}:8000/api/auth/registration/`, {
        username: formData.username,
        email: formData.email,
        password1: formData.password,
        password2: formData.confirm_password,
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Registration Error:', err.response?.data);
      setError(err.response?.data || { detail: 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
            <Pill size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">Create Account</h1>
          <p className="text-gray-500 mt-1">Join PharmaSync to manage your inventory</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle size={18} />
            <div>
              {typeof error === 'string' ? error : (
                error.detail || 
                (error.username && `Username: ${error.username[0]}`) || 
                (error.email && `Email: ${error.email[0]}`) || 
                (error.password1 && `Password: ${error.password1[0]}`) ||
                (error.password2 && `Confirm Password: ${error.password2[0]}`) ||
                (error.non_field_errors && error.non_field_errors[0]) ||
                'Registration error'
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="Pick a username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
