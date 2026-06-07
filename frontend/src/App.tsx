import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import SalesHistory from './pages/SalesHistory';
import ExpiryAlerts from './pages/ExpiryAlerts';
import Returns from './pages/Returns';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><Layout><Inventory /></Layout></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />
            <Route path="/sales-history" element={<PrivateRoute><Layout><SalesHistory /></Layout></PrivateRoute>} />
            <Route path="/purchases" element={<PrivateRoute><Layout><Purchases /></Layout></PrivateRoute>} />
            <Route path="/suppliers" element={<PrivateRoute><Layout><Suppliers /></Layout></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><Layout><Customers /></Layout></PrivateRoute>} />
            <Route path="/expiry" element={<PrivateRoute><Layout><ExpiryAlerts /></Layout></PrivateRoute>} />
            <Route path="/returns" element={<PrivateRoute><Layout><Returns /></Layout></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
