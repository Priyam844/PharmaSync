import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  Loader2,
  UserPlus,
  Printer,
  User,
  Phone,
  RefreshCcw,
  Info,
  Package
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Logo from '../components/Logo';

const Billing = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isAlternativesModalOpen, setIsAlternativesModalOpen] = useState(false);
  const [searchingFor, setSearchingFor] = useState<any>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchesForSelection, setBatchesForSelection] = useState<any[]>([]);
  const [selectedMedicineForBatch, setSelectedMedicineForBatch] = useState<any>(null);

  useEffect(() => {
    fetchMedicines();
    fetchCustomers();
    
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const fetchCustomers = async () => {
    try {
      const res = await api.get('customers/');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const openBatchSelection = (medicine: any) => {
    if (medicine.total_stock <= 0) {
      if (window.confirm(`${medicine.name} is out of stock. Would you like to find alternatives?`)) {
        fetchAlternatives(medicine);
      }
      return;
    }
    
    // Only show batches with stock and not expired
    const activeBatches = (medicine.batches || []).filter((b: any) => 
      b.quantity > 0 && new Date(b.expiry_date) > new Date()
    );

    if (activeBatches.length === 0) {
      alert('All batches for this medicine are either empty or expired.');
      return;
    }

    if (activeBatches.length === 1) {
      // Auto-select if only one valid batch
      addToCart(medicine, activeBatches[0]);
    } else {
      setSelectedMedicineForBatch(medicine);
      setBatchesForSelection(activeBatches);
      setIsBatchModalOpen(true);
    }
  };

  const addToCart = (medicine: any, batch: any) => {
    const existing = cart.find(item => item.id === medicine.id && item.selectedBatch?.id === batch.id);
    if (existing) {
      setCart(cart.map(item => 
        (item.id === medicine.id && item.selectedBatch?.id === batch.id) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, selectedBatch: batch, quantity: 1 }]);
    }
    setIsBatchModalOpen(false);
  };

  const updateQuantity = (id: number, batchId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.selectedBatch?.id === batchId) {
        const newQty = Math.max(1, item.quantity + delta);
        // Check if new quantity exceeds batch stock
        if (newQty > item.selectedBatch.quantity) {
          alert(`Cannot exceed available stock (${item.selectedBatch.quantity}) for batch ${item.selectedBatch.batch_number}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number, batchId: number) => {
    setCart(cart.filter(item => !(item.id === id && item.selectedBatch?.id === batchId)));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.selectedBatch?.mrp || 0) * item.quantity, 0);
  const tax = cart.reduce((acc, item) => {
    const price = item.selectedBatch?.mrp || 0;
    const itemTax = (price * (item.gst_percentage || 12)) / 100;
    return acc + (itemTax * item.quantity);
  }, 0);
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('sales/', {
        customer: selectedCustomerId || null,
        items: cart.map(item => ({
          medicine: item.id,
          batch_id: item.selectedBatch?.id,
          quantity: item.quantity
        }))
      });
      
      setLastInvoice(res.data);
      setSuccess(true);
      setCart([]);
      setSelectedCustomerId('');
      setCustomerSearch('');
      fetchMedicines(); // Refresh stock levels
      
      // Show invoice after a brief delay
      setTimeout(() => {
        setSuccess(false);
        setShowInvoice(true);
      }, 1000);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Checkout failed: Check stock levels';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - PharmaSync</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Sales (GST Enabled)</h1>
        <p className="text-gray-500 dark:text-gray-400">Create professional tax invoices with customer tracking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medicine Search & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search medicine to add..."
              className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicines.map(med => (
              <div key={med.id} className="relative group">
                <button 
                  onClick={() => openBatchSelection(med)}
                  className="w-full bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{med.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{med.category || 'Tablet'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">₹{med.batches?.[0]?.mrp || '0.00'}</p>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">GST {med.gst_percentage}%</span>
                      {med.total_stock <= 0 && <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 font-bold uppercase">Out of Stock</span>}
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchAlternatives(med);
                  }}
                  title="Find Alternatives"
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cart / Invoice Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col h-[600px] lg:h-[700px]">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
              <ShoppingCart size={20} />
              Invoice Summary
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
                <div key={`${item.id}-${item.selectedBatch?.id || 'default'}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        Batch: {item.selectedBatch?.batch_number || 'N/A'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.selectedBatch?.mrp || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1">
                      <button 
                        onClick={() => item.selectedBatch && updateQuantity(item.id, item.selectedBatch.id, -1)} 
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors dark:text-white"
                        disabled={!item.selectedBatch}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => item.selectedBatch && updateQuantity(item.id, item.selectedBatch.id, 1)} 
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors dark:text-white"
                        disabled={!item.selectedBatch}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id, item.selectedBatch?.id || 0)} className="text-gray-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="space-y-2 relative" ref={customerDropdownRef}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Find Customer</label>
                <button className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
                  <UserPlus size={14} /> New
                </button>
              </div>
              
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Enter phone number..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium dark:text-white"
                  value={customerSearch}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                />
              </div>

              {isCustomerDropdownOpen && customerSearch && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                        onClick={() => {
                          setSelectedCustomerId(c.id.toString());
                          setCustomerSearch(c.phone);
                          setIsCustomerDropdownOpen(false);
                        }}
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No customer found
                    </div>
                  )}
                </div>
              )}

              {selectedCustomerId && selectedCustomer && !isCustomerDropdownOpen && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-1">
                  <User size={14} />
                  <span className="text-xs font-bold">{selectedCustomer.name} selected</span>
                  <button 
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerSearch('');
                    }}
                    className="ml-auto hover:text-indigo-900 dark:hover:text-indigo-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Tax (GST)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mb-4">
                <span className="text-gray-900 dark:text-white font-bold">Grand Total</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">₹{total.toFixed(2)}</span>
              </div>

              {success ? (
                <div className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                  <CheckCircle size={20} />
                  Invoice Generated!
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Print & Complete Sale'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        title="Tax Invoice"
      >
        <div className="space-y-6">
          <div ref={invoiceRef} className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center text-white p-1.5 shadow-sm">
                  <Logo size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">PharmaSync</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Professional Pharmacy Management</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">INVOICE</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">#{lastInvoice?.invoice_number}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(lastInvoice?.sale_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Customer</p>
                <p className="font-bold text-gray-900 dark:text-white">{lastInvoice?.customer_name || 'Walk-in Customer'}</p>
                {lastInvoice?.customer_phone && <p className="text-sm text-gray-500 dark:text-gray-400">{lastInvoice.customer_phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Pharmacist</p>
                <p className="font-bold text-gray-900 dark:text-white">Administrator</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                  <th className="py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Item Description</th>
                  <th className="py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Qty</th>
                  <th className="py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price</th>
                  <th className="py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {lastInvoice?.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{item.medicine_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">GST {item.tax_percentage}% Included</p>
                    </td>
                    <td className="py-4 text-center font-medium text-gray-600 dark:text-gray-400">{item.quantity}</td>
                    <td className="py-4 text-right font-medium text-gray-600 dark:text-gray-400">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="py-4 text-right font-bold text-gray-900 dark:text-white">₹{parseFloat(item.total_with_tax).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(lastInvoice?.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Tax (GST)</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(lastInvoice?.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{parseFloat(lastInvoice?.grand_total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-400 font-medium">Thank you for choosing PharmaSync. Get well soon!</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              <Printer size={20} />
              Print Invoice
            </button>
            <button 
              onClick={() => setShowInvoice(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Alternatives Modal */}
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
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">₹{alt.latest_mrp}</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-bold uppercase">{alt.total_stock} in stock</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      openBatchSelection(alt);
                      setIsAlternativesModalOpen(false);
                    }}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
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

      {/* Batch Selection Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Select Batch: ${selectedMedicineForBatch?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Multiple batches found for this medicine. Please select the batch you are selling from:
          </p>
          <div className="space-y-3">
            {batchesForSelection.map(batch => (
              <button
                key={batch.id}
                onClick={() => addToCart(selectedMedicineForBatch, batch)}
                className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Batch: {batch.batch_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      batch.expiry_status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                      batch.expiry_status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                      <Package size={12} /> {batch.quantity} Units Left
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">MRP: ₹{parseFloat(batch.mrp).toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Plus size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;
