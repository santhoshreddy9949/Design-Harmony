import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, Phone, Mail, MapPin, Plus, Edit2, X, Clipboard } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  address: string;
  gst_number: string;
}

const Suppliers: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    gst_number: ''
  });

  const loadSuppliers = async () => {
    try {
      const data = await apiFetch('/products/suppliers/all');
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setModalType('add');
    setFormData({ name: '', phone_number: '', email: '', address: '', gst_number: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setModalType('edit');
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name,
      phone_number: sup.phone_number || '',
      email: sup.email || '',
      address: sup.address || '',
      gst_number: sup.gst_number || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await apiFetch('/products/suppliers/all', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      } else {
        if (!selectedSupplier) return;
        await apiFetch(`/products/suppliers/all/${selectedSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      alert('Error saving supplier');
    }
  };

  const canManage = ['admin', 'inventory_manager'].includes(user?.role || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold dark:text-white">Supplier & Procurement Registry</h2>
          <p className="text-xs text-slate-400">Manage vendors, raw materials providers, fabrics mills, and track GST compliance</p>
        </div>
        {canManage && (
          <button onClick={handleOpenAdd} className="btn-primary text-xs py-2">
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        )}
      </div>

      {/* Supplier Cards directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(sup => (
          <div key={sup.id} className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gold-50 dark:bg-gold-950/20 flex items-center justify-center text-gold-600 dark:text-gold-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm dark:text-white">{sup.name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold block">Vendor Ref: #SUP-{sup.id}</span>
                  </div>
                </div>
                {canManage && (
                  <button 
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-gold-500 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Vendor Contacts */}
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-50 dark:border-darkborder/30">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone_number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sup.email || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-normal">{sup.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* GST Number Box */}
            <div className="p-2.5 bg-slate-50 dark:bg-darkbg border border-slate-100 dark:border-darkborder rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[10px] uppercase tracking-wider">GST Compliance</span>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px]">{sup.gst_number || 'UNREGISTERED'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">
                {modalType === 'add' ? 'Register New Vendor' : 'Update Vendor Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Supplier / Corporate Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Contact Number</label>
                  <input 
                    type="text" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">GST Registration Number</label>
                  <input 
                    type="text" 
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="input-field" 
                    placeholder="e.g. 36AAAAA1111A1Z1"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Billing Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3} 
                    className="input-field resize-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
