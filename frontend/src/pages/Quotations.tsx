import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Search, FileText, CheckCircle2, Clipboard } from 'lucide-react';
import jsPDF from 'jspdf';

interface Product {
  id: number;
  product_name: string;
  price: number;
}

interface Customer {
  id: number;
  name: string;
}

interface QuotationItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Quotation {
  id: number;
  customer_name: string;
  project_name: string;
  date: string;
  expiry_date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  total_amount: number;
}

const Quotations: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote Creator state
  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [discount, setDiscount] = useState('0');
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([]);

  const loadQuotations = async () => {
    try {
      const quotes = await apiFetch('/orders/quotations');
      setQuotations(quotes);
      
      const custs = await apiFetch('/customers');
      setCustomers(custs);
      
      const prods = await apiFetch('/products');
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleAddItem = (productId: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    
    // Check if already in items
    const exists = quoteItems.find(item => item.product_id === productId);
    if (exists) {
      setQuoteItems(quoteItems.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price } 
          : item
      ));
    } else {
      setQuoteItems([...quoteItems, {
        product_id: prod.id,
        product_name: prod.product_name,
        quantity: 1,
        unit_price: prod.price,
        total_price: prod.price
      }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setQuoteItems(quoteItems.map((item, i) => 
      i === index 
        ? { ...item, quantity, total_price: quantity * item.unit_price }
        : item
    ));
  };

  // Submit quote
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || quoteItems.length === 0) {
      alert('Select customer and add at least one product.');
      return;
    }

    try {
      await apiFetch('/orders/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: parseInt(customerId),
          items: quoteItems,
          discount: parseFloat(discount) || 0,
          tax_rate: parseFloat(taxRate) || 18
        })
      });
      setShowCreate(false);
      setCustomerId('');
      setQuoteItems([]);
      setDiscount('0');
      loadQuotations();
    } catch (err) {
      alert('Error generating quotation');
    }
  };

  // Approve quote
  const handleApprove = async (id: number) => {
    try {
      const result = await apiFetch(`/orders/quotations/${id}/approve`, { method: 'POST' });
      alert('Quotation approved! Order generated successfully.');
      loadQuotations();
    } catch (err) {
      alert('Failed to approve quotation');
    }
  };

  // jsPDF Export
  const handleDownloadPDF = (quote: Quotation) => {
    const doc = new jsPDF();

    // Color theme colors
    const goldColor = [197, 168, 128]; // C5A880 (Gold)
    const charcoalColor = [30, 30, 30]; // Dark Grey

    // Header Title
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('DESIGN & HARMONY', 20, 20);

    doc.setTextColor(197, 168, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('PREMIUM INTERIORS & BESPOKE FURNITURE', 20, 27);
    doc.text('Jubilee Hills, Hyderabad, India | GSTIN: 36AAAAA1111A1Z1', 20, 34);

    // Document type title tag
    doc.setTextColor(197, 168, 128);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('QUOTATION SHEET', 140, 22);
    
    // Line decoration
    doc.setFillColor(197, 168, 128);
    doc.rect(140, 25, 50, 1.5, 'F');

    // Details Block
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CLIENT DETAILS:', 20, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${quote.customer_name}`, 20, 67);
    doc.text(`Project Target: ${quote.project_name || 'Individual Furniture Order'}`, 20, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION PARAMETERS:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Quotation ID: #QT-${quote.id}`, 120, 67);
    doc.text(`Date Issued: ${quote.date}`, 120, 74);
    doc.text(`Valid Until: ${quote.expiry_date}`, 120, 81);

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 95, 170, 10, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Product / Item Name', 25, 101);
    doc.text('Price (INR)', 105, 101);
    doc.text('Qty', 140, 101);
    doc.text('Total (INR)', 165, 101);

    // Separator line
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.5);
    doc.line(20, 105, 190, 105);

    // Fill Item row dummy
    doc.setFont('helvetica', 'normal');
    doc.text('Bespoke Furniture Services Bundle', 25, 115);
    doc.text(`${(quote.total_amount / 1.18).toFixed(2)}`, 105, 115);
    doc.text('1', 140, 115);
    doc.text(`${(quote.total_amount / 1.18).toFixed(2)}`, 165, 115);

    // Tally parameters
    doc.line(20, 140, 190, 140);
    doc.setFont('helvetica', 'bold');
    doc.text('Sub-total (Excl. Tax):', 120, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${(quote.total_amount / 1.18).toFixed(2)}`, 165, 150);

    doc.setFont('helvetica', 'bold');
    doc.text('GST Tax (18%):', 120, 157);
    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${(quote.total_amount - (quote.total_amount / 1.18)).toFixed(2)}`, 165, 157);

    // Grand total banner
    doc.setFillColor(197, 168, 128);
    doc.rect(115, 165, 75, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 120, 171.5);
    doc.text(`INR ${quote.total_amount.toLocaleString('en-IN')}`, 155, 171.5);

    // Signature footer
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('This is a computer-generated quotation document and does not require a physical signature.', 20, 260);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Authorized Representative', 140, 245);
    doc.line(135, 240, 185, 240);

    doc.save(`Quotation_QT-${quote.id}.pdf`);
  };

  const subTotal = quoteItems.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = Math.round(subTotal * (parseFloat(taxRate) / 100));
  const grandTotal = subTotal + taxAmount - (parseFloat(discount) || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* List Header */}
      {!showCreate && (
        <>
          <div className="flex justify-between items-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
            <div>
              <h2 className="font-serif text-lg font-bold dark:text-white">Quotations & Estimations Board</h2>
              <p className="text-xs text-slate-400">Generate pricing sheets, calculate GST splits, and request order approvals</p>
            </div>
            {['admin', 'sales_executive'].includes(user?.role || '') && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-2">
                <Plus className="w-4 h-4" /> Create Quotation
              </button>
            )}
          </div>

          {/* Quotations directory list table */}
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-darkborder text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">Quote ID</th>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Project Target</th>
                    <th className="px-6 py-3">Created On</th>
                    <th className="px-6 py-3">Valid Until</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                  {quotations.map(quote => (
                    <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">#QT-{quote.id}</td>
                      <td className="px-6 py-4 font-semibold">{quote.customer_name}</td>
                      <td className="px-6 py-4 text-slate-500">{quote.project_name}</td>
                      <td className="px-6 py-4 text-slate-500">{quote.date}</td>
                      <td className="px-6 py-4 text-slate-500">{quote.expiry_date}</td>
                      <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{quote.total_amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`badge-status ${
                          quote.status === 'Approved' 
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                            : quote.status === 'Pending'
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2.5">
                        <button 
                          onClick={() => handleDownloadPDF(quote)}
                          className="px-2.5 py-1 border border-slate-200 dark:border-darkborder rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-gold-600 flex items-center gap-1 font-semibold"
                          title="Export PDF"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                        {quote.status === 'Pending' && ['admin', 'sales_executive'].includes(user?.role || '') && (
                          <button 
                            onClick={() => handleApprove(quote.id)}
                            className="px-2.5 py-1 bg-gold-600 text-white rounded hover:bg-gold-700 flex items-center gap-1 font-semibold"
                            title="Approve & convert to order"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Quotation Creator Pane */}
      {showCreate && (
        <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-darkborder pb-4">
            <h2 className="font-serif text-lg font-bold dark:text-white">Create Proposal Quotation</h2>
            <button onClick={() => setShowCreate(false)} className="btn-secondary py-1 px-3">
              Back to List
            </button>
          </div>

          <form onSubmit={handleSaveQuotation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Customer *</label>
                <select 
                  value={customerId} 
                  onChange={(e) => setCustomerId(e.target.value)} 
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">GST Rate (%)</label>
                <select 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(e.target.value)} 
                  className="input-field"
                >
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Discounts Deduction (₹)</label>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value)} 
                  className="input-field" 
                />
              </div>
            </div>

            {/* Product selection tray */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-darkborder">
              {/* Product catalog picker */}
              <div className="space-y-3">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Items Catalogue</span>
                <div className="space-y-2 max-h-80 overflow-y-auto border border-slate-100 dark:border-darkborder p-2.5 rounded-xl">
                  {products.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleAddItem(p.id)}
                      className="p-2 border border-slate-50 dark:border-darkborder/40 dark:text-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex justify-between items-center transition"
                    >
                      <span className="font-semibold">{p.product_name}</span>
                      <span className="text-gold-600 dark:text-gold-400 font-bold shrink-0">₹{p.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Selected list table */}
              <div className="lg:col-span-2 space-y-3">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Selected Items Proposal ({quoteItems.length})</span>
                <div className="border border-slate-100 dark:border-darkborder rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-darkbg text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-100 dark:border-darkborder">
                        <th className="px-4 py-2.5">Item Name</th>
                        <th className="px-4 py-2.5">Price</th>
                        <th className="px-4 py-2.5 w-20">Quantity</th>
                        <th className="px-4 py-2.5">Total</th>
                        <th className="px-4 py-2.5 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                      {quoteItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                            Select products from the catalog to populate proposal quotation rows.
                          </td>
                        </tr>
                      ) : (
                        quoteItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-semibold">{item.product_name}</td>
                            <td className="px-4 py-3 text-slate-500">₹{item.unit_price.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number" 
                                min="1" 
                                value={item.quantity}
                                onChange={(e) => handleQtyChange(index, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-gold-600 dark:text-gold-400">₹{item.total_price.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub Total summary boxes */}
                {quoteItems.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-darkbg border border-slate-100 dark:border-darkborder rounded-xl ml-auto max-w-sm space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="font-semibold dark:text-slate-200">₹{subTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST tax ({taxRate}%):</span>
                      <span className="font-semibold dark:text-slate-200">₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {parseFloat(discount) > 0 && (
                      <div className="flex justify-between text-red-500 font-semibold">
                        <span>Discount:</span>
                        <span>- ₹{parseFloat(discount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 dark:border-darkborder pt-2 text-sm font-bold">
                      <span className="dark:text-white">Estimate Total:</span>
                      <span className="text-gold-600 dark:text-gold-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={quoteItems.length === 0}>
                Save Quotation proposal
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Quotations;
