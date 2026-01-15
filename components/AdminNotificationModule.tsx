
import React, { useState } from 'react';
import { Promoter, Notification } from '../types';

interface AdminNotificationModuleProps {
  promoters: Promoter[];
  notifications: Notification[];
  onSendNotification: (notification: Partial<Notification>) => void;
}

const AdminNotificationModule: React.FC<AdminNotificationModuleProps> = ({ promoters, notifications, onSendNotification }) => {
  const [activeTab, setActiveTab] = useState<'SEND' | 'HISTORY'>('SEND');
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

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite las ventanas emergentes para descargar el historial.");
      return;
    }

    const rows = notifications
      .filter(n => n.type === 'ADMIN_ANNOUNCEMENT' || n.type === 'ADMIN_WARNING')
      .map(n => {
        const target = n.recipientId 
          ? promoters.find(p => p.id === n.recipientId)?.name || 'Desconocido'
          : 'Difusión General';
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${n.timestamp}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${target}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${n.type === 'ADMIN_WARNING' ? 'AMONESTACIÓN' : 'AVISO'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><b>${n.title}</b></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${n.message}</td>
          </tr>
        `;
      }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Historial de Comunicados Administrativos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #4f46e5; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .header-info { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>Historial de Avisos y Amonestaciones</h1>
          <div class="header-info">
            <p><strong>Institución:</strong> PromoterFlow Management</p>
            <p><strong>Fecha de reporte:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Destinatario</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Motivo / Mensaje</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay registros de comunicaciones enviadas.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const adminNotifications = notifications.filter(n => n.type === 'ADMIN_ANNOUNCEMENT' || n.type === 'ADMIN_WARNING');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex bg-slate-50 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('SEND')}
            className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SEND' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-paper-plane mr-2"></i> Enviar Comunicado
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-clock-rotate-left mr-2"></i> Historial de Comunicados
          </button>
        </div>

        {activeTab === 'SEND' ? (
          <div className="p-8 md:p-12 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <i className="fa-solid fa-bullhorn text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Comunicaciones Admin</h2>
                <p className="text-sm text-slate-500 font-medium">Notifica avisos oficiales o amonestaciones inmediatamente</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destinatarios</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${type === 'ADMIN_ANNOUNCEMENT' ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      <i className="fa-solid fa-circle-info"></i> Aviso
                    </button>
                    <button 
                      onClick={() => setType('ADMIN_WARNING')}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${type === 'ADMIN_WARNING' ? 'bg-red-50 border-red-600 text-red-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      <i className="fa-solid fa-triangle-exclamation"></i> Amonestación
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título del Comunicado</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Ej: Cambio de Horario o Falta de Registro..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo / Mensaje Detallado</label>
                <textarea 
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="Escriba el contenido de la notificación aquí..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <button 
                disabled={isSending}
                onClick={handleSend}
                className="w-full bg-slate-900 hover:bg-indigo-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4"
              >
                {isSending ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane text-lg"></i>
                )}
                ENVIAR COMUNICADO OFICIAL
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12 space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Historial de Comunicaciones</h2>
                <p className="text-sm text-slate-500 font-medium">Revisa quién, cuándo y por qué se emitieron los avisos</p>
              </div>
              <button 
                onClick={handleExportPDF}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <i className="fa-solid fa-file-pdf"></i> Descargar Historial (PDF)
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/30">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuándo (Fecha)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">A Quién (Gestor)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Qué (Título/Motivo)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminNotifications.length > 0 ? adminNotifications.map(n => {
                    const recipientName = n.recipientId 
                      ? promoters.find(p => p.id === n.recipientId)?.name || 'Desconocido'
                      : 'Difusión General';
                    return (
                      <tr key={n.id} className="hover:bg-white transition-colors group">
                        <td className="px-6 py-5 text-xs text-slate-500 font-medium whitespace-nowrap">{n.timestamp}</td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-800">{recipientName}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{n.recipientId ? 'Personalizado' : 'Grupal'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${n.type === 'ADMIN_WARNING' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                            {n.type === 'ADMIN_WARNING' ? 'Sanción' : 'Informativo'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-800 mb-1">{n.title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all">{n.message}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Recibido</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <i className="fa-solid fa-ghost text-5xl"></i>
                          <p className="text-xs font-black uppercase tracking-widest">No hay registros en el historial</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-5 shadow-sm">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
          <i className="fa-solid fa-shield-halved text-xl"></i>
        </div>
        <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
          <p className="font-black mb-1 uppercase tracking-widest">Protocolo de Auditoría:</p>
          Este historial permite auditar el comportamiento y las comunicaciones oficiales enviadas al personal. Los registros son inalterables y sirven como base para la evaluación de desempeño.
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationModule;
