import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Projects from './pages/Projects';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Quotations from './pages/Quotations';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Employees from './pages/Employees';
import Reports from './pages/Reports';

// Route guards
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-darkbg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-slate-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // redirect unauthorized to dashboard
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" replace />} />
        
        {/* Core Authenticated Routes */}
        <Route path="/" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        
        <Route path="/customers" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'designer', 'sales_executive', 'accountant']}><Customers /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/projects" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'designer']}><Projects /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/products" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'designer', 'sales_executive', 'inventory_manager']}><Products /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/inventory" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'inventory_manager']}><Inventory /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/suppliers" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'inventory_manager']}><Suppliers /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/quotations" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'sales_executive']}><Quotations /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/orders" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'sales_executive', 'inventory_manager']}><Orders /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/invoices" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'accountant']}><Invoices /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/employees" element={
          <AuthenticatedLayout>
            <RoleRoute allowedRoles={['admin', 'accountant']}><Employees /></RoleRoute>
          </AuthenticatedLayout>
        } />

        <Route path="/reports" element={<AuthenticatedLayout><Reports /></AuthenticatedLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
