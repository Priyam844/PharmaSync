import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit,
  Camera,
  Barcode,
  Loader2,
  Package,
  IndianRupee,
  RefreshCcw,
  Info
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Scanner from '../components/Scanner';

const Inventory = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'ocr' | 'barcode' | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isAlternativesModalOpen, setIsAlternativesModalOpen] = useState(false);
  const [searchingFor, setSearchingFor] = useState<any>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    category: '',
    description: '',
    gst_percentage: 12.0,
    initial_mrp: 0,
    initial_stock: 0,
    batch_number: '',
    manufacturing_date: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('medicines/');
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const fetchAlternatives = async (medicine: any) => {
    setSearchingFor(medicine);
    setLoadingAlternatives(true);
    setIsAlternativesModalOpen(true);
    setAlternatives([]);
    try {
      const res = await api.get(`medicines/${medicine.id}/alternatives/`);
      setAlternatives(res.data);
    } catch (err) {
      console.error('Error fetching alternatives:', err);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['gst_percentage', 'initial_mrp', 'initial_stock'];
    
    if (numericFields.includes(name)) {
      // Allow empty string while typing, otherwise parse as number
      if (value === '') {
        setFormData({ ...formData, [name]: '' as any });
      } else {
        const val = parseFloat(value);
        if (!isNaN(val)) {
          setFormData({ ...formData, [name]: val });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openAddModal = () => {
    setEditingMedicine(null);
    setFormData({ 
      name: '', 
      generic_name: '', 
      manufacturer: '', 
      category: '', 
      description: '', 
      gst_percentage: 12.0,
      initial_mrp: 0,
      initial_stock: 0,
      batch_number: '',
      manufacturing_date: '',
      expiry_date: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (medicine: any) => {
    setEditingMedicine(medicine);
    const latestBatch = medicine.batches && medicine.batches.length > 0 
      ? [...medicine.batches].sort((a: any, b: any) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())[0]
      : null;

    setFormData({
      name: medicine.name,
      generic_name: medicine.generic_name || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || '',
      description: medicine.description || '',
      gst_percentage: medicine.gst_percentage || 12.0,
      initial_mrp: medicine.latest_mrp || 0,
      initial_stock: medicine.total_stock || 0,
      manufacturing_date: latestBatch?.manufacturing_date || '',
      expiry_date: latestBatch?.expiry_date || ''
    });
    setIsModalOpen(true);
  };

  const openBatchModal = (medicine: any) => {
    setSelectedMedicine(medicine);
    setIsBatchModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.initial_mrp <= 0) {
      alert('Selling Price (MRP) must be greater than 0');
      return;
    }
    if (formData.initial_stock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    setLoading(true);
    try {
      if (editingMedicine) {
        await api.put(`medicines/${editingMedicine.id}/`, formData);
      } else {
        await api.post('medicines/', formData);
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err: any) {
      console.error('Error saving medicine:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to save medicine';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async (batchId: number, batchNumber: string) => {
    if (window.confirm(`Are you sure you want to delete batch "${batchNumber}"? This action cannot be undone and will permanently remove this stock.`)) {
      try {
        await api.delete(`batches/${batchId}/`);
        // Refresh the selected medicine batches
        const res = await api.get(`medicines/${selectedMedicine.id}/`);
        setSelectedMedicine(res.data);
        fetchMedicines(); // Refresh main list
      } catch (err) {
        console.error('Error deleting batch:', err);
        alert('Failed to delete batch');
      }
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`DANGER: Are you sure you want to delete "${name}"? This will permanently remove the medicine and ALL its associated batches and stock history.`)) {
      try {
        await api.delete(`medicines/${id}/`);
        fetchMedicines();
      } catch (err) {
        console.error('Error deleting medicine:', err);
        alert('Failed to delete medicine');
      }
    }
  };

  const handleScanResult = (data: any) => {
    if (data.source === 'paddleocr') {
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        generic_name: data.generic_name || prev.generic_name,
        batch_number: data.batch_number || prev.batch_number,
        expiry_date: data.expiry_date || prev.expiry_date,
        initial_mrp: data.mrp || prev.initial_mrp
      }));
    } else if (data.rawText) {
      const lines = data.rawText.split('\n');
      if (lines.length > 0) {
        setFormData(prev => ({ ...prev, name: lines[0].trim() }));
      }
    }
    setScanMode(null);
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Add, edit, or remove medicines and update prices.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={20} />
          Add Medicine
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, generic, or manufacturer..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Generic Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price (MRP)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">GST %</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{med.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{med.manufacturer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{med.generic_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{parseFloat(med.latest_mrp).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`font-medium ${med.total_stock < 10 ? 'text-rose-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {med.total_stock} Units
                      </span>
                      <button 
                        onClick={() => openBatchModal(med)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-tight flex items-center gap-1"
                      >
                        <Package size={10} /> View Batches
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{med.gst_percentage}%</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => fetchAlternatives(med)}
                        title="Find Alternatives"
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                      >
                        <RefreshCcw size={18} />
                      </button>
                      <button 
                        onClick={() => openEditModal(med)}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isAlternativesModalOpen}
        onClose={() => setIsAlternativesModalOpen(false)}
        title={`Alternatives for ${searchingFor?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-1">
              <Info size={16} />
              About Alternatives
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Showing medicines with the same <strong>generic name</strong> ({searchingFor?.generic_name || 'N/A'}) or category that are currently in stock.
            </p>
          </div>

          {loadingAlternatives ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm font-medium">Searching for alternatives...</p>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3">
              {alternatives.map(alt => (
                <div key={alt.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm dark:shadow-none">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{alt.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alt.manufacturer}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">₹{parseFloat(alt.latest_mrp).toFixed(2)}</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-bold uppercase">{alt.total_stock} in stock</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openBatchModal(alt)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <RefreshCcw size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No alternatives found in stock.</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for other similar medicines manually.</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Batch Details: ${selectedMedicine?.name}`}
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">Batch No</th>
                  <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">Expiry</th>
                  <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">Stock</th>
                  <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">MRP</th>
                  <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {selectedMedicine?.batches?.map((batch: any) => (
                  <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{batch.batch_number}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(batch.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{batch.quantity}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">₹{parseFloat(batch.mrp).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        batch.expiry_status === 'Critical' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                        batch.expiry_status === 'Warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        batch.expiry_status === 'Expired' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {batch.expiry_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">* Sales will automatically deduct stock from the earliest expiring batch first.</p>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMedicine ? "Edit Medicine & Price" : "Add New Medicine"}
      >
        <div className="space-y-6">
          {!editingMedicine && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setScanMode('ocr')}
                className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <Camera size={24} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">OCR Package Scan</span>
              </button>
              <button 
                onClick={() => setScanMode('barcode')}
                className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <Barcode size={24} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">Barcode Lookup</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Medicine Name</label>
                <input 
                  name="name"
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  placeholder="e.g. Paracetamol"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Generic Name</label>
                <input 
                  name="generic_name"
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  placeholder="e.g. Acetaminophen"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="col-span-2">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Price & Stock Information</p>
              </div>
              {!editingMedicine && (
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
                  <input 
                    name="batch_number"
                    type="text" 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 transition-all outline-none dark:text-white" 
                    placeholder="e.g. BNT123"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <IndianRupee size={14} /> Selling Price (MRP)
                </label>
                <input 
                  name="initial_mrp"
                  type="number" 
                  step="0.01"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 transition-all outline-none font-bold text-indigo-700 dark:text-indigo-400" 
                  value={formData.initial_mrp}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Package size={14} /> {editingMedicine ? 'Total Stock' : 'Initial Stock'}
                </label>
                <input 
                  name="initial_stock"
                  type="number" 
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 transition-all outline-none dark:text-white" 
                  value={formData.initial_stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input 
                  name="category"
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  placeholder="e.g. Tablet"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">GST %</label>
                <input 
                  name="gst_percentage"
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  value={formData.gst_percentage}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Manufacturing Date</label>
                <input 
                  name="manufacturing_date"
                  type="date" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  value={formData.manufacturing_date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                <input 
                  name="expiry_date"
                  type="date" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
              <input 
                name="manufacturer"
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white" 
                placeholder="e.g. GSK"
                value={formData.manufacturer}
                onChange={handleInputChange}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (editingMedicine ? 'Update Medicine & Price' : 'Save Medicine')}
            </button>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!scanMode}
        onClose={() => setScanMode(null)}
        title={scanMode === 'ocr' ? 'OCR Text Extraction' : 'Barcode Scanner'}
      >
        {scanMode && <Scanner mode={scanMode} onScanResult={handleScanResult} />}
      </Modal>
    </div>
  );
};

export default Inventory;
