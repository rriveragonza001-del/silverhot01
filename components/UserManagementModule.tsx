
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
    email: '',
    phone: '',
    password: '',
    position: '',
    zone: '',
    role: UserRole.FIELD_PROMOTER,
    status: 'inactive',
    isOnline: false,
    photo: 'https://picsum.photos/seed/newuser/200'
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
        lastLocation: { lat: 19.4326, lng: -99.1332 }, // Default location
        lastUpdated: new Date().toISOString(),
        lastConnection: new Date().toISOString(),
      } as Promoter;
      onAddUser(newUser);
    }
    closeModal();
  };

  const openModal = (user?: Promoter) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData(initialForm);
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
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Control de Usuarios</h2>
          <p className="text-sm text-slate-500">Crea, modifica y gestiona los accesos del personal</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus"></i>
          Nuevo Miembro
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">Usuario / Cargo</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Zona / Sector</th>
              <th className="px-6 py-4">Rol de App</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.photo} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" alt="" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{user.position}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs">
                    <p className="text-slate-600 font-bold">{user.email}</p>
                    <p className="text-slate-400">{user.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {user.zone || 'Global'}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${user.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openModal(user)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Modificar Usuario' : 'Crear Nuevo Usuario'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nombre Completo</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Usuario / Email de Acceso</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Contraseña de Acceso</label>
                  <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Cargo Institucional</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Teléfono Móvil</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Zona / Sector Asignado</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Rol en Plataforma</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.FIELD_PROMOTER}>Gestor de Campo</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl shadow-indigo-200 active:scale-95 transition-transform">{editingUser ? 'Actualizar Datos' : 'Registrar Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementModule;
