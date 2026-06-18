import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, X, Tag, Sliders, Box } from 'lucide-react';

interface Product {
  id: number;
  product_name: string;
  category: string;
  material: string;
  dimensions: string;
  price: number;
  quantity: number;
  description: string;
  images: string[];
}

const Products: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Modals
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Sofa',
    material: '',
    dimensions: '',
    price: '',
    quantity: '0',
    description: '',
    purchase_price: '',
    supplier_id: '',
    reorder_level: '5',
    imageUrl: ''
  });

  const resolveProductImage = (images?: string[]) => {
    if (!images || images.length === 0) return '';
    const first = images[0];
    if (first.startsWith('http') || first.startsWith('/uploads')) {
      if (first.startsWith('/uploads')) return `http://localhost:5000${first}`;
      return first;
    }
    return first;
  };

  const loadProducts = async () => {
    try {
      let url = `/products?search=${search}`;
      if (categoryFilter) {
        url += `&category=${categoryFilter}`;
      }
      const data = await apiFetch(url);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await apiFetch('/products/suppliers/all');
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setModalType('add');
    setFormData({
      product_name: '',
      category: 'Sofa',
      material: '',
      dimensions: '',
      price: '',
      quantity: '0',
      description: '',
      purchase_price: '',
      supplier_id: suppliers[0]?.id.toString() || '',
      reorder_level: '5',
      imageUrl: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = async (prod: Product) => {
    try {
      const details = await apiFetch(`/products/${prod.id}`);
      setModalType('edit');
      setSelectedProduct(details);
      setFormData({
        product_name: details.product_name,
        category: details.category,
        material: details.material || '',
        dimensions: details.dimensions || '',
        price: details.price.toString(),
        quantity: details.quantity.toString(),
        description: details.description || '',
        purchase_price: details.inventory?.purchase_price?.toString() || '',
        supplier_id: details.inventory?.supplier_id?.toString() || '',
        reorder_level: details.inventory?.reorder_level?.toString() || '5',
        imageUrl: details.images?.[0] || ''
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>, productId: number) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const data = new FormData();
    data.append('product_image', file);
    setUploadingImage(true);

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dh_token')}` },
        body: data
      });
      if (response.ok) {
        alert('Product image uploaded successfully.');
        const updated = await response.json();
        setFormData(prev => ({
          ...prev,
          imageUrl: updated.product.images[0] || ''
        }));
        loadProducts();
      } else {
        alert('Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        images: formData.imageUrl ? [formData.imageUrl] : []
      };
      if (modalType === 'add') {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        if (!selectedProduct) return;
        await apiFetch(`/products/${selectedProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      alert('Error saving product');
    }
  };

  const categories = [
    { value: '', label: 'All Items' },
    { value: 'Sofa', label: 'Sofa' },
    { value: 'Dining Table', label: 'Dining' },
    { value: 'Chair', label: 'Chairs' },
    { value: 'Bed', label: 'Beds' },
    { value: 'Wardrobe', label: 'Wardrobes' },
    { value: 'Office Furniture', label: 'Office' },
    { value: 'Interior Materials', label: 'Materials' }
  ];

  const canManage = ['admin', 'inventory_manager'].includes(user?.role || '');

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button 
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                categoryFilter === cat.value 
                  ? 'bg-gold-500 text-white shadow-sm' 
                  : 'bg-slate-50 dark:bg-darkbg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkborder'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded-xl text-xs w-48 focus:outline-none focus:ring-1 focus:ring-gold-500 transition"
            />
          </div>
          {canManage && (
            <button onClick={handleOpenAdd} className="btn-primary text-xs py-2">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(prod => (
          <div key={prod.id} className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
            
            {/* Gallery Image placeholder or actual */}
            <div className="h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative border-b border-slate-100 dark:border-darkborder overflow-hidden">
              {prod.images && prod.images.length > 0 ? (
                <img 
                  src={resolveProductImage(prod.images)} 
                  alt={prod.product_name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-slate-300 font-serif text-lg tracking-widest uppercase font-bold ${prod.images && prod.images.length > 0 ? 'hidden' : ''}`}>
                D & H DESIGN
              </span>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/60 text-white text-[9px] font-semibold rounded uppercase tracking-wider">
                {prod.category}
              </span>
            </div>

            {/* Product description info */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-sm dark:text-white leading-snug">{prod.product_name}</h3>
                <span className="text-[10px] text-slate-400 block truncate">{prod.dimensions} • {prod.material}</span>
                <p className="text-xs text-slate-500 leading-normal line-clamp-2 pt-1">{prod.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-darkborder/50">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Selling Price</span>
                    <span className="text-sm font-bold text-gold-600 dark:text-gold-400">₹{prod.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Stock level</span>
                    <span className={`text-xs font-bold ${prod.quantity <= 3 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {prod.quantity} units
                    </span>
                  </div>
                </div>
                
                {/* Stock valuation highlight box */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-darkbg/40 p-2 rounded-xl border border-slate-100 dark:border-darkborder/40 text-xs mt-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Capital Value Tied In Stock</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ₹{(prod.price * prod.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Buttons */}
            {canManage && (
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-darkbg/40 border-t border-slate-100 dark:border-darkborder flex justify-end gap-3 text-xs">
                <button 
                  onClick={() => handleOpenEdit(prod)}
                  className="text-slate-500 hover:text-gold-600 flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(prod.id)}
                    className="text-slate-500 hover:text-red-500 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">
                {modalType === 'add' ? 'Add New Product' : 'Modify Product Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Product Name *</label>
                  <input 
                    type="text" 
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="Sofa">Sofa</option>
                    <option value="Dining Table">Dining Table</option>
                    <option value="Chair">Chair</option>
                    <option value="Bed">Bed</option>
                    <option value="Wardrobe">Wardrobe</option>
                    <option value="Office Furniture">Office Furniture</option>
                    <option value="Interior Materials">Interior Materials</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Material Type</label>
                  <input 
                    type="text" 
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Dimensions</label>
                  <input 
                    type="text" 
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="input-field" 
                    placeholder="e.g. 72 W x 30 D x 32 H"
                  />
                </div>

                {/* Inventory details only editable or required for new additions */}
                {modalType === 'add' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Initial Stock Quantity</label>
                      <input 
                        type="number" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="input-field" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Estimated Purchase Cost (₹)</label>
                      <input 
                        type="number" 
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        className="input-field" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Default Supplier</label>
                      <select 
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        className="input-field"
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Low Stock Reorder Alert Level</label>
                      <input 
                        type="number" 
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                        className="input-field" 
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Product Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3} 
                    className="input-field resize-none" 
                  />
                </div>

                <div className="col-span-2 space-y-1 border-t border-slate-100 dark:border-darkborder pt-3">
                  <label className="text-xs font-semibold text-slate-500">Product Image URL</label>
                  <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="input-field animate-fade-in" 
                    placeholder="https://example.com/image.jpg or local path"
                  />
                </div>

                {modalType === 'edit' && selectedProduct && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block">Or Upload Local Image File</label>
                    <div className="relative border border-dashed border-slate-200 dark:border-darkborder hover:border-gold-500 dark:hover:border-gold-500 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition">
                      <Plus className="w-4 h-4 text-gold-500" />
                      <span className="text-xs text-slate-500 font-semibold">
                        {uploadingImage ? 'Uploading Image...' : 'Choose Product Image File'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleUploadProductImage(e, selectedProduct.id)}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        disabled={uploadingImage}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
