import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Placeholder components for other pages
const ExpiryAlerts = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Expiry Notifications</h1>
    <p className="text-gray-500">Monitor medicines near their expiry date.</p>
  </div>
);

const Returns = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Return Management</h1>
    <p className="text-gray-500">Handle returns and credit notes.</p>
  </div>
);

const Analytics = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
    <p className="text-gray-500">Deep dive into your pharmacy performance.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Layout><Inventory /></Layout></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />
          <Route path="/expiry" element={<PrivateRoute><Layout><ExpiryAlerts /></Layout></PrivateRoute>} />
          <Route path="/returns" element={<PrivateRoute><Layout><Returns /></Layout></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
