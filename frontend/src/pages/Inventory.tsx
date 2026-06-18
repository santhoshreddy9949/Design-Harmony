import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, ArrowUpRight, ArrowDownRight, Edit3, X, Sliders, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: number;
  product_name: string;
  category: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
  supplier_name: string;
  reorder_level: number;
}

const Inventory: React.FC = () => {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stock adjust modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [products, setProducts] = useState<Array<{ id: number; product_name: string }>>([]);
  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    quantity: '1',
    type: 'in' // 'in' or 'out'
  });

  const loadInventory = async () => {
    try {
      const data = await apiFetch('/reports/analytics?type=inventory');
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsList = async () => {
    try {
      const data = await apiFetch('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadProductsList();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/products/adjust-stock', {
        method: 'POST',
        body: JSON.stringify({
          product_id: parseInt(adjustForm.product_id),
          quantity: parseInt(adjustForm.quantity),
          type: adjustForm.type
        })
      });
      setShowAdjustModal(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock level');
    }
  };

  const triggerLowStockFilter = () => {
    // Show only items with stock <= reorder_level
    const lowStock = items.filter(i => i.stock <= i.reorder_level);
    return lowStock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold dark:text-white">Warehouse Inventory & Stock Control</h2>
          <p className="text-xs text-slate-400">Manage reorder thresholds, update stock intake, and view cost details</p>
        </div>
        <button onClick={() => setShowAdjustModal(true)} className="btn-primary text-xs py-2">
          <Sliders className="w-4 h-4" /> Adjust Stock Level
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Warehouse SKU</span>
          <h3 className="text-xl font-bold dark:text-white mt-1">{items.length} Products</h3>
        </div>
        <div className="p-4 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Inventory Assets Value</span>
          <h3 className="text-xl font-bold text-gold-600 dark:text-gold-400 mt-1">
            ₹{items.reduce((sum, item) => sum + (item.stock * item.purchase_price), 0).toLocaleString('en-IN')}
          </h3>
        </div>
        <div className="p-4 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock SKUs</span>
            <h3 className="text-xl font-bold mt-1 text-red-500">
              {items.filter(i => i.stock <= i.reorder_level).length} Warnings
            </h3>
          </div>
          {items.filter(i => i.stock <= i.reorder_level).length > 0 && (
            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-darkborder bg-slate-50 dark:bg-darkbg">
          <span className="text-xs font-bold dark:text-white">Stock Directory Sheet</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-darkborder text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Current Stock</th>
                <th className="px-6 py-3">Purchase Cost</th>
                <th className="px-6 py-3">Retail Value</th>
                <th className="px-6 py-3">Default Supplier</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
              {items.map((item, idx) => {
                const isLow = item.stock <= item.reorder_level;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-semibold flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.category}</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={isLow ? 'text-red-500' : ''}>{item.stock}</span>
                      <span className="text-[10px] font-normal text-slate-400 block">Limit: {item.reorder_level}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">₹{item.purchase_price.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-gold-700 dark:text-gold-400 font-semibold">₹{item.selling_price.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-slate-500">{item.supplier_name}</td>
                    <td className="px-6 py-4 text-right">
                      {isLow ? (
                        <span className="px-2.5 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Level Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Adjust Stock Level</h3>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Product *</label>
                <select 
                  value={adjustForm.product_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Product SKU --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.product_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Transaction Type</label>
                  <select 
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="in">Intake (Stock In)</option>
                    <option value="out">Deduction (Stock Out)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Quantity Count</label>
                  <input 
                    type="number" 
                    min="1"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
