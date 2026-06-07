import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle,
  Loader2,
  Calendar,
  Tag
} from 'lucide-react';
import api from '../api/axios';

const Purchases = () => {
  const location = useLocation();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMedicines();
    fetchSuppliers();
    
    // Handle pre-selected supplier from Supplier Management
    if (location.state?.preSelectedSupplierId) {
      setSelectedSupplier(location.state.preSelectedSupplierId.toString());
    }
  }, [location.state]);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('medicines/');
      setMedicines(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('suppliers/');
      setSuppliers(res.data);
    } catch (err) { console.error(err); }
  };

  const addItem = () => {
    setItems([...items, { medicine: '', batch_number: '', manufacturing_date: '', expiry_date: '', quantity: 0, cost_price: 0, mrp: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedSupplier || items.length === 0) return;
    setLoading(true);
    try {
      await api.post('purchases/', {
        supplier: selectedSupplier,
        reference_no: referenceNo,
        items: items
      });
      setSuccess(true);
      setItems([]);
      setSelectedSupplier('');
      setReferenceNo('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock-In / Purchases</h1>
          <p className="text-gray-500 dark:text-gray-400">Add new stock from suppliers to your inventory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck size={18} className="text-indigo-600" />
              Purchase Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Supplier</label>
                <select 
                  className="w-full mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ref / Invoice No</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                  placeholder="INV-2024-001"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Medicine</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Batch & Expiry</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cost / MRP</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <select 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                        value={item.medicine}
                        onChange={(e) => updateItem(index, 'medicine', e.target.value)}
                      >
                        <option value="">Select</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <input 
                        type="text" 
                        placeholder="Batch No"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                        value={item.batch_number}
                        onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 uppercase font-bold">Mfg</label>
                          <input 
                            type="date" 
                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] dark:text-white"
                            value={item.manufacturing_date}
                            onChange={(e) => updateItem(index, 'manufacturing_date', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 uppercase font-bold">Exp</label>
                          <input 
                            type="date" 
                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] dark:text-white"
                            value={item.expiry_date}
                            onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">C:</span>
                        <input 
                          type="number" 
                          className="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                          value={item.cost_price}
                          onChange={(e) => updateItem(index, 'cost_price', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">M:</span>
                        <input 
                          type="number" 
                          className="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                          value={item.mrp}
                          onChange={(e) => updateItem(index, 'mrp', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {items.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p>No items added to this purchase yet.</p>
              </div>
            )}

            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <button 
                onClick={addItem}
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <Plus size={20} />
                Add Medicine Item
              </button>
              
              <div className="flex items-center gap-4">
                {success ? (
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle size={20} /> Purchase Saved!
                  </div>
                ) : (
                  <button 
                    onClick={handleSave}
                    disabled={loading || items.length === 0 || !selectedSupplier}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Purchase'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
