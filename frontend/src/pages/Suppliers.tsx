import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Loader2,
  Trash2,
  PackagePlus,
  ExternalLink,
  History,
  Calendar,
  ArrowRight,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('suppliers/');
      setSuppliers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await api.get(`suppliers/${supplier.id}/purchase_history/?${params.toString()}`);
      setPurchaseHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isHistoryModalOpen && selectedSupplier) {
      fetchHistory(selectedSupplier);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('suppliers/', formData);
      setIsModalOpen(false);
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      alert('Failed to add supplier.');
    } finally {
      setLoading(false);
    }
  };

  const reAddStock = (supplierId: number) => {
    navigate('/purchases', { state: { preSelectedSupplierId: supplierId } });
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage medicine distributors and re-stock inventory.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={20} />
          Add New Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none relative flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by supplier name or contact person..."
            className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none hover:shadow-md transition-all space-y-4 flex flex-col group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{supplier.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">{supplier.contact_person}</p>
                </div>
              </div>
              <button 
                onClick={() => fetchHistory(supplier)}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                title="Purchase History"
              >
                <History size={20} />
              </button>
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500">
                  <Phone size={14} />
                </div>
                <span className="font-bold">{supplier.phone}</span>
              </div>
              {supplier.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500">
                    <Mail size={14} />
                  </div>
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500">
                    <MapPin size={14} />
                  </div>
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
               <button 
                 onClick={() => reAddStock(supplier.id)}
                 className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
               >
                 <PackagePlus size={14} /> Re-Add Stock
               </button>
               <button 
                 onClick={() => fetchHistory(supplier)}
                 className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
               >
                 <History size={14} /> History
               </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Supplier">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Supplier Company Name</label>
            <input 
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
              placeholder="e.g. Medico Pharma Distributors"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
            <input 
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
              placeholder="e.g. John Doe"
              value={formData.contact_person}
              onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input 
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                type="email"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                placeholder="e.g. contact@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Office Address</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
              placeholder="Full address of the distributor"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Supplier'}
          </button>
        </form>
      </Modal>

      {/* Supplier History Modal */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title={`${selectedSupplier?.name} - Supply History`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Total Procurement</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                ₹{purchaseHistory.reduce((acc, p) => acc + parseFloat(p.total_amount), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Purchase Orders</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{purchaseHistory.length}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Filter by Period</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                <input 
                  type="date" 
                  className="bg-transparent border-none text-[11px] font-bold focus:ring-0 outline-none w-full dark:text-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
              <div className="flex flex-1 items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                <input 
                  type="date" 
                  className="bg-transparent border-none text-[11px] font-bold focus:ring-0 outline-none w-full dark:text-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {setStartDate(''); setEndDate('');}}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest px-2"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Procurement Timeline</h4>
            
            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mb-2" size={24} />
                <p className="text-xs font-medium">Loading history...</p>
              </div>
            ) : purchaseHistory.length > 0 ? (
              purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm dark:shadow-none hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group/purchase">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white group-hover/purchase:text-indigo-600 dark:group-hover/purchase:text-indigo-400 transition-colors">Ref: {purchase.reference_no || `#${purchase.id}`}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{new Date(purchase.purchase_date).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">₹{parseFloat(purchase.total_amount).toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-1 mt-3">
                    {purchase.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] py-1.5 border-t border-gray-50 dark:border-gray-800 first:border-none">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{item.medicine_name}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-gray-500 dark:text-gray-400">₹{(item.quantity * item.cost_price).toFixed(2)}</p>
                           <p className="text-[9px] text-gray-400 dark:text-gray-500">Batch: {item.batch_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <Truck size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No history found</p>
                <p className="text-[10px] mt-1">Try adjusting the date range.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsHistoryModalOpen(false)}
            className="w-full bg-gray-900 dark:bg-gray-800 text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 dark:hover:bg-gray-700 transition-all shadow-lg dark:shadow-none"
          >
            Close History
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
