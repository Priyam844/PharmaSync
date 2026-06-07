import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  Archive
} from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('analytics/reports/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const response = await api.get('analytics/download_detailed_report/', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pharmacy_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-medium">Generating advanced insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Deep dive into inventory movement, sales performance, and stock health.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fast Moving Items */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
              <TrendingUp className="text-emerald-500" size={20} />
              Top 10 Fast Moving Items
            </h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.fast_moving} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="batch__medicine__name" 
                  type="category" 
                  width={120} 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 600}}
                />
                <Tooltip 
                  cursor={{fill: '#1f2937'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
              <PieIcon className="text-indigo-500" size={20} />
              Stock by Category
            </h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.category_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {data?.category_distribution?.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dead Stock Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
              <Archive className="text-rose-500" size={20} />
              Dead Stock Alert (Last 60 Days)
            </h3>
            <span className="text-[10px] font-black bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg uppercase tracking-wider">High Priority</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="pb-4">Medicine</th>
                  <th className="pb-4">Manufacturer</th>
                  <th className="pb-4 text-right">Qty in Stock</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data?.dead_stock?.map((item: any, idx: number) => (
                  <tr key={idx} className="group">
                    <td className="py-4 font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</td>
                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{item.manufacturer}</td>
                    <td className="py-4 text-right font-black text-rose-600 dark:text-rose-400">{item.total_qty}</td>
                    <td className="py-4 text-right">
                      <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase">Return to Supplier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Stats Card */}
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none flex flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
           
           <div>
             <div className="flex items-center gap-2 mb-2 text-indigo-100 font-bold uppercase tracking-widest text-[10px]">
               <Activity size={14} /> Performance Summary
             </div>
             <h4 className="text-3xl font-black mb-1">Stock Health</h4>
             <p className="text-sm text-indigo-100 font-medium">Your pharmacy stock health is at <span className="text-white font-bold">84%</span> this month.</p>
           </div>

           <div className="space-y-4 mt-8">
             <div className="flex justify-between items-end border-b border-indigo-500/50 pb-4">
               <div>
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Sales Revenue</p>
                 <p className="text-xl font-black mt-1">₹{data?.fast_moving?.reduce((acc: number, item: any) => acc + parseFloat(item.revenue), 0).toFixed(2)}</p>
               </div>
               <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">+12.4%</div>
             </div>
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Efficiency Rating</p>
                 <p className="text-xl font-black mt-1">Excellent</p>
               </div>
               <BarChart3 size={32} className="opacity-40" />
             </div>
           </div>

           <button 
             onClick={handleDownloadReport}
             disabled={downloading}
             className="mt-8 w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {downloading ? (
               <>
                 <Loader2 size={16} className="animate-spin" />
                 Generating...
               </>
             ) : (
               'Download Detailed Report'
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
