import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, FolderKanban, ShoppingCart, IndianRupee, AlertTriangle, 
  ArrowUpRight, Clock, Package 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid 
} from 'recharts';

interface DashboardStats {
  totalCustomers: number;
  activeProjects: number;
  completedProjects: number;
  pendingOrders: number;
  monthlyRevenue: number;
  lowStockCount: number;
  lowStockAlerts: Array<{ product_id: number; product_name: string; current_quantity: number; reorder_level: number }>;
  recentActivities: Array<{ title: string; desc: string; time: string }>;
  salesTrend: Array<{ name: string; sales: number }>;
  revenueTrend: Array<{ name: string; revenue: number }>;
}

const Dashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await apiFetch('/reports/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold dark:text-white">Business Dashboard</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time overview of Design & Harmony ERP</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Customers */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Customers</span>
            <h3 className="text-2xl font-bold dark:text-white">{stats.totalCustomers}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Projects</span>
            <h3 className="text-2xl font-bold dark:text-white">{stats.activeProjects}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold-50 dark:bg-gold-950/20 flex items-center justify-center text-gold-600 dark:text-gold-400">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <h3 className="text-2xl font-bold dark:text-white">{stats.pendingOrders}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
            <h3 className="text-2xl font-bold text-gold-600 dark:text-gold-400">₹{stats.monthlyRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold-100/50 dark:bg-gold-950/30 flex items-center justify-center text-gold-700 dark:text-gold-300">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytical Trends (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold dark:text-white">Revenue Growth Trend (₹)</span>
            <span className="text-xs text-slate-400">Monthly</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a880" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c5a880" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1e1e1e', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  labelClassName="font-bold text-gold-400"
                />
                <Area type="monotone" dataKey="revenue" stroke="#c5a880" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold dark:text-white">Weekly Sales Volume (₹)</span>
            <span className="text-xs text-slate-400">Daily</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesTrend}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1e1e1e', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  labelClassName="font-bold text-gold-400"
                />
                <Bar dataKey="sales" fill="#b88d3d" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock warnings & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold dark:text-white">Low Stock Warnings ({stats.lowStockCount})</span>
            </div>
            <a href="/inventory" className="text-xs text-gold-600 hover:underline flex items-center gap-0.5">
              Manage Stock <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-darkborder text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5">Product Name</th>
                  <th className="py-2.5">Current Stock</th>
                  <th className="py-2.5">Reorder Limit</th>
                  <th className="py-2.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkborder">
                {stats.lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">
                      All products are fully stocked.
                    </td>
                  </tr>
                ) : (
                  stats.lowStockAlerts.map(prod => (
                    <tr key={prod.product_id} className="dark:text-slate-200">
                      <td className="py-3 font-medium flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        {prod.product_name}
                      </td>
                      <td className="py-3 font-semibold text-red-500">{prod.current_quantity}</td>
                      <td className="py-3 text-slate-500">{prod.reorder_level}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold rounded-full text-[10px]">
                          Reorder Required
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities list */}
        <div className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-bold dark:text-white">Recent Activities</span>
          </div>

          <div className="relative border-l border-slate-100 dark:border-darkborder pl-4 space-y-5 text-xs py-2 ml-2">
            {stats.recentActivities.map((act, index) => (
              <div key={index} className="relative space-y-1">
                {/* Timeline circle dot */}
                <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-gold-500 border-2 border-white dark:border-darkcard" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{act.title}</span>
                <p className="text-slate-500 leading-normal">{act.desc}</p>
                <span className="text-[10px] text-slate-400 block">{new Date(act.time).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
