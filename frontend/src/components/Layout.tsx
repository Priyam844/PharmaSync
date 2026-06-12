import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  History,
  Package,
  Users,
  BarChart3, 
  LogOut,
  AlertTriangle,
  RotateCcw,
  Truck,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarContentProps {
  location: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/inventory', icon: Pill, label: 'Inventory' },
  { path: '/billing', icon: ShoppingCart, label: 'Billing' },
  { path: '/sales-history', icon: History, label: 'Sales History' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/purchases', icon: Package, label: 'Stock-In' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/expiry', icon: AlertTriangle, label: 'Expiry Alerts' },
  { path: '/returns', icon: RotateCcw, label: 'Returns' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  location, 
  theme, 
  toggleTheme, 
  setIsMobileMenuOpen, 
  handleLogout 
}) => (
  <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <div className="p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white p-1.5">
          <Logo className="w-full h-full" />
        </div>
        <span className="font-bold text-xl tracking-tight dark:text-white">PharmaSync</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button 
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
    </div>

    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>

    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
      >
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0">
        <SidebarContent 
          location={location}
          theme={theme}
          toggleTheme={toggleTheme}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`
        lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent 
          location={location}
          theme={theme}
          toggleTheme={toggleTheme}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center text-white p-1 shadow-sm">
              <Logo className="w-full h-full" />
            </div>
            <span className="font-bold text-lg dark:text-white">PharmaSync</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
