import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Filter,
  Package,
  Calendar,
  ChevronRight,
  Loader2,
  Clock,
  RefreshCcw,
  RotateCcw,
  CheckCircle,
  Info,
  Thermometer,
  ShieldCheck,
  Tag
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

const ExpiryAlerts = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysFilter, setDaysFilter] = useState('90');
  const [customDays, setCustomDays] = useState('45');
  
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  
  const [returnFormData, setReturnFormData] = useState({
    quantity: 0,
    reason: 'Expiring soon / Expired stock'
  });

  useEffect(() => {
    if (daysFilter !== 'custom') {
      fetchExpiryData();
    }
  }, [daysFilter]);

  const fetchExpiryData = async () => {
    const days = daysFilter === 'custom' ? customDays : daysFilter;
    setLoading(true);
    try {
      const res = await api.get(`batches/near_expiry/?days=${days}`);
      setBatches(res.data);
    } catch (err) {
      console.error('Error fetching expiry data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetailModal = (batch: any) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  const openReturnModal = (batch: any) => {
    setSelectedBatch(batch);
    setReturnFormData({
      quantity: batch.quantity,
      reason: 'Expiring soon / Expired stock'
    });
    setIsReturnModalOpen(true);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    setProcessingReturn(true);
    try {
      await api.post('returns/', {
        batch: selectedBatch.id,
        return_type: 'PURCHASE_RETURN',
        quantity: returnFormData.quantity,
        reason: returnFormData.reason
      });
      alert('Stock marked for return to supplier successfully.');
      setIsReturnModalOpen(false);
      fetchExpiryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process return');
    } finally {
      setProcessingReturn(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Expired':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Critical':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expiry Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor and manage medicines approaching expiration.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Filter:</label>
          <div className="flex items-center gap-2">
            <select 
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            >
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
              <option value="180">Next 6 Months</option>
              <option value="custom">Custom Days</option>
            </select>
            {daysFilter === 'custom' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
                <input 
                  type="number"
                  min="1"
                  className="w-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Days"
                />
                <button 
                  onClick={fetchExpiryData}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  title="Apply Filter"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by medicine or batch number..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium">Analyzing stock for expiry dates...</p>
        </div>
      ) : filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <div 
              key={batch.id} 
              className={`bg-white dark:bg-gray-900 rounded-3xl border-2 transition-all p-6 group hover:shadow-xl dark:hover:shadow-none ${
                batch.expiry_status === 'Critical' ? 'border-rose-100 dark:border-rose-900/30' : 
                batch.expiry_status === 'Warning' ? 'border-amber-100 dark:border-amber-900/30' : 'border-gray-50 dark:border-gray-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${
                  batch.expiry_status === 'Critical' ? 'bg-rose-500 text-white' : 
                  batch.expiry_status === 'Warning' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  <AlertCircle size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyles(batch.expiry_status)}`}>
                  {batch.expiry_status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {batch.medicine_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">BATCH: {batch.batch_number}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Expires In</span>
                  </div>
                  <span className={`text-sm font-black ${
                    batch.days_to_expiry <= 30 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {batch.days_to_expiry} Days
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Calendar size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Expiry Date</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(batch.expiry_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Package size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Current Stock</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {batch.quantity} Units
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => openReturnModal(batch)}
                  className="flex-1 bg-gray-900 dark:bg-gray-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-700 transition-all"
                >
                  Mark for Return
                </button>
                <button 
                  onClick={() => openDetailModal(batch)}
                  className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  View Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm dark:shadow-none">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Excellent! No Near-Expiry Stock</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">All your medicines have a healthy shelf life based on the selected filter.</p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Batch Details: ${selectedBatch?.medicine_name}`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
             <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-none text-indigo-600 dark:text-indigo-400">
                <Tag size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Batch Number</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{selectedBatch?.batch_number}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <Calendar size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Mfg Date</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{selectedBatch?.manufacturing_date || 'N/A'}</p>
            </div>
            <div className="p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Expiry Date</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{selectedBatch?.expiry_date}</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center gap-3">
                   <Thermometer size={18} className="text-gray-400 dark:text-gray-500" />
                   <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Storage Condition</span>
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white">{selectedBatch?.storage_condition || 'Normal'}</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center gap-3">
                   <ShieldCheck size={18} className="text-gray-400 dark:text-gray-500" />
                   <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Status</span>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusStyles(selectedBatch?.expiry_status)}`}>
                   {selectedBatch?.expiry_status}
                </span>
             </div>
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center gap-3">
                   <Package size={18} className="text-gray-400 dark:text-gray-500" />
                   <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Available Quantity</span>
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedBatch?.quantity} Units</span>
             </div>
          </div>

          <button 
            onClick={() => setIsDetailModalOpen(false)}
            className="w-full bg-gray-900 dark:bg-gray-800 text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 dark:hover:bg-gray-700 transition-all"
          >
            Close Details
          </button>
        </div>
      </Modal>

      {/* Mark for Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Return to Supplier"
      >
        <form onSubmit={handleProcessReturn} className="space-y-6">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
             <AlertCircle className="text-rose-600 shrink-0" size={20} />
             <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-300">Purchase Return Process</p>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                  You are marking <strong>{selectedBatch?.medicine_name}</strong> (Batch: {selectedBatch?.batch_number}) for return. This will decrease your inventory stock.
                </p>
             </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Quantity to Return</label>
            <div className="relative">
               <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="number"
                 max={selectedBatch?.quantity}
                 min="1"
                 required
                 className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-bold text-gray-900 dark:text-white"
                 value={returnFormData.quantity}
                 onChange={(e) => setReturnFormData({...returnFormData, quantity: parseInt(e.target.value)})}
               />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 ml-1">Max available: {selectedBatch?.quantity} units</p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Reason for Return</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium text-gray-900 dark:text-white"
              placeholder="e.g. Expired stock return to distributor"
              value={returnFormData.reason}
              onChange={(e) => setReturnFormData({...returnFormData, reason: e.target.value})}
            />
          </div>

          <div className="flex gap-4">
             <button 
               type="button"
               onClick={() => setIsReturnModalOpen(false)}
               className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
             >
               Cancel
             </button>
             <button 
               type="submit"
               disabled={processingReturn}
               className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
             >
               {processingReturn ? <Loader2 className="animate-spin" size={20} /> : <RotateCcw size={20} />}
               Process Return
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpiryAlerts;
