import { useEffect, useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
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
  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, trendsRes] = await Promise.all([
          api.get('analytics/'),
          api.get('analytics/sales_trends/')
        ]);
        setAnalytics(analyticsRes.data);
        setTrends(trendsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back to your pharmacy management system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
              <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Sales Performance</h3>
            <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg mb-4">Expiry Notifications</h3>
          <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
              <div className="mt-0.5 text-rose-600">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900">Paracetamol PARA-001</p>
                <p className="text-xs text-rose-700 mt-1">Expiring in 15 days. Action required!</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="mt-0.5 text-amber-600">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Amoxicillin AMOX-001</p>
                <p className="text-xs text-amber-700 mt-1">Expiring in 60 days. Monitor closely.</p>
              </div>
            </div>
          </div>
          <button className="mt-auto w-full py-3 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 rounded-xl transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
