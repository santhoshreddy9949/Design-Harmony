import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, MessageSquare, X, Send, Upload, ChevronRight, Image as ImageIcon, Check } from 'lucide-react';

interface Project {
  id: number;
  project_name: string;
  designs: string[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const AiBot: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'generate'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your D&H AI Design Assistant. I can help recommend furniture styles, check product stock levels, or generate interactive room designs. What are we designing today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generator state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('modern_luxury');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [genProgress, setGenProgress] = useState(0);
  const [generatedDesignUrl, setGeneratedDesignUrl] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProjectsList = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/projects');
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load projects inside AI bot:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjectsList();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // AI Responses Logic
    setTimeout(() => {
      let aiText = "I'm analyzing your request. We have premium custom materials and furniture catalogs ready to fulfill this specification!";
      const prompt = textToSend.toLowerCase();

      if (prompt.includes('sofa') || prompt.includes('couch') || prompt.includes('living room')) {
        aiText = "For living room seating, we highly recommend our seeded **Royal Velvet Chesterfield Sofa** (Selling Price: ₹85,000). It features premium velvet tufting and solid teak legs that bring out unmatched elegance. Would you like to check its stock details in the catalog?";
      } else if (prompt.includes('dining') || prompt.includes('table')) {
        aiText = "Our top dining choice is the **Minimalist Oak Dining Table** (₹62,000) made of solid oak wood. It pairs perfectly with contemporary or Scandinavian styling. You can view it under the Products directory.";
      } else if (prompt.includes('margin') || prompt.includes('profit') || prompt.includes('expensive')) {
        aiText = "Our highest grossing item is the **Royal Velvet Chesterfield Sofa** at ₹85,000. It has a default purchase cost of ₹51,000, bringing a profit margin of ₹34,000 (40% mark-up). Chesterfield sofas are currently leading our customer orders!";
      } else if (prompt.includes('stock') || prompt.includes('inventory') || prompt.includes('warning')) {
        aiText = "Current critical stock levels:\n- **Minimalist Oak Dining Table**: 4 units remaining\n- **Luxury Tufted King Bed**: 3 units remaining (Low stock alert threshold is 5).\n\nYou can head to the Warehouse Stock Control tab to initiate an intake adjustment.";
      } else if (prompt.includes('color') || prompt.includes('paint') || prompt.includes('theme')) {
        aiText = "For home designs, warm neutral shades (cream, soft beige) paired with charcoal grey panel inlays look exceptional. Golden or brass accent trims (like our **Brass Inlay Wall Panels** at ₹12,000) raise room contrast and look highly premium.";
      } else if (prompt.includes('project') || prompt.includes('aditya') || prompt.includes('nisha')) {
        aiText = "We have 2 active design projects running: \n1. **Aditya Reddy Villa Interior** (45% Complete, Stage: In Progress)\n2. **Nisha Sharma 3BHK Renovation** (15% Complete, Stage: Designing)\n\nYou can view milestones, timelines, and attach structural floor designs on the Projects list view.";
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedDesignUrl(null);
    }
  };

  const triggerGeneration = () => {
    if (!uploadFile) {
      alert('Please upload a room/layout photo first.');
      return;
    }

    setIsGenerating(true);
    setGenProgress(10);
    setGenStep('AI scanning room boundaries & spatial depth...');

    // Progress updates
    const steps = [
      { progress: 30, text: 'Mapping room boundaries & ceiling coordinate vectors...' },
      { progress: 60, text: 'Correcting light source reflection angles...' },
      { progress: 85, text: `Applying custom textures for '${selectedStyle.replace('_', ' ')}' style...` },
      { progress: 100, text: 'Rendering high-definition environment output...' }
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setGenProgress(s.progress);
        setGenStep(s.text);
        if (s.progress === 100) {
          setTimeout(() => {
            setIsGenerating(false);
            setGeneratedDesignUrl(`/images/ai_designs/${selectedStyle}.png`);
          }, 600);
        }
      }, (idx + 1) * 1200);
    });
  };

  const handleSaveToProject = async () => {
    if (!selectedProjectId || !generatedDesignUrl) return;
    setIsSaving(true);
    try {
      // Load current project details to append designs
      const proj = projects.find(p => p.id === parseInt(selectedProjectId));
      if (!proj) throw new Error('Project not found');

      const currentDesigns = proj.designs || [];
      const updatedDesigns = [generatedDesignUrl, ...currentDesigns];

      await apiFetch(`/projects/${selectedProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({ designs: updatedDesigns })
      });

      alert(`AI Design synced! The generated layout has been added to "${proj.project_name}".`);
      loadProjectsList();
    } catch (err) {
      console.error(err);
      alert('Failed to sync design to project.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 relative border border-white/20"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-fade-in" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border border-white rounded-full" />
          </div>
        )}
      </button>

      {/* Slide-out Tray Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] sm:w-[420px] h-[550px] bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in backdrop-blur-md">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gold-500/10 rounded-lg border border-gold-500/30">
                <Sparkles className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm tracking-wide">Design & Harmony AI</h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Online Consultant
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-50 dark:bg-darkbg border-b border-slate-200 dark:border-darkborder">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'chat' 
                  ? 'text-gold-600 dark:text-gold-400 border-b-2 border-gold-500 bg-white dark:bg-darkcard' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Ask AI Assistant
            </button>
            <button 
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'generate' 
                  ? 'text-gold-600 dark:text-gold-400 border-b-2 border-gold-500 bg-white dark:bg-darkcard' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" /> AI Design Generator
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 dark:bg-darkcard/50">
            
            {/* TAB 1: Chat Assistant */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-between gap-3">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-darkbg text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-darkborder/50'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span className="block text-[8px] opacity-50 text-right mt-1.5">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-1 text-[10px] no-scrollbar">
                  {[
                    { label: '🛋️ Sofa suggestion', text: 'Recommend a sofa style for my modern project.' },
                    { label: '📊 Stock warnings', text: 'Check inventory warnings and thresholds.' },
                    { label: '📈 Highest margin', text: 'What is our highest margin product?' },
                    { label: '🏡 Paint & colors', text: 'Suggest living room paint color ideas.' }
                  ].map((p, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendMessage(p.text)}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-darkbg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-darkborder whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="flex gap-2 items-center border-t border-slate-100 dark:border-darkborder/50 pt-2">
                  <input 
                    type="text" 
                    placeholder="Type design message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button 
                    onClick={() => handleSendMessage(chatInput)}
                    className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: AI Design Generator */}
            {activeTab === 'generate' && (
              <div className="space-y-4 text-xs">
                
                {/* 1. Upload Section */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">1. Upload Room Layout Image</span>
                  <div className="relative border border-dashed border-slate-200 dark:border-darkborder hover:border-gold-500 dark:hover:border-gold-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/50 dark:bg-darkbg/20">
                    {previewUrl ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-darkborder">
                        <img src={previewUrl} alt="Room layout input" className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            setPreviewUrl(null);
                            setGeneratedDesignUrl(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="font-semibold text-slate-500 text-xs">Click or Drop Room Photo</span>
                        <span className="text-[9px] text-slate-400">JPG, PNG, WEBP formats allowed</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                {/* 2. Style Select */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">2. Select Design Style</span>
                  <select 
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded-xl font-medium"
                  >
                    <option value="modern_luxury">Modern Luxury Theme (Velvet & Marble)</option>
                    <option value="scandi_chic">Scandinavian Chic (Natural Light Oak)</option>
                    <option value="industrial_loft">Industrial Loft Theme (Brick & Concrete)</option>
                    <option value="coastal_breeze">Coastal Breeze Theme (Airy Blue & Sandy linen)</option>
                  </select>
                </div>

                {/* 3. Action / Progress */}
                {!isGenerating && !generatedDesignUrl && (
                  <button 
                    onClick={triggerGeneration}
                    disabled={!uploadFile}
                    className="w-full btn-primary py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" /> AI Generate Design Layout
                  </button>
                )}

                {/* Generator Progress Loader */}
                {isGenerating && (
                  <div className="p-3 border border-slate-100 dark:border-darkborder rounded-xl space-y-2.5 bg-slate-50 dark:bg-darkbg/50 animate-pulse">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span className="text-gold-600 dark:text-gold-400">{genStep}</span>
                      <span>{genProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-gold-600 via-gold-500 to-amber-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${genProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Generation Result */}
                {generatedDesignUrl && (
                  <div className="border border-slate-200 dark:border-darkborder rounded-2xl overflow-hidden shadow-md space-y-3 bg-slate-50 dark:bg-darkbg/35 p-3">
                    <div className="h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 dark:border-darkborder relative">
                      <img src={generatedDesignUrl} alt="AI Generated interior" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/60 text-white text-[9px] font-semibold rounded uppercase tracking-wider">
                        Render Complete
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 dark:border-darkborder/50 pt-2.5">
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Save Layout to Project</span>
                      
                      <div className="flex gap-2">
                        <select 
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-darkbg border border-slate-200 dark:border-darkborder rounded-xl text-xs font-semibold"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.project_name}</option>
                          ))}
                        </select>
                        
                        <button 
                          onClick={handleSaveToProject}
                          disabled={isSaving || projects.length === 0}
                          className="px-4 py-1.5 bg-slate-900 dark:bg-gold-500 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-gold-400 transition font-bold flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSaving ? 'Syncing...' : 'Save Design'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AiBot;
