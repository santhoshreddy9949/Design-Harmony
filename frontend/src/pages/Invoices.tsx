import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, FileText, Plus, DollarSign, X, Check, Mail, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  total_price: number;
}

interface Payment {
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  payment_status: 'Paid' | 'Partially Paid' | 'Pending';
  sub_total: number;
  tax_amount: number;
  discount_amount: number;
  items?: InvoiceItem[];
  payments?: Payment[];
}

interface Order {
  id: number;
  customer_name: string;
  total_amount: number;
}

const Invoices: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    order_id: '',
    customer_id: '',
    discount: '0',
    tax_rate: '18'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'UPI',
    transaction_reference: ''
  });

  const loadInvoices = async () => {
    try {
      const data = await apiFetch('/invoices');
      setInvoices(data);
      
      const ords = await apiFetch('/orders/orders');
      // filter orders that don't have invoices yet
      setOrders(ords);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleOpenDetails = async (inv: Invoice) => {
    try {
      const details = await apiFetch(`/invoices/${inv.id}`);
      setSelectedInvoice(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.order_id) {
      alert('Please select an active order to generate invoice.');
      return;
    }

    try {
      // Find customer associated with selected order
      const resOrder = await apiFetch(`/orders/orders/${invoiceForm.order_id}`);
      const payload = {
        order_id: parseInt(invoiceForm.order_id),
        customer_id: resOrder.customer_id,
        discount: parseFloat(invoiceForm.discount) || 0,
        tax_rate: parseFloat(invoiceForm.tax_rate) || 18,
        items: resOrder.items.map((it: any) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          gst_rate: parseFloat(invoiceForm.tax_rate) || 18
        }))
      };

      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowInvoiceModal(false);
      loadInvoices();
    } catch (err) {
      alert('Error creating invoice');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await apiFetch('/orders/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          transaction_reference: paymentForm.transaction_reference
        })
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'UPI', transaction_reference: '' });
      loadInvoices();
      // Reload details
      handleOpenDetails(selectedInvoice);
    } catch (err) {
      alert('Failed to log payment transaction');
    }
  };

  const handleEmailInvoice = async (id: number) => {
    try {
      const result = await apiFetch(`/invoices/${id}/email`, { method: 'POST' });
      alert(result.message);
    } catch (err: any) {
      alert(err.message || 'Failed to email invoice');
    }
  };

  // jsPDF Generation
  const handleDownloadPDF = (inv: Invoice) => {
    const doc = new jsPDF();
    
    // Header Panel
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

    doc.setTextColor(197, 168, 128);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('TAX INVOICE', 140, 22);

    doc.setFillColor(197, 168, 128);
    doc.rect(140, 25, 50, 1.5, 'F');

    // Customer & Invoice Details
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILLED TO:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${inv.customer_name}`, 20, 67);
    doc.text(`Invoice Status: ${inv.payment_status}`, 20, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE PARAMETERS:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Serial: ${inv.invoice_number}`, 120, 67);
    doc.text(`Issue Date: ${inv.issue_date}`, 120, 74);
    doc.text(`Due Date: ${inv.due_date}`, 120, 81);

    // Items table header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 95, 170, 10, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 25, 101);
    doc.text('Price (INR)', 100, 101);
    doc.text('Qty', 130, 101);
    doc.text('GST %', 145, 101);
    doc.text('Total (INR)', 165, 101);

    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.5);
    doc.line(20, 105, 190, 105);

    // List of items
    doc.setFont('helvetica', 'normal');
    let y = 115;
    const itemsList = inv.items || [
      { product_name: 'Bespoke False Ceiling Civil Works', quantity: 1, unit_price: inv.sub_total, gst_rate: 18, gst_amount: inv.tax_amount, total_price: inv.grand_total }
    ];

    itemsList.forEach((item) => {
      doc.text(item.product_name, 25, y);
      doc.text(item.unit_price.toString(), 100, y);
      doc.text(item.quantity.toString(), 130, y);
      doc.text(`${item.gst_rate}%`, 145, y);
      doc.text(item.total_price.toString(), 165, y);
      y += 10;
    });

    // Separator line
    doc.line(20, y + 2, 190, y + 2);

    // Subtotal and Totals
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal (Excl. GST):', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${inv.sub_total.toLocaleString('en-IN')}`, 165, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('GST Value:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${inv.tax_amount.toLocaleString('en-IN')}`, 165, y);

    if (inv.discount_amount > 0) {
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 50, 50);
      doc.text('Discount:', 110, y);
      doc.text(`- INR ${inv.discount_amount.toLocaleString('en-IN')}`, 165, y);
      doc.setTextColor(30, 30, 30);
    }

    // Grand total banner
    y += 8;
    doc.setFillColor(197, 168, 128);
    doc.rect(105, y, 85, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 110, y + 6.5);
    doc.text(`INR ${inv.grand_total.toLocaleString('en-IN')}`, 150, y + 6.5);

    // Terms
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Terms: Payment is requested within 15 days of invoice issue date via Bank Transfer or UPI.', 20, 250);
    doc.text('This is a computer-generated tax invoice and does not require signatures.', 20, 256);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Accounts Head', 140, 235);
    doc.line(135, 230, 185, 230);

    doc.save(`Invoice_${inv.invoice_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
      
      {/* Invoices list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold dark:text-white">Billing & Invoices</h2>
            <p className="text-xs text-slate-400">Generate GST-compliant tax billings, email statements, and register receipts</p>
          </div>
          {user?.role === 'admin' || user?.role === 'accountant' ? (
            <button onClick={() => setShowInvoiceModal(true)} className="btn-primary text-xs py-2">
              <Plus className="w-4 h-4" /> Issue Invoice
            </button>
          ) : null}
        </div>

        <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-darkborder text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Invoice No.</th>
                  <th className="px-6 py-3">Customer Name</th>
                  <th className="px-6 py-3">Issued Date</th>
                  <th className="px-6 py-3">Grand Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                {invoices.map(inv => (
                  <tr 
                    key={inv.id} 
                    onClick={() => handleOpenDetails(inv)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer ${
                      selectedInvoice?.id === inv.id ? 'bg-gold-50/10 dark:bg-gold-950/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{inv.invoice_number}</td>
                    <td className="px-6 py-4 font-semibold">{inv.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.issue_date}</td>
                    <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`badge-status ${
                        inv.payment_status === 'Paid' 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                          : inv.payment_status === 'Partially Paid' 
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected details pane */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl p-5 shadow-sm h-fit space-y-6">
        {selectedInvoice ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-darkborder pb-4">
              <div>
                <h2 className="font-serif text-base font-bold dark:text-white">{selectedInvoice.invoice_number}</h2>
                <span className="text-[10px] text-slate-400 font-semibold">Due: {selectedInvoice.due_date}</span>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-darkborder rounded text-slate-400 hover:text-gold-600"
                  title="Download PDF Invoice"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEmailInvoice(selectedInvoice.id)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-darkborder rounded text-slate-400 hover:text-gold-600"
                  title="Email Invoice copy"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total tally parameters */}
            <div className="p-4 bg-slate-50 dark:bg-darkbg border border-slate-100 dark:border-darkborder rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-semibold dark:text-slate-200">₹{selectedInvoice.sub_total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST Value:</span>
                <span className="font-semibold dark:text-slate-200">₹{selectedInvoice.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              {selectedInvoice.discount_amount > 0 && (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>Discount:</span>
                  <span>- ₹{selectedInvoice.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 dark:border-darkborder pt-2 text-sm font-bold">
                <span className="dark:text-white">Grand Total:</span>
                <span className="text-gold-600 dark:text-gold-400">₹{selectedInvoice.grand_total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment history transactions logs */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Payments Registered</span>
                {selectedInvoice.payment_status !== 'Paid' && (user?.role === 'admin' || user?.role === 'accountant') && (
                  <button 
                    onClick={() => setShowPaymentModal(true)} 
                    className="text-[10px] font-bold text-gold-600 hover:underline flex items-center gap-0.5"
                  >
                    + Register Payment
                  </button>
                )}
              </div>

              {selectedInvoice.payments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedInvoice.payments?.map((pay, i) => (
                    <div key={i} className="p-3 border border-slate-100 dark:border-darkborder rounded-xl flex justify-between items-center text-xs dark:text-slate-200">
                      <div>
                        <span className="font-semibold">{pay.payment_method}</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">Ref: {pay.transaction_reference || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600">+ ₹{pay.amount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">{new Date(pay.payment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            Select a customer invoice row to log payments, export PDF bills, or email statements.
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Issue Tax Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Sales Order Reference *</label>
                <select 
                  value={invoiceForm.order_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, order_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Sales Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>Order #{o.id} - {o.customer_name} (₹{o.total_amount})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Apply GST %</label>
                  <select 
                    value={invoiceForm.tax_rate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: e.target.value })}
                    className="input-field"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Discount Value (₹)</label>
                  <input 
                    type="number" 
                    value={invoiceForm.discount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Register Payment Receipt</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Receipt Amount (₹) *</label>
                <input 
                  type="number" 
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder={`Max: ₹${selectedInvoice ? selectedInvoice.grand_total : 0}`}
                  className="input-field" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Payment Channel *</label>
                <select 
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Credit Card">Credit Card Swipe</option>
                  <option value="Debit Card">Debit Card Swipe</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Transaction Reference Code</label>
                <input 
                  type="text" 
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  placeholder="e.g. UTR / UPI Ref ID"
                  className="input-field" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Invoices;
