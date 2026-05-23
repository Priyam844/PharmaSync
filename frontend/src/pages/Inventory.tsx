import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit,
  Camera,
  Barcode,
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Scanner from '../components/Scanner';

const Inventory = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'ocr' | 'barcode' | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    category: '',
    description: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('medicines/', formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', generic_name: '', manufacturer: '', category: '', description: '' });
      fetchMedicines();
    } catch (err) {
      console.error('Error saving medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`medicines/${id}/`);
        fetchMedicines();
      } catch (err) {
        console.error('Error deleting medicine:', err);
      }
    }
  };

  const handleScanResult = (data: any) => {
    console.log("Scan Result:", data);
    if (data.rawText) {
      // Basic OCR parsing logic (can be improved)
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage your medicines and stock batches.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Add Medicine
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, generic, or manufacturer..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Generic Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{med.name}</span>
                      <span className="text-xs text-gray-500">{med.manufacturer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{med.generic_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {med.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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

      {/* Add Medicine Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Medicine"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setScanMode('ocr')}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-indigo-600">
                <Camera size={24} />
              </div>
              <span className="font-bold text-gray-700 text-sm">OCR Package Scan</span>
            </button>
            <button 
              onClick={() => setScanMode('barcode')}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-indigo-600">
                <Barcode size={24} />
              </div>
              <span className="font-bold text-gray-700 text-sm">Barcode Lookup</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Medicine Name</label>
              <input 
                name="name"
                required
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                placeholder="e.g. Paracetamol"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Generic Name</label>
              <input 
                name="generic_name"
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                placeholder="e.g. Acetaminophen"
                value={formData.generic_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <input 
                  name="category"
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                  placeholder="e.g. Tablet"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Manufacturer</label>
                <input 
                  name="manufacturer"
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-indigo-500 focus:bg-white transition-all outline-none" 
                  placeholder="e.g. GSK"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Medicine'}
            </button>
          </form>
        </div>
      </Modal>

      {/* Scanner Modal */}
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
