
import React from 'react';
import { Promoter } from '../types';

interface TeamModuleProps {
  promoters: Promoter[];
}

const TeamModule: React.FC<TeamModuleProps> = ({ promoters }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">Equipo de Trabajo</h2>
        <p className="text-sm text-slate-500">Gestión de personal y monitoreo de disponibilidad</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {promoters.map((promoter) => (
          <div key={promoter.id} className="relative group p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={promoter.photo} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt={promoter.name} />
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${promoter.isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{promoter.name}</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">{promoter.zone || 'Sin Zona'}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black uppercase ${promoter.isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
                    {promoter.isOnline ? 'Online' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Última Conexión</span>
                <span className="text-slate-700 font-black">{new Date(promoter.lastConnection).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Contacto</span>
                <span className="text-indigo-600 font-black">{promoter.phone}</span>
              </div>
            </div>

            <button className="absolute top-4 right-4 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-circle-info"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamModule;
