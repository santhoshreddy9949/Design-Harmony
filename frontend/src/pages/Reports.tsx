import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';

interface SalesRow {
  invoice_number: string;
  customer_name: string;
  issue_date: string;
  sub_total: number;
  tax: number;
  total: number;
  status: string;
}

interface InventoryRow {
  product_name: string;
  category: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
  supplier_name: string;
}

interface ProjectRow {
  project_name: string;
  customer_name: string;
  designer_name: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
}

interface CustomerRow {
  customer_name: string;
  email: string;
  mobile: string;
  city: string;
  projects_count: number;
  total_spend: number;
}

const Reports: React.FC = () => {
  const { apiFetch } = useAuth();
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'projects' | 'customer'>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryRow[]>([]);
  const [projectData, setProjectData] = useState<ProjectRow[]>([]);
  const [customerData, setCustomerData] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/analytics?type=${reportType}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      
      const data = await apiFetch(url);

      if (reportType === 'sales') setSalesData(data);
      else if (reportType === 'inventory') setInventoryData(data);
      else if (reportType === 'projects') setProjectData(data);
      else if (reportType === 'customer') setCustomerData(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text('DESIGN & HARMONY ERP', 20, 18);

    doc.setTextColor(197, 168, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`BUSINESS SUMMARY REPORT: ${reportType.toUpperCase()}`, 20, 26);
    doc.text(`Date Run: ${new Date().toLocaleDateString()}`, 20, 32);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    if (reportType === 'sales') {
      doc.text('Invoice Ref', 20, 55);
      doc.text('Customer', 55, 55);
      doc.text('Issue Date', 95, 55);
      doc.text('GST Paid', 125, 55);
      doc.text('Total (INR)', 155, 55);
      doc.line(20, 58, 190, 58);

      doc.setFont('helvetica', 'normal');
      let y = 65;
      salesData.forEach((row) => {
        doc.text(row.invoice_number, 20, y);
        doc.text(row.customer_name, 55, y);
        doc.text(row.issue_date, 95, y);
        doc.text(`INR ${row.tax.toLocaleString()}`, 125, y);
        doc.text(`INR ${row.total.toLocaleString()}`, 155, y);
        y += 9;
      });
    } else if (reportType === 'inventory') {
      doc.text('Product SKU', 20, 55);
      doc.text('Category', 75, 55);
      doc.text('Stock', 115, 55);
      doc.text('Cost (INR)', 135, 55);
      doc.text('Retail (INR)', 160, 55);
      doc.line(20, 58, 190, 58);

      doc.setFont('helvetica', 'normal');
      let y = 65;
      inventoryData.forEach((row) => {
        doc.text(row.product_name.substring(0, 22), 20, y);
        doc.text(row.category, 75, y);
        doc.text(row.stock.toString(), 115, y);
        doc.text(row.purchase_price.toString(), 135, y);
        doc.text(row.selling_price.toString(), 160, y);
        y += 9;
      });
    } else if (reportType === 'projects') {
      doc.text('Project Name', 20, 55);
      doc.text('Client Name', 75, 55);
      doc.text('Status', 125, 55);
      doc.text('Budget (INR)', 155, 55);
      doc.line(20, 58, 190, 58);

      doc.setFont('helvetica', 'normal');
      let y = 65;
      projectData.forEach((row) => {
        doc.text(row.project_name.substring(0, 22), 20, y);
        doc.text(row.customer_name, 75, y);
        doc.text(row.status, 125, y);
        doc.text(`INR ${row.budget.toLocaleString()}`, 155, y);
        y += 9;
      });
    } else {
      doc.text('Client Profile', 20, 55);
      doc.text('City', 75, 55);
      doc.text('Projects count', 115, 55);
      doc.text('Total spend (INR)', 145, 55);
      doc.line(20, 58, 190, 58);

      doc.setFont('helvetica', 'normal');
      let y = 65;
      customerData.forEach((row) => {
        doc.text(row.customer_name, 20, y);
        doc.text(row.city || 'N/A', 75, y);
        doc.text(row.projects_count.toString(), 115, y);
        doc.text(`INR ${row.total_spend.toLocaleString()}`, 145, y);
        y += 9;
      });
    }

    doc.save(`Harmony_Report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Parameter Selection panel */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-darkborder">
          <h2 className="font-serif text-base font-bold dark:text-white">Reports & Financial Summary</h2>
          <button onClick={handleDownloadPDF} className="btn-primary text-xs py-1.5 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Save PDF Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Report Focus Category</label>
            <select 
              value={reportType}
              onChange={(e: any) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="sales">Revenue & Invoicing</option>
              <option value="inventory">Warehouse Inventory Valuation</option>
              <option value="projects">Project Milestones Tracker</option>
              <option value="customer">Client Expenditure Summary</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">From (Start Date)</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">To (End Date)</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field" 
            />
          </div>

          <div className="flex items-end">
            <button onClick={fetchReport} className="btn-secondary w-full py-2 flex items-center justify-center gap-1 text-xs">
              Refresh Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Report data table print layout */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            {/* Sales Table */}
            {reportType === 'sales' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-darkbg text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-darkborder">
                    <th className="px-6 py-3.5">Invoice Number</th>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Billed Date</th>
                    <th className="px-6 py-3.5">Tax (GST) Paid</th>
                    <th className="px-6 py-3.5">Grand Total</th>
                    <th className="px-6 py-3.5">Paid Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                  {salesData.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-bold">{row.invoice_number}</td>
                      <td className="px-6 py-4 font-semibold">{row.customer_name}</td>
                      <td className="px-6 py-4 text-slate-500">{row.issue_date}</td>
                      <td className="px-6 py-4 text-slate-500">₹{row.tax.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{row.total.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`badge-status ${
                          row.status === 'Paid' 
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                            : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Inventory Table */}
            {reportType === 'inventory' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-darkbg text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-darkborder">
                    <th className="px-6 py-3.5">Product Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Stock Count</th>
                    <th className="px-6 py-3.5">Purchase Cost</th>
                    <th className="px-6 py-3.5">Retail Value</th>
                    <th className="px-6 py-3.5">Supplier Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                  {inventoryData.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-semibold">{row.product_name}</td>
                      <td className="px-6 py-4 text-slate-500">{row.category}</td>
                      <td className="px-6 py-4 font-bold">{row.stock} units</td>
                      <td className="px-6 py-4 text-slate-500">₹{row.purchase_price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gold-600 dark:text-gold-400 font-bold">₹{row.selling_price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-slate-500">{row.supplier_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Project Table */}
            {reportType === 'projects' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-darkbg text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-darkborder">
                    <th className="px-6 py-3.5">Project Name</th>
                    <th className="px-6 py-3.5">Client Name</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Milestone progress</th>
                    <th className="px-6 py-3.5">Allocated Budget</th>
                    <th className="px-6 py-3.5">Start Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                  {projectData.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-semibold">{row.project_name}</td>
                      <td className="px-6 py-4 text-slate-500">{row.customer_name}</td>
                      <td className="px-6 py-4 font-bold">{row.status}</td>
                      <td className="px-6 py-4 text-slate-500">{row.progress}% complete</td>
                      <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{row.budget.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-slate-500">{row.start_date || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Customer Expenditure Table */}
            {reportType === 'customer' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-darkbg text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-darkborder">
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Mobile</th>
                    <th className="px-6 py-3.5">City</th>
                    <th className="px-6 py-3.5">Projects Count</th>
                    <th className="px-6 py-3.5">Cumulative Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-darkborder dark:text-slate-200">
                  {customerData.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-semibold">{row.customer_name}</td>
                      <td className="px-6 py-4 text-slate-500">{row.email || 'None'}</td>
                      <td className="px-6 py-4 text-slate-500">{row.mobile}</td>
                      <td className="px-6 py-4 text-slate-500">{row.city || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-500">{row.projects_count} projects</td>
                      <td className="px-6 py-4 font-bold text-gold-600 dark:text-gold-400">₹{row.total_spend.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
