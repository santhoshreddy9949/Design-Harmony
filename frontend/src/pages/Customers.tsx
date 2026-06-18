import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Edit2, Trash2, X, Phone, Mail, MapPin, DollarSign, Plus, ArrowUpRight } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  mobile_number: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  project_type: string;
  budget: number;
  notes: string;
  projects?: Array<{ id: number; project_name: string; status: string; progress_percentage: number }>;
  invoices?: Array<{ id: number; invoice_number: string; grand_total: number; payment_status: string }>;
}

const Customers: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
    project_type: 'Home Design',
    budget: '',
    notes: ''
  });

  const loadCustomers = async () => {
    try {
      const data = await apiFetch(`/customers?search=${search}`);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenDetails = async (cust: Customer) => {
    try {
      const details = await apiFetch(`/customers/${cust.id}`);
      setSelectedCustomer(details);
    } catch (err) {
      console.error('Failed to load details:', err);
    }
  };

  const handleOpenAdd = () => {
    setModalType('add');
    setFormData({
      name: '',
      mobile_number: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pin_code: '',
      project_type: 'Home Design',
      budget: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setModalType('edit');
    setFormData({
      name: cust.name,
      mobile_number: cust.mobile_number,
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      pin_code: cust.pin_code || '',
      project_type: cust.project_type || 'Home Design',
      budget: cust.budget ? cust.budget.toString() : '',
      notes: cust.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this customer record?')) return;
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      loadCustomers();
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await apiFetch('/customers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      } else {
        if (!selectedCustomer) return;
        await apiFetch(`/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadCustomers();
      // Reload details if selected
      if (selectedCustomer) {
        handleOpenDetails(selectedCustomer);
      }
    } catch (err: any) {
      alert(err.message || 'Error saving customer data');
    }
  };

  const canEdit = ['admin', 'sales_executive', 'designer'].includes(user?.role || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
      
      {/* Customers List Section */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 transition"
            />
          </div>
          {canEdit && (
            <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-1.5 text-xs py-2">
              <UserPlus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map(cust => (
            <div 
              key={cust.id} 
              onClick={() => handleOpenDetails(cust)}
              className={`p-5 bg-white dark:bg-darkcard border rounded-2xl cursor-pointer hover:shadow-md transition duration-200 relative group flex flex-col justify-between h-44 ${
                selectedCustomer?.id === cust.id 
                  ? 'border-gold-500 dark:border-gold-500' 
                  : 'border-slate-200 dark:border-darkborder'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition">
                    {cust.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-gold-50 dark:bg-gold-950/20 text-gold-700 dark:text-gold-300 rounded font-semibold text-[10px]">
                    {cust.project_type}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.mobile_number}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[170px]">{cust.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.city}, {cust.state}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-darkborder/50">
                {canEdit && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(cust); }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-gold-600 dark:hover:text-gold-400"
                    title="Edit Record"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(cust.id); }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-red-500"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Detailed Pane */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl p-5 shadow-sm h-fit">
        {selectedCustomer ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-darkborder pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold dark:text-white">{selectedCustomer.name}</h2>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Customer ID: #{selectedCustomer.id}</span>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info fields */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Contact Profile</span>
              <div className="grid grid-cols-2 gap-3 dark:text-slate-200">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Mobile</span>
                  <span className="font-semibold">{selectedCustomer.mobile_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Email</span>
                  <span className="font-semibold truncate block">{selectedCustomer.email || 'None'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Address</span>
                  <span className="font-semibold leading-normal">{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pin_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Assigned Project Type</span>
                  <span className="font-semibold text-gold-600 dark:text-gold-400">{selectedCustomer.project_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Budget Allocated</span>
                  <span className="font-semibold text-gold-600 dark:text-gold-400">₹{selectedCustomer.budget ? selectedCustomer.budget.toLocaleString('en-IN') : '0'}</span>
                </div>
              </div>
            </div>

            {/* Custom Notes */}
            {selectedCustomer.notes && (
              <div className="p-3 bg-slate-50 dark:bg-darkbg border border-slate-100 dark:border-darkborder rounded-xl">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block mb-1">Administrative Notes</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"{selectedCustomer.notes}"</p>
              </div>
            )}

            {/* Project Milestones history */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Project Tracking History</span>
              {selectedCustomer.projects?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No design projects associated.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.projects?.map(proj => (
                    <div key={proj.id} className="p-3 border border-slate-100 dark:border-darkborder rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <span className="font-semibold dark:text-slate-200">{proj.project_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="badge-status bg-gold-50 dark:bg-gold-950/20 text-gold-700 dark:text-gold-300 text-[9px]">{proj.status}</span>
                          <span className="text-slate-400 text-[10px]">{proj.progress_percentage}% complete</span>
                        </div>
                      </div>
                      <a href={`/projects`} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-gold-600 dark:text-gold-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices list */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Invoices & Billings</span>
              {selectedCustomer.invoices?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No billings issued.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.invoices?.map(inv => (
                    <div key={inv.id} className="p-3 border border-slate-100 dark:border-darkborder rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold dark:text-slate-200">{inv.invoice_number}</span>
                        <span className="text-slate-400 block mt-0.5">₹{inv.grand_total.toLocaleString('en-IN')}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-semibold text-[9px] ${
                        inv.payment_status === 'Paid' 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                          : inv.payment_status === 'Partially Paid' 
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            Select a customer card from the directory to display project details, payment lists, and address trackers.
          </div>
        )}
      </div>

      {/* Add / Edit Customer Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">
                {modalType === 'add' ? 'Create New Customer profile' : 'Update Customer profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Full Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Mobile Number *</label>
                  <input 
                    type="text" 
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="input-field" 
                    required 
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project Type *</label>
                  <select 
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Home Design">Home Design</option>
                    <option value="Office Design">Office Design</option>
                    <option value="Custom Furniture">Custom Furniture</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Material Sales">Material Sales</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Site Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">City</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">State</label>
                  <input 
                    type="text" 
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Estimated Budget (₹)</label>
                  <input 
                    type="number" 
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project Requirements & Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
