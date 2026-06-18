import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, FolderKanban, Sofa, PackageCheck, 
  Truck, ClipboardList, Receipt, Landmark, HardHat, FileBarChart2 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  // Determine allowed links based on role
  const allLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'designer', 'sales_executive', 'inventory_manager', 'accountant'] },
    { to: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'designer', 'sales_executive', 'accountant'] },
    { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'designer'] },
    { to: '/products', label: 'Products Catalog', icon: Sofa, roles: ['admin', 'designer', 'sales_executive', 'inventory_manager'] },
    { to: '/inventory', label: 'Inventory', icon: PackageCheck, roles: ['admin', 'inventory_manager'] },
    { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'inventory_manager'] },
    { to: '/quotations', label: 'Quotations', icon: ClipboardList, roles: ['admin', 'sales_executive'] },
    { to: '/orders', label: 'Orders', icon: Receipt, roles: ['admin', 'sales_executive', 'inventory_manager'] },
    { to: '/invoices', label: 'Invoices', icon: Landmark, roles: ['admin', 'accountant'] },
    { to: '/employees', label: 'Employees', icon: HardHat, roles: ['admin', 'accountant'] },
    { to: '/reports', label: 'Reports & Analytics', icon: FileBarChart2, roles: ['admin', 'designer', 'sales_executive', 'inventory_manager', 'accountant'] },
  ];

  const allowedLinks = allLinks.filter(link => link.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-darkborder bg-white dark:bg-[#151515] transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-darkborder">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-white font-serif font-bold text-lg">D</span>
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-wide text-sm dark:text-white">Design & Harmony</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">ERP System</span>
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-3 rounded-xl bg-slate-50 dark:bg-darkbg border border-slate-100 dark:border-darkborder flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-100 dark:bg-gold-950 flex items-center justify-center text-gold-700 dark:text-gold-300 font-bold uppercase text-sm">
            {user.name[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate dark:text-white">{user.name}</span>
            <span className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold uppercase tracking-wider truncate">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {allowedLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-sm shadow-gold-500/20' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Version Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-darkborder text-center">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider">VERSION 1.0.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
