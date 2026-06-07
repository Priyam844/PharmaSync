import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, trendsRes, expiryRes] = await Promise.all([
          api.get('analytics/'),
          api.get('analytics/sales_trends/'),
          api.get('batches/near_expiry/?days=30')
        ]);
        setAnalytics(analyticsRes.data);
        setTrends(trendsRes.data);
        setExpiryAlerts(expiryRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: 'Total Medicines', 
      value: analytics?.kpis?.total_medicines || '0', 
      icon: Package, 
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Total Revenue', 
      value: `₹${analytics?.kpis?.total_sales || '0'}`, 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      change: '+8.2%',
      trend: 'up'
    },
    { 
      label: 'Critical Expiry', 
      value: analytics?.expiry_alerts?.critical || '0', 
      icon: AlertCircle, 
      color: 'bg-rose-500',
      change: '-2',
      trend: 'down'
    },
    { 
      label: 'Total Stock', 
      value: analytics?.kpis?.total_stock || '0', 
      icon: Activity, 
      color: 'bg-amber-500',
      change: '+5%',
      trend: 'up'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back to your pharmacy management system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg dark:text-white">Sales Performance</h3>
            <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications / Near Expiry */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg dark:text-white">Expiry Notifications</h3>
            <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Next 30 Days</span>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2 flex-1">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-300" size={24} />
              </div>
            ) : expiryAlerts.length > 0 ? (
              expiryAlerts.map((alert: any) => (
                <div key={alert.id} className={`flex items-start gap-3 p-4 border rounded-xl transition-all hover:shadow-sm ${
                  alert.expiry_status === 'Critical' 
                    ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30' 
                    : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30'
                }`}>
                  <div className={`mt-0.5 ${alert.expiry_status === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${alert.expiry_status === 'Critical' ? 'text-rose-900 dark:text-rose-100' : 'text-amber-900 dark:text-amber-100'}`}>
                      {alert.medicine_name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1">BATCH: {alert.batch_number}</p>
                    <p className={`text-xs mt-1 font-medium ${alert.expiry_status === 'Critical' ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      {alert.days_to_expiry <= 0 ? 'Already expired!' : `Expiring in ${alert.days_to_expiry} days.`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-medium">No critical expiries in the next 30 days.</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/expiry')}
            className="mt-6 w-full py-3 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-900/30 border-dashed"
          >
            View Detailed Expiry Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
