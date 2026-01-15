
import React, { useState } from 'react';
import { Promoter, UserRole } from '../types';

interface UserManagementModuleProps {
  users: Promoter[];
  onAddUser: (user: Promoter) => void;
  onUpdateUser: (id: string, updates: Partial<Promoter>) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagementModule: React.FC<UserManagementModuleProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Promoter | null>(null);
  
  const initialForm: Partial<Promoter> = {
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    position: '',
    zone: '',
    role: UserRole.FIELD_PROMOTER,
    status: 'inactive',
    isOnline: false,
    photo: '',
    mustChangePassword: true
  };

  const [formData, setFormData] = useState<Partial<Promoter>>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
    } else {
      const newUser: Promoter = {
        ...formData,
        id: 'p' + Date.now(),
        photo: formData.photo || `https://picsum.photos/seed/${Date.now()}/200`,
        lastLocation: { lat: 13.6929, lng: -89.2182 },
        lastUpdated: new Date().toISOString(),
        lastConnection: new Date().toISOString(),
        status: 'active',
        mustChangePassword: true
      } as Promoter;
      onAddUser(newUser);
    }
    closeModal();
  };

  const openModal = (user?: Promoter) => {
    if (user) {
      setEditingUser(user);
      setFormData({...user});
    } else {
      setEditingUser(null);
      setFormData({...initialForm});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Control de Usuarios</h2>
          <p className="text-sm text-slate-500">Gestión de accesos y perfiles administrativos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus"></i>
          Nuevo Miembro
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Usuario / Cargo</th>
                <th className="px-6 py-4">Acceso / Login</th>
                <th className="px-6 py-4">Zona</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.photo || `https://picsum.photos/seed/${user.id}/200`} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{user.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 font-bold">{user.username || user.email}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Clave: {user.password}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                      {user.zone || 'Global'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingUser ? 'Modificar Usuario' : 'Crear Usuario'}</h3>
                <p className="text-sm text-slate-400 font-medium">Define los accesos del personal</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Completo</label>
                  <input required className="m-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre completo" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Usuario de Acceso</label>
                  <input required className="m-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="nombre.apellido" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Contraseña</label>
                  <input required type="text" className="m-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="password123" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Electrónico</label>
                  <input required className="m-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@ejemplo.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cargo</label>
                  <input required className="m-input" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Cargo" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</label>
                  <input required className="m-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Número telefónico" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zona</label>
                  <input className="m-input" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} placeholder="Zona asignada" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rol</label>
                  <select className="m-input appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.FIELD_PROMOTER}>Gestor de Campo</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-center md:justify-end gap-3 pt-8">
                <button type="button" onClick={closeModal} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .m-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          padding: 0.75rem 1.25rem;
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 700;
          outline: none;
          transition: all 0.2s;
        }
        .m-input:focus {
          border-color: #4f46e5;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default UserManagementModule;
