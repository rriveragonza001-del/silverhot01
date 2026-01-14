
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_ACTIVITIES, MOCK_PROMOTERS } from './utils/mockData';
import { Activity, Promoter, ActivityType, ActivityStatus, UserRole, Notification } from './types';
import TrackingMap from './components/TrackingMap';
import ActivityLog from './components/ActivityLog';
import PerformanceReport from './components/PerformanceReport';
import ProgramModule from './components/ProgramModule';
import ReportingModule from './components/ReportingModule';
import AdminReportGenerator from './components/AdminReportGenerator';
import TeamModule from './components/TeamModule';
import Login from './components/Login';
import UserManagementModule from './components/UserManagementModule';
import AdminNotificationModule from './components/AdminNotificationModule';

type View = 'dashboard' | 'tracking' | 'activities' | 'reports' | 'program' | 'final-report' | 'admin-custom-reports' | 'team' | 'user-management' | 'admin-notifications';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentPromoterId, setCurrentPromoterId] = useState<string>('p1');
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  // Persistence logic: Load initial data from LocalStorage or Fallback to Mocks
  const [promoters, setPromoters] = useState<Promoter[]>(() => {
    const saved = localStorage.getItem('pf_promoters');
    return saved ? JSON.parse(saved) : MOCK_PROMOTERS;
  });
  
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('pf_activities');
    return saved ? JSON.parse(saved) : MOCK_ACTIVITIES;
  });
  
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('pf_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  // Sync data to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('pf_promoters', JSON.stringify(promoters));
  }, [promoters]);

  useEffect(() => {
    localStorage.setItem('pf_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('pf_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddUser = (user: Promoter) => setPromoters(prev => [user, ...prev]);
  const handleUpdateUser = (id: string, updates: Partial<Promoter>) => setPromoters(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const handleDeleteUser = (id: string) => {
    if(window.confirm('¿Estás seguro de eliminar a este usuario?')) {
      setPromoters(prev => prev.filter(u => u.id !== id));
    }
  };

  const currentPromoter = useMemo(() => 
    promoters.find(p => p.id === currentPromoterId) || promoters[0]
  , [promoters, currentPromoterId]);

  const visibleNotifications = useMemo(() => {
    if (userRole === UserRole.ADMIN) return notifications;
    return notifications.filter(n => !n.recipientId || n.recipientId === currentPromoterId);
  }, [notifications, userRole, currentPromoterId]);

  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.IN_PROGRESS,
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    communityContact: { name: '', phone: '', hasWhatsApp: false, role: '', community: '' }
  });

  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) return activities;
    return activities.filter(a => a.promoterId === currentPromoterId);
  }, [activities, userRole, currentPromoterId]);

  const filteredPromoters = useMemo(() => {
    if (userRole === UserRole.ADMIN) return promoters;
    return promoters.filter(p => p.id === currentPromoterId);
  }, [promoters, userRole, currentPromoterId]);

  const sendAdminNotification = (title: string, message: string, type: Notification['type'], recipientId?: string) => {
    const newNotification: Notification = {
      id: `n${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleString(),
      read: false,
      type,
      senderId: userRole === UserRole.ADMIN ? 'ADMIN' : currentPromoterId,
      recipientId
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleCreateActivity = () => {
    if (!newActivity.title) return;
    const activity: Activity = {
      ...newActivity as any,
      id: `a${Date.now()}`,
      promoterId: currentPromoterId,
      location: currentPromoter.lastLocation,
      verificationPhoto: 'https://picsum.photos/seed/' + Math.random() + '/400/300'
    };
    setActivities(prev => [activity, ...prev]);
    sendAdminNotification('Nueva Actividad', `${currentPromoter.name} registró una nueva labor: ${activity.title}`, 'NEW_ACTION');
    setIsNewActivityModalOpen(false);
    // Reset form
    setNewActivity({
      type: ActivityType.COMMUNITY_VISIT,
      status: ActivityStatus.IN_PROGRESS,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      communityContact: { name: '', phone: '', hasWhatsApp: false, role: '', community: '' }
    });
  };

  const handleLogin = (role: UserRole, userId: string) => {
    setUserRole(role);
    setCurrentPromoterId(userId);
    setIsAuthenticated(true);
    
    setPromoters(prev => prev.map(p => p.id === userId ? { ...p, isOnline: true, lastConnection: new Date().toISOString() } : p));
    
    if (role === UserRole.FIELD_PROMOTER) {
      sendAdminNotification('Sesión Iniciada', `El gestor ha ingresado al sistema. GPS Activo.`, 'USER_LOGIN', userId);
    }
  };

  const handleLogout = () => {
    setPromoters(prev => prev.map(p => p.id === currentPromoterId ? { ...p, isOnline: false, lastConnection: new Date().toISOString() } : p));
    setIsAuthenticated(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fa-gauge-high' },
    { id: 'tracking', label: 'GPS', icon: 'fa-location-dot' },
    { id: 'activities', label: 'Registro', icon: 'fa-clipboard-list' },
    { id: 'team', label: 'Equipo', icon: 'fa-users-line', adminOnly: true },
    { id: 'user-management', label: 'Usuarios', icon: 'fa-user-gear', adminOnly: true },
    { id: 'admin-notifications', label: 'Avisos', icon: 'fa-bullhorn', adminOnly: true },
    { id: 'reports', label: 'Resumen IA', icon: 'fa-chart-pie', adminOnly: true },
    { id: 'admin-custom-reports', label: 'Reportes', icon: 'fa-file-invoice-dollar', adminOnly: true },
    { id: 'program', label: 'Agenda', icon: 'fa-calendar-plus', promoterOnly: true },
    { id: 'final-report', label: 'Exportar', icon: 'fa-file-invoice', promoterOnly: true },
  ].filter(item => {
    if (item.adminOnly && userRole !== UserRole.ADMIN) return false;
    if (item.promoterOnly && userRole !== UserRole.FIELD_PROMOTER) return false;
    return true;
  });

  if (!isAuthenticated) return <Login onLogin={handleLogin} users={promoters} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {!isMobile && (
        <aside className="bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col border-r border-slate-800">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <i className="fa-solid fa-route text-xl"></i>
            </div>
            <span className="text-xl font-black tracking-tight text-white">Promoter<span className="text-indigo-500">Flow</span></span>
          </div>
          <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5`}></i>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full bg-slate-800/50 hover:bg-red-900/20 hover:text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs font-bold transition-all">
              <i className="fa-solid fa-right-from-bracket"></i> Salir
            </button>
            <div className="mt-4 p-3 bg-slate-800 rounded-xl flex items-center gap-3">
              <img src={currentPromoter.photo} className="w-8 h-8 rounded-full border border-slate-700" alt="me" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white truncate">{currentPromoter.name}</p>
                <p className="text-[8px] text-slate-500 uppercase font-bold">{userRole}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="safe-pt bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {isMobile && <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><i className="fa-solid fa-route text-sm"></i></div>}
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">{navItems.find(i => i.id === activeView)?.label}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {userRole === UserRole.FIELD_PROMOTER && (
               <div className="hidden md:flex items-center bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100">
                <i className="fa-solid fa-satellite-dish mr-2 animate-pulse"></i> GPS ACTIVO
              </div>
            )}
            <div className="relative group h-10 w-10">
              <div className="h-full w-full rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 cursor-pointer active:bg-slate-100 transition-colors">
                <i className="fa-solid fa-bell"></i>
                {visibleNotifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
              </div>
            </div>
            {isMobile && userRole === UserRole.FIELD_PROMOTER && (
              <button onClick={() => setIsNewActivityModalOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"><i className="fa-solid fa-plus"></i></button>
            )}
            {isMobile && (
              <button onClick={handleLogout} className="w-10 h-10 bg-slate-100 text-red-500 rounded-full flex items-center justify-center"><i className="fa-solid fa-power-off"></i></button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-native pb-24 lg:pb-6">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="fa-users" color="text-indigo-600" bg="bg-indigo-50" label="Equipo" value={promoters.length.toString()} />
                  <StatCard icon="fa-satellite-dish" color="text-emerald-600" bg="bg-emerald-50" label="GPS" value="FIXED" />
                  <StatCard icon="fa-clipboard-check" color="text-blue-600" bg="bg-blue-50" label="Actividades" value={activities.length.toString()} />
                  <StatCard icon="fa-triangle-exclamation" color="text-red-600" bg="bg-red-50" label="Alertas" value={notifications.filter(n => n.type === 'ADMIN_WARNING').length.toString()} />
                </div>
                <ActivityLog activities={filteredActivities.slice(0, 10)} promoters={promoters} userRole={userRole} onUpdateActivity={handleUpdateActivity} />
              </div>
            )}
            {activeView === 'team' && <TeamModule promoters={promoters} />}
            {activeView === 'user-management' && <UserManagementModule users={promoters} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
            {activeView === 'admin-notifications' && <AdminNotificationModule promoters={promoters.filter(p => p.role === UserRole.FIELD_PROMOTER)} onSendNotification={(n) => sendAdminNotification(n.title!, n.message!, n.type!, n.recipientId)} />}
            {activeView === 'tracking' && <TrackingMap promoters={filteredPromoters} />}
            {activeView === 'activities' && <ActivityLog activities={filteredActivities} promoters={promoters} userRole={userRole} onUpdateActivity={handleUpdateActivity} />}
            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}
            {activeView === 'admin-custom-reports' && <AdminReportGenerator activities={activities} promoters={promoters} />}
            {activeView === 'program' && <ProgramModule onProgramLoaded={(newActs) => setActivities([...newActs, ...activities])} currentLocation={currentPromoter.lastLocation} />}
            {activeView === 'final-report' && <ReportingModule activities={filteredActivities} promoter={currentPromoter} />}
          </div>
        </div>

        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 safe-pb z-50 flex justify-around items-center px-2 py-1">
            {navItems.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id as View)} className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-all ${activeView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className={`text-lg mb-1 transition-transform ${activeView === item.id ? 'scale-110' : ''}`}><i className={`fa-solid ${item.icon}`}></i></div>
                <span className="text-[10px] font-bold uppercase truncate w-full text-center tracking-tighter">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {isNewActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
          <header className="safe-pt px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Nuevo Registro de Labores</h2>
            <button onClick={() => setIsNewActivityModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block px-1">Información de Acción</label>
              <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value as any})}><option value="">Seleccione Tipo</option>{Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}</select>
              <input type="text" placeholder="Título de la Acción" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" value={newActivity.title || ''} onChange={e => setNewActivity({...newActivity, title: e.target.value})} />
              <textarea placeholder="Descripción detallada de labores..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={newActivity.description || ''} onChange={e => setNewActivity({...newActivity, description: e.target.value})} />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-indigo-500 uppercase tracking-widest block px-1">Contacto Comunitario Atendido</label>
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                <input placeholder="Nombre Completo" className="w-full h-10 bg-white border border-indigo-100 rounded-xl px-4 text-sm font-medium" value={newActivity.communityContact?.name} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, name: e.target.value}})} />
                <div className="grid grid-cols-2 gap-3">
                   <input placeholder="Teléfono" type="tel" className="w-full h-10 bg-white border border-indigo-100 rounded-xl px-4 text-sm font-medium" value={newActivity.communityContact?.phone} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, phone: e.target.value}})} />
                   <label className="flex items-center justify-center gap-2 bg-white border border-indigo-100 rounded-xl px-4 h-10 text-[10px] font-black text-slate-600 select-none active:bg-indigo-100 transition-colors"><input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" checked={newActivity.communityContact?.hasWhatsApp} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, hasWhatsApp: e.target.checked}})} /> WHATSAPP</label>
                </div>
                <input placeholder="Comunidad / Sector" className="w-full h-10 bg-white border border-indigo-100 rounded-xl px-4 text-sm font-medium" value={newActivity.communityContact?.community} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, community: e.target.value}})} />
              </div>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-2xl shadow-indigo-900/20">
               <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-tighter">Medio de Verificación Fotográfica</p><i className="fa-solid fa-camera-retro text-indigo-400"></i></div>
               <div className="w-full h-32 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:border-indigo-500 transition-all cursor-pointer"><i className="fa-solid fa-cloud-arrow-up text-2xl mb-2"></i><p className="text-[10px] font-bold">SUBIR O CAPTURAR FOTO</p></div>
               <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-white/5 p-2 rounded-lg"><i className="fa-solid fa-location-crosshairs animate-pulse"></i> GPS LOCK: {currentPromoter.lastLocation.lat}, {currentPromoter.lastLocation.lng}</div>
            </div>
          </div>
          <div className="p-6 bg-white border-t border-slate-100 safe-pb fixed bottom-0 inset-x-0 shadow-2xl">
            <button onClick={handleCreateActivity} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-sm active:scale-95 transition-all">Finalizar y Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, color, bg, label, value }: { icon: string, color: string, bg: string, label: string, value: string }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-inner`}><i className={`fa-solid ${icon}`}></i></div>
    <div className="overflow-hidden"><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest truncate mb-0.5">{label}</p><p className="font-black text-slate-800 truncate text-sm tracking-tight">{value}</p></div>
  </div>
);

export default App;
