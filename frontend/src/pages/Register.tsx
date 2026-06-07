import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div id="auth-page-root" className="register-page-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <Pill size={28} />
          </div>
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join PharmaSync to manage your inventory</p>
        </div>

        {error && (
          <div className="register-error">
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

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Pick a username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email (Optional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="form-input"
                style={{ paddingRight: '3rem' }}
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{' '}
          <Link to="/login" className="login-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
