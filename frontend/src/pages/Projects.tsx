import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, Clock, Calendar, CheckSquare, Square, 
  Upload, FileText, Plus, Check, ChevronRight, MessageSquare, X 
} from 'lucide-react';

interface Milestone {
  id: number;
  title: string;
  date: string;
  completed: boolean;
}

interface Project {
  id: number;
  customer_id: number;
  customer_name: string;
  project_name: string;
  project_type: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  assigned_designer_id: number | null;
  designer_name: string;
  status: 'New' | 'Designing' | 'Approval Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  progress_percentage: number;
  timeline_milestones: Milestone[];
  designs: string[];
  documents: string[];
  notes: string;
}

interface Customer {
  id: number;
  name: string;
}

const Projects: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [designers, setDesigners] = useState<Array<{ id: number; name: string }>>([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    project_name: '',
    project_type: 'Home Design',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    assigned_designer_id: '',
    notes: ''
  });

  const loadProjects = async () => {
    try {
      const url = statusFilter ? `/projects?status=${statusFilter}` : '/projects';
      const data = await apiFetch(url);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadHelpers = async () => {
    try {
      const custs = await apiFetch('/customers');
      setCustomers(custs);
      
      // Load designers
      const res = await fetch('http://localhost:5000/api/reports/analytics?type=customer', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dh_token')}` }
      });
      // In json db we can fetch from a generic users list
      const allUsersRes = await fetch('http://localhost:5000/api/customers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dh_token')}` }
      });
      // Let's hardcode designers list for frontend options or load them.
      // A designer role is typically filtered. Let's just fetch mock users for designers.
      setDesigners([
        { id: 2, name: 'Sarah Designer' },
        { id: 1, name: 'Admin User' }
      ]);
    } catch (err) {
      console.error('Failed to load dropdown support lists:', err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadHelpers();
  }, [statusFilter]);

  const handleOpenDetails = async (proj: Project) => {
    try {
      const details = await apiFetch(`/projects/${proj.id}`);
      setSelectedProject(details);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowAddModal(false);
      loadProjects();
    } catch (err) {
      alert('Error creating project');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedProject) return;
    try {
      const updated = await apiFetch(`/projects/${selectedProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setSelectedProject(updated);
      loadProjects();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUpdateProgress = async (progress_percentage: number) => {
    if (!selectedProject) return;
    try {
      const updated = await apiFetch(`/projects/${selectedProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ progress_percentage })
      });
      setSelectedProject(updated);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (milestoneId: number) => {
    if (!selectedProject) return;
    
    const updatedMilestones = selectedProject.timeline_milestones.map(ms => 
      ms.id === milestoneId ? { ...ms, completed: !ms.completed } : ms
    );

    // Calculate new progress based on milestones
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    try {
      const updated = await apiFetch(`/projects/${selectedProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          timeline_milestones: updatedMilestones,
          progress_percentage: progress
        })
      });
      setSelectedProject(updated);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Design
  const handleUploadDesign = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const data = new FormData();
    data.append('design', file);

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProject.id}/upload-design`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dh_token')}` },
        body: data
      });
      if (response.ok) {
        alert('Design diagram successfully added to project.');
        const updated = await response.json();
        setSelectedProject(updated.project);
        loadProjects();
      } else {
        alert('File upload rejected. Check file type.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Doc
  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const data = new FormData();
    data.append('document', file);

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProject.id}/upload-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dh_token')}` },
        body: data
      });
      if (response.ok) {
        alert('Project PDF document successfully added.');
        const updated = await response.json();
        setSelectedProject(updated.project);
        loadProjects();
      } else {
        alert('File upload rejected.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
      
      {/* Project listing & filters */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 rounded-2xl shadow-sm">
          <div className="flex gap-2">
            {['', 'New', 'Designing', 'In Progress', 'Completed'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === status 
                    ? 'bg-gold-500 text-white shadow-sm' 
                    : 'bg-slate-50 dark:bg-darkbg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkborder'
                }`}
              >
                {status || 'All Status'}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs py-2">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>

        {/* Project cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(proj => {
            const hasDesign = proj.designs && proj.designs.length > 0;
            const coverUrl = hasDesign ? `http://localhost:5000${proj.designs[0]}` : null;
            
            // Premium gradient based on project type
            let gradientClass = 'from-purple-600 to-pink-400';
            if (proj.project_type === 'Home Design') {
              gradientClass = 'from-blue-600/80 to-indigo-500/60';
            } else if (proj.project_type === 'Office Design') {
              gradientClass = 'from-emerald-600/80 to-teal-500/60';
            } else if (proj.project_type === 'Custom Furniture') {
              gradientClass = 'from-amber-600/80 to-orange-500/60';
            }

            return (
              <div 
                key={proj.id}
                onClick={() => handleOpenDetails(proj)}
                className={`bg-white dark:bg-darkcard border rounded-2xl cursor-pointer hover:shadow-md transition duration-200 flex flex-col overflow-hidden h-64 ${
                  selectedProject?.id === proj.id 
                    ? 'border-gold-500 ring-1 ring-gold-500/30' 
                    : 'border-slate-200 dark:border-darkborder'
                }`}
              >
                {/* Project Cover Image / Gradient Banner */}
                <div className="h-28 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {hasDesign ? (
                    <img 
                      src={coverUrl!} 
                      alt={proj.project_name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-3 text-white ${hasDesign ? 'hidden' : ''}`}>
                    <FolderKanban className="w-8 h-8 text-white/50 mb-1" />
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-75">{proj.project_type}</span>
                  </div>
                  
                  {/* Floating Status Badge */}
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-slate-900/60 backdrop-blur-sm text-white border border-white/10 shadow-sm uppercase tracking-wider">
                    {proj.status}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm dark:text-white truncate" title={proj.project_name}>
                      {proj.project_name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{proj.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pt-1">
                      <span className="text-gold-600 dark:text-gold-400 font-bold">
                        Budget: ₹{proj.budget ? proj.budget.toLocaleString('en-IN') : '0'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{proj.start_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Slider Display */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-50 dark:border-darkborder/50">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{proj.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-gold-600 to-gold-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${proj.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project details panel */}
      <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl p-5 shadow-sm h-fit space-y-6">
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-darkborder pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold dark:text-white">{selectedProject.project_name}</h2>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Designer Assigned: {selectedProject.designer_name}</span>
              </div>
            </div>

            {/* Status Change Buttons */}
            <div className="space-y-2">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Project Stage Status</span>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                {['New', 'Designing', 'Approval Pending', 'In Progress', 'Completed', 'Cancelled'].map(st => (
                  <button 
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`py-1 rounded border text-center transition ${
                      selectedProject.status === st 
                        ? 'bg-gold-500 text-white border-gold-500' 
                        : 'border-slate-100 dark:border-darkborder dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Progress Percentage</span>
                <span className="text-gold-600 dark:text-gold-400">{selectedProject.progress_percentage}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={selectedProject.progress_percentage}
                onChange={(e) => handleUpdateProgress(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gold-500" 
              />
            </div>

            {/* Milestones list */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Execution Milestones</span>
              <div className="space-y-2.5">
                {selectedProject.timeline_milestones?.map(ms => (
                  <div 
                    key={ms.id} 
                    onClick={() => handleToggleMilestone(ms.id)}
                    className="flex items-center gap-3 cursor-pointer select-none text-xs dark:text-slate-200"
                  >
                    {ms.completed ? (
                      <CheckSquare className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <div className="flex-1 flex justify-between">
                      <span className={ms.completed ? 'line-through text-slate-400' : 'font-medium'}>{ms.title}</span>
                      {ms.date && <span className="text-slate-400 text-[10px]">{ms.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Designs & Drawings */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-darkborder">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Designs & Moodboards</span>
              
              {/* File upload input */}
              <div className="relative border border-dashed border-slate-200 dark:border-darkborder hover:border-gold-500 dark:hover:border-gold-500 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-gold-500" />
                <span className="text-xs text-slate-500 font-semibold">Upload Design Drawing</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleUploadDesign}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {selectedProject.designs?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {selectedProject.designs.map((img, i) => (
                    <a key={i} href={`http://localhost:5000${img}`} target="_blank" rel="noreferrer" className="block relative border border-slate-100 dark:border-darkborder rounded-lg overflow-hidden h-14 bg-slate-50">
                      <img src={`http://localhost:5000${img}`} alt="Blueprint layout" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-darkborder">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Contracts & PDFs</span>
              
              <div className="relative border border-dashed border-slate-200 dark:border-darkborder hover:border-gold-500 dark:hover:border-gold-500 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition">
                <FileText className="w-4 h-4 text-gold-500" />
                <span className="text-xs text-slate-500 font-semibold">Attach Document PDF</span>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleUploadDoc}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {selectedProject.documents?.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {selectedProject.documents.map((doc, i) => (
                    <a 
                      key={i} 
                      href={`http://localhost:5000${doc}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 border border-slate-100 dark:border-darkborder rounded-xl flex items-center gap-2 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate flex-1">Document Attachment #{i + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            Select an active project card to update milestones, drag execution sliders, or upload blueprints and contract sheets.
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50 dark:bg-darkbg">
              <h3 className="font-serif font-bold dark:text-white">Create New Design Project</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Associated Customer *</label>
                  <select 
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project Name *</label>
                  <input 
                    type="text" 
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    className="input-field" 
                    required 
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
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Allocated Budget (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">End Date</label>
                  <input 
                    type="date" 
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Assign Lead Designer</label>
                  <select 
                    value={formData.assigned_designer_id}
                    onChange={(e) => setFormData({ ...formData, assigned_designer_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">-- Choose Designer --</option>
                    {designers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2} 
                    className="input-field resize-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-darkborder mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Start Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
