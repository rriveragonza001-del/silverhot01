
import React, { useState, useRef } from 'react';
import { Promoter, UserRole } from '../types';

interface ProfileModuleProps {
  user: Promoter;
  onUpdateUser: (id: string, updates: Partial<Promoter>) => void;
}

const ProfileModule: React.FC<ProfileModuleProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    position: user.position,
    email: user.email,
    phone: user.phone,
    photo: user.photo
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, photo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser(user.id, formData);
      setIsSaving(false);
      alert("Perfil actualizado correctamente.");
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-12">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group mb-6">
            <img 
              src={formData.photo} 
              className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl transition-transform group-hover:scale-105" 
              alt={formData.name} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-all active:scale-90"
            >
              <i className="fa-solid fa-camera"></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoChange} 
            />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formData.name}</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{user.role === UserRole.ADMIN ? 'Administrador' : 'Gestor de Campo'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Completo</label>
              <input 
                className="profile-input" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Nombre"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cargo Institucional</label>
              <input 
                className="profile-input" 
                value={formData.position} 
                onChange={e => setFormData({...formData, position: e.target.value})} 
                placeholder="Cargo"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Electrónico</label>
            <input 
              type="email"
              className="profile-input" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="email@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número Telefónico</label>
            <input 
              className="profile-input" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="Teléfono"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Usuario (Solo Admin)</label>
              <input className="profile-input bg-slate-100 cursor-not-allowed" value={user.username} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña (Solo Admin)</label>
              <input type="password" title="El cambio de contraseña solo lo puede realizar el Administrador" className="profile-input bg-slate-100 cursor-not-allowed" value="********" disabled />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-900 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'GUARDAR CAMBIOS EN PERFIL'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .profile-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          padding: 1rem 1.5rem;
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 700;
          outline: none;
          transition: all 0.3s;
        }
        .profile-input:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ProfileModule;
