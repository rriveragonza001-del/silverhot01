
import React, { useState } from 'react';
import { Promoter, Activity, ActivityType, ActivityStatus, ProblemType } from '../types';

interface AdminAssignmentModuleProps {
  promoters: Promoter[];
  onAssignActivities: (activities: Activity[]) => void;
  adminId: string;
}

const AdminAssignmentModule: React.FC<AdminAssignmentModuleProps> = ({ promoters, onAssignActivities, adminId }) => {
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Activity>>({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    community: '',
    objective: '',
    attendeeName: 'Por Definir',
    attendeeRole: 'Líder Comunitario',
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.PENDING,
    problemsIdentified: ProblemType.OTRAS
  });

  const togglePromoter = (id: string) => {
    setSelectedPromoters(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPromoters.length === 0) {
      alert("Por favor selecciona al menos un gestor.");
      return;
    }

    const newActivities = selectedPromoters.map(pId => ({
      ...formData,
      id: `assign-${Date.now()}-${pId}`,
      promoterId: pId,
      assignedBy: adminId,
      location: promoters.find(p => p.id === pId)?.lastLocation || { lat: 0, lng: 0 }
    } as Activity));

    onAssignActivities(newActivities);
    alert(`Se han asignado ${newActivities.length} actividades correctamente.`);
    setSelectedPromoters([]);
    setFormData({ ...formData, objective: '', community: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-12">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-indigo-100">
            <i className="fa-solid fa-tasks"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Asignación de Actividades</h2>
            <p className="text-sm text-slate-400 font-medium">Programación individual o grupal de labores de campo</p>
          </div>
        </div>

        <form onSubmit={handleAssign} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Detalles de Tarea */}
            <div className="space-y-8">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] px-1 border-l-4 border-indigo-600 pl-4">Detalles de la Labor</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha</label>
                  <input required type="date" className="assign-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hora</label>
                  <input required type="time" className="assign-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Actividad</label>
                <select className="assign-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lugar / Comunidad</label>
                <input required className="assign-input" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} placeholder="Ej: San Jacinto Sector A" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo General</label>
                <textarea rows={3} required className="assign-input resize-none" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} placeholder="Instrucción detallada para el gestor..." />
              </div>
            </div>

            {/* Selección de Personal */}
            <div className="space-y-8">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] border-l-4 border-indigo-600 pl-4">Asignar a Personal</h3>
                <button 
                  type="button" 
                  onClick={() => setSelectedPromoters(prev => prev.length === promoters.length ? [] : promoters.map(p => p.id))}
                  className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                >
                  {selectedPromoters.length === promoters.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {promoters.map(promoter => (
                  <button
                    key={promoter.id}
                    type="button"
                    onClick={() => togglePromoter(promoter.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      selectedPromoters.includes(promoter.id)
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={promoter.photo} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="text-left">
                        <p className={`text-sm font-bold ${selectedPromoters.includes(promoter.id) ? 'text-indigo-800' : 'text-slate-600'}`}>{promoter.name}</p>
                        <p className="text-[10px] font-medium uppercase tracking-tighter">{promoter.zone || 'Global'}</p>
                      </div>
                    </div>
                    {selectedPromoters.includes(promoter.id) && (
                      <i className="fa-solid fa-circle-check text-indigo-600 text-lg"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
          >
            <i className="fa-solid fa-paper-plane"></i>
            Asignar a {selectedPromoters.length} Gestor{selectedPromoters.length !== 1 ? 'es' : ''}
          </button>
        </form>
      </div>

      <style>{`
        .assign-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .assign-input:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 4px 20px -5px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </div>
  );
};

export default AdminAssignmentModule;
