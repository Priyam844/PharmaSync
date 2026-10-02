import React from 'react';

import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Users,
  ShoppingCart,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Logo from '../components/Logo';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track all medicines, batches, and quantities with real-time updates and expiry monitoring.'
    },
    {
      icon: ShoppingCart,
      title: 'Billing & Sales',
      description: 'Process transactions quickly with barcode scanning and automatic invoice generation.'
    },
    {
      icon: AlertCircle,
      title: 'Expiry Alerts',
      description: 'Get proactive notifications for expiring medicines and automated reordering suggestions.'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain customer records and track purchase history for better service.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Generate comprehensive reports and insights for informed business decisions.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with automatic backups and data protection.'
    }
  ];

  const benefits = [
    { icon: CheckCircle, text: 'Reduce medication expiry waste by up to 40%' },
    { icon: CheckCircle, text: 'Streamline pharmacy operations with automation' },
    { icon: CheckCircle, text: 'Improve customer satisfaction with faster service' },
    { icon: CheckCircle, text: 'Make data-driven decisions with real-time insights' }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Pharmacies' },
    { value: '50M+', label: 'Transactions Processed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 lg:py-32 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white p-2 shadow-lg">
              <Logo size={28} className="w-full h-full" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              PharmaSync
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            The complete pharmacy management solution designed for modern healthcare facilities
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl border-2 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              All-in-One Pharmacy Solution
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Streamline your pharmacy operations with our comprehensive management system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                    <Icon size={28} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-6 group-hover:scale-105 transition-all duration-300">
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 bg-indigo-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose PharmaSync?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We've designed PharmaSync to address the unique challenges faced by pharmacy professionals, helping you run your pharmacy more efficiently and effectively.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative group">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 group-hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Clock size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Quick Setup</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get started in minutes</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between group/item">
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">Import existing inventory</span>
                    <span className="text-emerald-600 font-bold group-hover/item:scale-125 transition-transform inline-block">✓</span>
                  </div>
                  <div className="flex items-center justify-between group/item">
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">Customize workflows</span>
                    <span className="text-emerald-600 font-bold group-hover/item:scale-125 transition-transform inline-block">✓</span>
                  </div>
                  <div className="flex items-center justify-between group/item">
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">Train staff</span>
                    <span className="text-emerald-600 font-bold group-hover/item:scale-125 transition-transform inline-block">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 rounded-3xl p-12 text-white shadow-2xl group hover:shadow-indigo-500/25 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:scale-105 transition-transform inline-block">
              Ready to Transform Your Pharmacy?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of pharmacies already using PharmaSync to streamline their operations and improve patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:shadow-white/25 flex items-center justify-center gap-2 group/button"
              >
                Get Started Free
                <ArrowRight size={20} className="group-hover/button:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-all duration-200 border border-indigo-500 flex items-center justify-center gap-2 group/button"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white p-1.5">
                <Logo size={20} className="w-full h-full" />
              </div>
              <span className="font-bold text-xl">PharmaSync</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 PharmaSync. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;