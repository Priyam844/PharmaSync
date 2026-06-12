import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Printer, 
  RotateCcw,
  Eye,
  Calendar,
  User,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Logo from '../components/Logo';

const SalesHistory = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('sales/');
      setSales(res.data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnOrder = async (sale: any) => {
    const saleDate = new Date(sale.sale_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - saleDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      alert('This order cannot be returned as the 7-day window has expired.');
      return;
    }

    if (window.confirm('Are you sure you want to process a return for this order? Medicines will be added back to stock.')) {
      try {
        await api.post(`sales/${sale.id}/return_order/`);
        fetchSales();
        alert('Order return processed successfully');
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to process return');
      }
    }
  };

  const openInvoice = (sale: any) => {
    setSelectedSale(sale);
    setShowInvoice(true);
  };

  const isReturnable = (saleDate: string) => {
    const sDate = new Date(saleDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
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
            <title>Invoice Review - PharmaSync</title>
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

  const filteredSales = sales.filter(sale => 
    sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History & Invoices</h1>
        <p className="text-gray-500 dark:text-gray-400">Review transactions and process returns (within 7 days).</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by Invoice ID or Customer Name..."
          className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Invoice ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">#{sale.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <User size={14} className="text-gray-400 dark:text-gray-500" />
                        {sale.customer_name || 'Walk-in'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹{parseFloat(sale.grand_total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                        sale.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 
                        sale.status === 'RETURNED' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        {sale.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        {sale.status === 'RETURNED' && <RotateCcw size={12} />}
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openInvoice(sale)}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          title="View & Print"
                        >
                          <Eye size={18} />
                        </button>
                        {sale.status === 'COMPLETED' && (
                          isReturnable(sale.sale_date) ? (
                            <button 
                              onClick={() => handleReturnOrder(sale)}
                              className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                              title="Process Return (Allowed within 7 days)"
                            >
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            <div className="p-2 text-gray-300 dark:text-gray-600" title="Return period expired (7+ days)">
                              <Clock size={18} />
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Re-use Invoice Modal */}
      <Modal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        title={`Invoice ${selectedSale?.invoice_number}`}
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
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">#{selectedSale?.invoice_number}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSale && new Date(selectedSale.sale_date).toLocaleDateString()}</p>
                <p className={`text-[10px] font-bold uppercase mt-1 ${
                  selectedSale?.status === 'RETURNED' ? 'text-amber-600' : 
                  selectedSale?.status === 'CANCELLED' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  Status: {selectedSale?.status}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Customer</p>
                <p className="font-bold text-gray-900 dark:text-white">{selectedSale?.customer_name || 'Walk-in Customer'}</p>
                {selectedSale?.customer_phone && <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSale.customer_phone}</p>}
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                  <th className="py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Description</th>
                  <th className="py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Qty</th>
                  <th className="py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price</th>
                  <th className="py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {selectedSale?.items.map((item: any, idx: number) => (
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
                  <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(selectedSale?.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Tax (GST)</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(selectedSale?.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{parseFloat(selectedSale?.grand_total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              <Printer size={20} />
              Reprint Invoice
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
    </div>
  );
};

export default SalesHistory;
