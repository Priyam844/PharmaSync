import { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import api from '../api/axios';

const Billing = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const addToCart = (medicine: any) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.batches?.[0]?.mrp || 0) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await api.post('sales/', {
        customer_info: customerInfo,
        items: cart.map(item => ({
          medicine: item.id,
          quantity: item.quantity
        }))
      });
      setSuccess(true);
      setCart([]);
      setCustomerInfo('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Checkout failed: Check stock levels');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Sales</h1>
        <p className="text-gray-500">Search medicines and create new sales invoices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medicine Search & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search medicine to add..."
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicines.map(med => (
              <button 
                key={med.id}
                onClick={() => addToCart(med)}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left flex justify-between items-center group"
              >
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{med.name}</p>
                  <p className="text-sm text-gray-500">{med.category || 'Tablet'}</p>
                  <p className="text-xs font-bold text-indigo-600 mt-1">₹{med.batches?.[0]?.mrp || '0.00'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Plus size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart / Invoice Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col h-[600px] lg:h-[700px]">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart size={20} />
              Current Order
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-sm">Your cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.batches?.[0]?.mrp || 0} / unit</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-indigo-600 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-indigo-600 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Details</label>
              <input 
                type="text" 
                placeholder="Name or Phone Number"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-500 font-medium">Grand Total</span>
                <span className="text-2xl font-black text-gray-900">₹{total.toFixed(2)}</span>
              </div>

              {success ? (
                <div className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                  <CheckCircle size={20} />
                  Sale Completed!
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Checkout'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
