import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`http://${window.location.hostname}:8000/api/auth/login/`, {
        username,
        password,
      });
      
      const { access, refresh, access_token, refresh_token, user } = res.data;
      
      const accessToken = access || access_token;
      const refreshToken = refresh || refresh_token;
      
      if (!accessToken) {
        throw new Error('Login failed: No access token received from server');
      }

      // If user object is missing in login response, we might need to fetch it
      let finalUser = user;
      if (!finalUser) {
        try {
          const userRes = await axios.get(`http://${window.location.hostname}:8000/api/auth/user/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          finalUser = userRes.data;
        } catch (uErr) {
          console.warn('Could not fetch user profile after login', uErr);
          finalUser = { username }; // Fallback
        }
      }

      login(accessToken, refreshToken || '', finalUser);
      navigate('/');
    } catch (err: any) {
      console.error('Login Error:', err);
      const data = err.response?.data;
      const message = 
        data?.non_field_errors?.[0] || 
        data?.detail || 
        data?.error || 
        (typeof data === 'string' ? data : null) ||
        'Invalid credentials or server error';
      setError(message);
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
          <h1 className="text-2xl font-bold text-gray-900 text-center">Login to PharmaSync</h1>
          <p className="text-gray-500 mt-1">Enter your credentials to access the system</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
