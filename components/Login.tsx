
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin(UserRole.ADMIN);
      } else if (username === 'gestor' && password === 'gestor123') {
        onLogin(UserRole.FIELD_PROMOTER);
      } else {
        setError('Credenciales inválidas. Use admin/admin123 o gestor/gestor123');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-500">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-4">
              <i className="fa-solid fa-route text-3xl"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Promoter<span className="text-indigo-600">Flow</span></h1>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Sistema de Gestión de Campo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Usuario</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-indigo-600 transition-all text-slate-700"
                  placeholder="admin o gestor"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-indigo-600 transition-all text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3">
                <i className="fa-solid fa-triangle-exclamation"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all active:scale-95"
            >
              {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'INICIAR SESIÓN'}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">© 2024 PromoterFlow v2.0 • Unidad de Sistemas</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
