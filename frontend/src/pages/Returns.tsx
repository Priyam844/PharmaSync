import { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Loader2,
  Calendar,
  Package,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  User,
  Truck,
  History
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

const Returns = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [returns, setReturns] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    batch: '',
    return_type: 'SALES_RETURN',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    fetchReturns();
    fetchMedicines();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      return_type: activeTab === 'customer' ? 'SALES_RETURN' : 'PURCHASE_RETURN'
    }));
  }, [activeTab]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('returns/');
      setReturns(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get('medicines/');
      setMedicines(res.data);
    } catch (err) { console.error(err); }
  };

  const handleMedicineChange = (medicineId: string) => {
    const medicine = medicines.find(m => m.id.toString() === medicineId);
    setBatches(medicine?.batches || []);
    setFormData({ ...formData, batch: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('returns/', formData);
      setIsModalOpen(false);
      setFormData({ 
        batch: '', 
        return_type: activeTab === 'customer' ? 'SALES_RETURN' : 'PURCHASE_RETURN', 
        quantity: 1, 
        reason: '' 
      });
      fetchReturns();
      alert(`${activeTab === 'customer' ? 'Customer' : 'Supplier'} return recorded and stock adjusted`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record return');
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(r => {
    const matchesTab = activeTab === 'customer' ? r.return_type === 'SALES_RETURN' : r.return_type === 'PURCHASE_RETURN';
    const matchesSearch = r.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date Filtering
    let matchesDate = true;
    const returnDate = new Date(r.return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeFilter === 'today') {
      matchesDate = returnDate.toDateString() === today.toDateString();
    } else if (timeFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      matchesDate = returnDate >= sevenDaysAgo;
    } else if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      matchesDate = returnDate >= thirtyDaysAgo;
    } else if (timeFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = returnDate >= start && returnDate <= end;
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Return Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Handle customer returns and supplier stock-outs separately.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg dark:shadow-none ${
            activeTab === 'customer' 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
          } text-white`}
        >
          <Plus size={20} />
          {activeTab === 'customer' ? 'New Customer Return' : 'New Supplier Return'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('customer')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'customer' 
              ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <User size={16} />
          Customer Returns
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'supplier' 
              ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm dark:shadow-none' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Truck size={16} />
          Supplier Returns
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab} returns...`}
            className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
              <input 
                type="date"
                className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold dark:text-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-400 font-bold">to</span>
              <input 
                type="date"
                className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold dark:text-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Medicine</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading returns...</td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <History size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-medium text-sm">No {activeTab} returns found for this period.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                        r.return_type === 'SALES_RETURN' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        <ArrowRightLeft size={12} />
                        {r.return_type === 'SALES_RETURN' ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{r.medicine_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Batch: {r.batch_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">{r.quantity}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                        {new Date(r.return_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 italic max-w-xs truncate">
                      "{r.reason}"
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={activeTab === 'customer' ? "Record Customer Return" : "Return Stock to Supplier"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            activeTab === 'customer' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30'
          }`}>
             {activeTab === 'customer' ? <User className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} /> : <Truck className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />}
             <div>
                <p className={`text-sm font-bold ${activeTab === 'customer' ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                  {activeTab === 'customer' ? 'Customer Return Process' : 'Supplier Return Process'}
                </p>
                <p className={`text-xs mt-1 ${activeTab === 'customer' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {activeTab === 'customer' 
                    ? 'Recording this will INCREASE your stock for the selected batch.' 
                    : 'Recording this will DECREASE your stock and mark it as returned to distributor.'}
                </p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Medicine</label>
              <select 
                required
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-bold text-gray-900 dark:text-white"
                onChange={(e) => handleMedicineChange(e.target.value)}
              >
                <option value="">Select Medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Select Batch</label>
              <select 
                required
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-bold text-gray-900 dark:text-white"
                value={formData.batch}
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} (Exp: {b.expiry_date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Quantity</label>
              <input 
                type="number"
                min="1"
                required
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-bold text-gray-900 dark:text-white"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-end">
              <div className={`p-4 rounded-2xl border w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'customer' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
              }`}>
                {activeTab === 'customer' ? <Plus size={16} /> : <RotateCcw size={16} />}
                {activeTab === 'customer' ? 'Increasing Stock' : 'Decreasing Stock'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Reason for Return</label>
            <textarea 
              required
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium text-gray-900 dark:text-white"
              placeholder={activeTab === 'customer' ? "e.g. Wrong medicine purchased" : "e.g. Expired / Damaged stock"}
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !formData.batch}
            className={`w-full text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg dark:shadow-none flex items-center justify-center gap-2 ${
               activeTab === 'customer' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (activeTab === 'customer' ? 'Complete Customer Return' : 'Complete Supplier Return')}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Returns;

