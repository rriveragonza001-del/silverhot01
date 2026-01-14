
import React, { useState, useEffect } from 'react';
import { UserRole, Promoter } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, userId: string) => void;
  users: Promoter[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('pf_remembered_user') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('pf_remembered_pass') || '');
  const [rememberUser, setRememberUser] = useState(() => !!localStorage.getItem('pf_remembered_user'));
  const [rememberPass, setRememberPass] = useState(() => !!localStorage.getItem('pf_remembered_pass'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = users.find(u => 
        (u.email === username || u.name === username) && u.password === password
      );

      if (user) {
        if (rememberUser) localStorage.setItem('pf_remembered_user', username);
        else localStorage.removeItem('pf_remembered_user');
        
        if (rememberPass) localStorage.setItem('pf_remembered_pass', password);
        else localStorage.removeItem('pf_remembered_pass');

        onLogin(user.role, user.id);
      } else {
        setError('Credenciales inválidas. Verifique su usuario y contraseña.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-500">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-4">
              <i className="fa-solid fa-route text-3xl"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Promoter<span className="text-indigo-600">Flow</span></h1>
            <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-[0.3em]">Acceso Seguro al Sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Usuario / Email</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-600 transition-all text-slate-700 font-bold"
                  placeholder="admin o gestor"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-600 transition-all text-slate-700 font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberUser} 
                  onChange={e => setRememberUser(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-600 transition-colors">Recordar Usuario</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberPass} 
                  onChange={e => setRememberPass(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-slate-600 transition-colors">Recordar Clave</span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              {isLoading ? <i className="fa-solid fa-spinner animate-spin text-lg"></i> : 'ENTRAR AL PANEL'}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">Seguridad Institucional v3.5</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
