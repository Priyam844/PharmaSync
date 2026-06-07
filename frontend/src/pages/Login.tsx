import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div id="auth-page-root" className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Pill size={28} />
          </div>
          <h1 className="login-title">Login to PharmaSync</h1>
          <p className="login-subtitle">Enter your credentials to access the system</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-container">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="form-input"
                style={{ paddingRight: '3rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{' '}
          <Link to="/register" className="register-link">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
