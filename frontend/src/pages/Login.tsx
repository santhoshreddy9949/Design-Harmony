import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const autofillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium Backdrops */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gold-950/20 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-slate-900/40 blur-[150px]" />
      
      {/* Decorative center ring */}
      <div className="absolute w-[500px] h-[500px] border border-gold-950/10 rounded-full animate-pulse pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 text-white shadow-lg shadow-gold-600/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white">DESIGN & HARMONY</h1>
          <p className="text-xs text-gold-500 font-semibold uppercase tracking-widest mt-1">Enterprise Resource Planning</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-6">Sign In to Dashboard</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@harmony.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400">Password</label>
                <a href="#forgot" onClick={() => {
                  if (email) {
                    fetch('http://localhost:5000/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    }).then(res => res.json()).then(data => alert(data.message));
                  } else {
                    alert('Please enter your email first to receive reset instructions.');
                  }
                }} className="text-[11px] text-gold-500 hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-transparent transition"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-white font-medium rounded-xl shadow-lg shadow-gold-600/15 transition duration-200 active:scale-[0.99] text-sm font-semibold flex items-center justify-center"
              disabled={loading}
            >
              {loading ? 'Verifying Session...' : 'Authenticate Account'}
            </button>
          </form>

          {/* Quick Demo Login Triggers */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Demo Account Role</span>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <button 
                type="button" 
                onClick={() => autofillCredentials('admin@harmony.com')}
                className="p-2 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 text-zinc-300 rounded-lg text-left truncate transition"
              >
                <strong>Admin</strong>
              </button>
              <button 
                type="button" 
                onClick={() => autofillCredentials('designer@harmony.com')}
                className="p-2 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 text-zinc-300 rounded-lg text-left truncate transition"
              >
                <strong>Designer</strong>
              </button>
              <button 
                type="button" 
                onClick={() => autofillCredentials('sales@harmony.com')}
                className="p-2 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 text-zinc-300 rounded-lg text-left truncate transition"
              >
                <strong>Sales Executive</strong>
              </button>
              <button 
                type="button" 
                onClick={() => autofillCredentials('accountant@harmony.com')}
                className="p-2 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 text-zinc-300 rounded-lg text-left truncate transition"
              >
                <strong>Accountant</strong>
              </button>
            </div>
            <div className="mt-3 text-center">
              <button 
                type="button" 
                onClick={() => autofillCredentials('inventory@harmony.com')}
                className="px-4 py-1.5 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 text-zinc-300 rounded-lg text-xs transition"
              >
                <strong>Inventory Manager</strong>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
