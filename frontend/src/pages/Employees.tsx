import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardHat, Plus, Edit3, X, Calendar, DollarSign, Award, CheckCircle, HelpCircle } from 'lucide-react';

interface Employee {
  id: number;
  employee_name: string;
  role: string;
  contact_number: string;
  email: string;
  joining_date: string;
  salary: number;
  attendance_summary: {
    present: number;
    absent: number;
    leave: number;
  };
  performance_rating: number;
}

const Employees: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    role: '',
    contact_number: '',
    email: '',
    joining_date: '',
    salary: '',
    performance_rating: '5.0'
  });

  const loadEmployees = async () => {
    try {
      const data = await apiFetch('/employees');
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({
        employee_name: '',
        role: '',
        contact_number: '',
        email: '',
        joining_date: '',
        salary: '',
        performance_rating: '5.0'
      });
      loadEmployees();
    } catch (err) {
      alert('Error registering employee');
    }
  };

  const handleMarkAttendance = async (id: number, status: 'present' | 'absent' | 'leave') => {
    try {
      await apiFetch(`/employees/${id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      loadEmployees();
      alert(`Attendance logged successfully.`);
    } catch (err) {
      alert('Failed to log attendance');
    }
  };

  const canManage = user?.role === 'admin';

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
          <h2 className="font-serif text-lg font-bold dark:text-white">Employee Roster & Performance Desk</h2>
          <p className="text-xs text-slate-400">Track designer assignments, salary payouts, monthly attendance logs and performance metrics</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map(emp => {
          const totalDays = (emp.attendance_summary?.present || 0) + (emp.attendance_summary?.absent || 0) + (emp.attendance_summary?.leave || 0);
          const attendancePercentage = totalDays > 0 
            ? Math.round(((emp.attendance_summary?.present || 0) / totalDays) * 100) 
            : 100;

          return (
            <div key={emp.id} className="p-5 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm flex flex-col justify-between gap-5 hover:shadow-md transition">
              
              {/* Profile Card Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-100 dark:bg-gold-950/20 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold uppercase">
                    {emp.employee_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm dark:text-white">{emp.employee_name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{emp.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs border-t border-slate-100 dark:border-darkborder/50 pt-3 dark:text-slate-200">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Salary Payout</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{emp.salary.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Joining Date</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{emp.joining_date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Performance Rating</span>
                    <span className="font-bold text-gold-600 dark:text-gold-400 flex items-center gap-0.5">
                      <Award className="w-3.5 h-3.5" /> {emp.performance_rating} / 5.0
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Attendance Rate</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{attendancePercentage}% ({emp.attendance_summary?.present || 0} days)</span>
                  </div>
                </div>
              </div>

              {/* Attendance quick logs button */}
              {canManage && (
                <div className="bg-slate-50 dark:bg-darkbg/50 border border-slate-100 dark:border-darkborder p-2.5 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Log Daily Attendance</span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                    <button 
                      onClick={() => handleMarkAttendance(emp.id, 'present')}
                      className="py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition"
                    >
                      Present
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(emp.id, 'absent')}
                      className="py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                    >
                      Absent
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(emp.id, 'leave')}
                      className="py-1 rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 transition"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Register Employee Record</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Employee Name *</label>
                  <input 
                    type="text" 
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Corporate Designation Role *</label>
                  <input 
                    type="text" 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field" 
                    placeholder="e.g. Lead Designer / Accountant"
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Contact Number *</label>
                  <input 
                    type="text" 
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address *</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Monthly Salary (INR) *</label>
                  <input 
                    type="number" 
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Joining Date</label>
                  <input 
                    type="date" 
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
