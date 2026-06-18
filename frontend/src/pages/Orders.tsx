import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Truck, Calendar, MapPin, Edit3, X, ChevronRight, PackageCheck } from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  customer_name: string;
  project_name: string;
  status: 'Pending' | 'Confirmed' | 'Manufacturing' | 'Ready' | 'Delivered' | 'Cancelled';
  order_date: string;
  delivery_date: string;
  tracking_id: string;
  delivery_address: string;
  total_amount: number;
  items?: OrderItem[];
}

const Orders: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Order Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'Pending',
    tracking_id: '',
    delivery_date: ''
  });

  const loadOrders = async () => {
    try {
      const data = await apiFetch('/orders/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenDetails = async (order: Order) => {
    try {
      const details = await apiFetch(`/orders/orders/${order.id}`);
      setSelectedOrder(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditStatus = () => {
    if (!selectedOrder) return;
    setStatusForm({
      status: selectedOrder.status,
      tracking_id: selectedOrder.tracking_id || '',
      delivery_date: selectedOrder.delivery_date || ''
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const updated = await apiFetch(`/orders/orders/${selectedProjectOrOrder(selectedOrder.id)}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusForm)
      });
      setShowStatusModal(false);
      loadOrders();
      // Reload details
      handleOpenDetails(selectedOrder);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Helper helper
  const selectedProjectOrOrder = (id: number) => id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
      
      {/* Orders list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold dark:text-white">Customer Sales Orders</h2>
            <p className="text-xs text-slate-400">Track custom manufacturing schedules, logistics tags, and completion updates</p>
          </div>
        </div>

        <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-darkborder text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer Name</th>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Delivery ETA</th>
                  <th className="px-6 py-3">Invoice Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                {orders.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => handleOpenDetails(order)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'bg-gold-50/10 dark:bg-gold-950/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">#ORD-{order.id}</td>
                    <td className="px-6 py-4 font-semibold">{order.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500">{order.order_date}</td>
                    <td className="px-6 py-4 text-slate-500">{order.delivery_date || 'TBD'}</td>
                    <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{order.total_amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`badge-status ${
                        order.status === 'Delivered' 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                          : ['Pending', 'Confirmed'].includes(order.status)
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                          : order.status === 'Cancelled'
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                          : 'bg-gold-50 dark:bg-gold-950/20 text-gold-700 dark:text-gold-300'
                      }`}>
                        {order.status}
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
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl p-5 shadow-sm h-fit">
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-darkborder pb-4">
              <div>
                <h2 className="font-serif text-base font-bold dark:text-white">Order Details #ORD-{selectedOrder.id}</h2>
                <span className="text-[10px] text-slate-400 font-semibold">Ordered: {selectedOrder.order_date}</span>
              </div>
              {['admin', 'sales_executive', 'inventory_manager'].includes(user?.role || '') && (
                <button 
                  onClick={handleOpenEditStatus}
                  className="px-2.5 py-1 text-xs border border-slate-200 dark:border-darkborder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-gold-500 rounded font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Update Status
                </button>
              )}
            </div>

            {/* Delivery progress stats fields */}
            <div className="space-y-3.5 text-xs">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Logistics Status</span>
              <div className="grid grid-cols-2 gap-3 dark:text-slate-200">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Tracking Reference</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedOrder.tracking_id || 'NOT DISPATCHED'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Estimated Delivery</span>
                  <span className="font-semibold">{selectedOrder.delivery_date || 'TBD'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Shipping Address</span>
                  <span className="font-semibold leading-normal">{selectedOrder.delivery_address || 'Same as client site address'}</span>
                </div>
              </div>
            </div>

            {/* Items included list */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-darkborder">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Items in Shipment</span>
              <div className="border border-slate-100 dark:border-darkborder rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-darkbg text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-darkborder">
                    <tr>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-center w-12">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 font-medium">{item.product_name}</td>
                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">₹{item.total_price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right pt-2 text-xs font-bold flex justify-between dark:text-slate-300">
                <span>Grand Total:</span>
                <span className="text-gold-600 dark:text-gold-400 text-sm font-bold">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            Select a customer sales order row to inspect product items, tracking serial codes, and logistic statuses.
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Update Logistics Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Logistics Phase *</label>
                <select 
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Ready">Ready</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Tracking Reference Serial</label>
                <input 
                  type="text" 
                  value={statusForm.tracking_id}
                  onChange={(e) => setStatusForm({ ...statusForm, tracking_id: e.target.value })}
                  className="input-field" 
                  placeholder="e.g. TRK-DH-88092"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Estimated Delivery Date</label>
                <input 
                  type="date" 
                  value={statusForm.delivery_date}
                  onChange={(e) => setStatusForm({ ...statusForm, delivery_date: e.target.value })}
                  className="input-field" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
