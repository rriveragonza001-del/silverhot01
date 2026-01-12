
import React, { useState } from 'react';
import { Promoter, Notification } from '../types';

interface AdminNotificationModuleProps {
  promoters: Promoter[];
  onSendNotification: (notification: Partial<Notification>) => void;
}

const AdminNotificationModule: React.FC<AdminNotificationModuleProps> = ({ promoters, onSendNotification }) => {
  const [recipient, setRecipient] = useState<string>('ALL');
  const [type, setType] = useState<'ADMIN_ANNOUNCEMENT' | 'ADMIN_WARNING'>('ADMIN_ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!title || !message) {
      alert("Por favor completa el título y mensaje");
      return;
    }
    
    setIsSending(true);
    
    const notif: Partial<Notification> = {
      title,
      message,
      type,
      recipientId: recipient === 'ALL' ? undefined : recipient,
      timestamp: new Date().toLocaleString(),
    };

    setTimeout(() => {
      onSendNotification(notif);
      setIsSending(false);
      setTitle('');
      setMessage('');
      alert("Comunicado enviado exitosamente");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-bullhorn text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Centro de Comunicaciones Admin</h2>
            <p className="text-sm text-slate-500">Envía avisos oficiales o amonestaciones de forma inmediata</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destinatarios</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              >
                <option value="ALL">📢 Difusión General (Todo el Equipo)</option>
                {promoters.map(p => <option key={p.id} value={p.id}>👤 {p.name} ({p.position})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Comunicación</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setType('ADMIN_ANNOUNCEMENT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs ${type === 'ADMIN_ANNOUNCEMENT' ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-inner' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <i className="fa-solid fa-info-circle"></i> AVISO / AVISO
                </button>
                <button 
                  onClick={() => setType('ADMIN_WARNING')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs ${type === 'ADMIN_WARNING' ? 'bg-red-50 border-red-600 text-red-600 shadow-inner' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <i className="fa-solid fa-triangle-exclamation"></i> AMONESTACIÓN
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título del Comunicado</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: Reunión Extraordinaria o Falta Administrativa..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mensaje Detallado</label>
            <textarea 
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Escribe el contenido de la notificación aquí..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <button 
            disabled={isSending}
            onClick={handleSend}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isSending ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane"></i>
            )}
            ENVIAR NOTIFICACIÓN INMEDIATA
          </button>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
        <i className="fa-solid fa-shield-halved text-amber-500 text-xl mt-1"></i>
        <div className="text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">Nota de Seguridad:</p>
          Toda comunicación enviada desde este panel es vinculante y queda registrada en el log de auditoría del sistema con fecha, hora y firma digital del administrador.
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationModule;
