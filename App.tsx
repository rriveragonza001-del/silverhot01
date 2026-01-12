
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
  
  const [promoters, setPromoters] = useState<Promoter[]>(MOCK_PROMOTERS);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  // Resize listener for mobile adaptation
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User CRUD handlers
  const handleAddUser = (user: Promoter) => setPromoters(prev => [...prev, user]);
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

  const handleProgramLoaded = (newActivities: Activity[]) => {
    setActivities(prev => [...newActivities, ...prev]);
    setActiveView('activities');
    sendAdminNotification('Programación Cargada', `Se han importado ${newActivities.length} actividades nuevas.`, 'PROGRAM_UPLOAD');
  };

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
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };
        if (userRole === UserRole.FIELD_PROMOTER) {
          if (updates.status) sendAdminNotification('Cambio de Estado', `${currentPromoter.name} cambió "${a.title}" a ${updates.status}`, 'STATUS_CHANGE');
        }
        return updated;
      }
      return a;
    }));
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
    setActivities([activity, ...activities]);
    sendAdminNotification('Nueva Actividad', `${currentPromoter.name} registró una nueva labor: ${activity.title}`, 'NEW_ACTION');
    setIsNewActivityModalOpen(false);
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    if (role === UserRole.FIELD_PROMOTER) {
      setPromoters(prev => prev.map(p => p.id === 'p1' ? { ...p, isOnline: true, lastConnection: new Date().toISOString() } : p));
      sendAdminNotification('Inicio de Sesión', `El gestor ${currentPromoter.name} ha iniciado sesión. GPS Activo.`, 'USER_LOGIN');
    }
  };

  const handleLogout = () => {
    if (userRole === UserRole.FIELD_PROMOTER) {
      setPromoters(prev => prev.map(p => p.id === 'p1' ? { ...p, isOnline: false, lastConnection: new Date().toISOString() } : p));
    }
    setIsAuthenticated(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fa-gauge-high' },
    { id: 'tracking', label: 'Mapa', icon: 'fa-location-dot' },
    { id: 'activities', label: 'Acciones', icon: 'fa-clipboard-list' },
    { id: 'team', label: 'Equipo', icon: 'fa-users-line', adminOnly: true },
    { id: 'user-management', label: 'Usuarios', icon: 'fa-user-gear', adminOnly: true },
    { id: 'admin-notifications', label: 'Avisos', icon: 'fa-bullhorn', adminOnly: true },
    { id: 'reports', label: 'IA Global', icon: 'fa-chart-pie', adminOnly: true },
    { id: 'admin-custom-reports', label: 'Reportes', icon: 'fa-file-invoice-dollar', adminOnly: true },
    { id: 'program', label: 'Programar', icon: 'fa-calendar-plus', promoterOnly: true },
    { id: 'final-report', label: 'Exportar', icon: 'fa-file-invoice', promoterOnly: true },
  ].filter(item => {
    if (item.adminOnly && userRole !== UserRole.ADMIN) return false;
    if (item.promoterOnly && userRole !== UserRole.FIELD_PROMOTER) return false;
    return true;
  });

  // Mobile Bottom Nav Main items (pick 5 for balance)
  const mobileNavItems = navItems.slice(0, 5);

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 border-r border-slate-800`}>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <i className="fa-solid fa-route text-xl"></i>
              </div>
              <span className="text-xl font-black tracking-tight text-white">Promoter<span className="text-indigo-500">Flow</span></span>
            </div>
          </div>
          <nav className="flex-1 mt-4 px-4 space-y-2 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold' 
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800 mt-auto">
            <button onClick={handleLogout} className="w-full bg-slate-800/50 hover:bg-red-900/20 hover:text-red-400 p-3 rounded-xl flex items-center gap-3 transition-all mb-4 text-xs font-bold">
              <i className="fa-solid fa-right-from-bracket text-center"></i> Salir
            </button>
            <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3">
              <img src={userRole === UserRole.ADMIN ? 'https://picsum.photos/seed/adm/100' : currentPromoter.photo} className="w-8 h-8 rounded-full border border-slate-700" alt="user" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{userRole === UserRole.ADMIN ? 'Supervisor' : currentPromoter.name}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{userRole.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header with Safe Area */}
        <header className="safe-pt bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {isMobile ? (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <i className="fa-solid fa-route text-sm"></i>
              </div>
            ) : (
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><i className="fa-solid fa-bars"></i></button>
            )}
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {navItems.find(i => i.id === activeView)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isMobile && userRole === UserRole.FIELD_PROMOTER && (
              <button 
                onClick={() => setIsNewActivityModalOpen(true)}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            )}
            <div className="relative group">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 cursor-pointer active:bg-slate-100">
                <i className="fa-solid fa-bell"></i>
                {visibleNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </div>
            </div>
            {isMobile && (
              <button onClick={handleLogout} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-red-400 border border-slate-200">
                <i className="fa-solid fa-power-off"></i>
              </button>
            )}
          </div>
        </header>

        {/* Content Area with Native Scroll feel */}
        <div className="flex-1 overflow-y-auto scroll-native bg-slate-50 pb-24 lg:pb-6">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <StatCard icon="fa-users" color="text-indigo-600" bg="bg-indigo-50" label="Personal" value={promoters.length.toString()} isMobile={isMobile} />
                  <StatCard icon="fa-satellite-dish" color="text-emerald-600" bg="bg-emerald-50" label="GPS" value="LOCK-ON" isMobile={isMobile} />
                  <StatCard icon="fa-clipboard-check" color="text-blue-600" bg="bg-blue-50" label="Labores" value={activities.length.toString()} isMobile={isMobile} />
                  <StatCard icon="fa-triangle-exclamation" color="text-red-600" bg="bg-red-50" label="Alertas" value={notifications.filter(n => n.type === 'ADMIN_WARNING').length.toString()} isMobile={isMobile} />
                </div>
                <ActivityLog activities={filteredActivities.slice(0, 10)} promoters={promoters} userRole={userRole} onUpdateActivity={handleUpdateActivity} />
              </div>
            )}
            
            {activeView === 'team' && userRole === UserRole.ADMIN && <TeamModule promoters={promoters} />}
            {activeView === 'user-management' && userRole === UserRole.ADMIN && <UserManagementModule users={promoters} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
            {activeView === 'admin-notifications' && userRole === UserRole.ADMIN && <AdminNotificationModule promoters={promoters.filter(p => p.role === UserRole.FIELD_PROMOTER)} onSendNotification={(n) => sendAdminNotification(n.title!, n.message!, n.type!, n.recipientId)} />}
            {activeView === 'tracking' && <TrackingMap promoters={filteredPromoters} />}
            {activeView === 'program' && <ProgramModule onProgramLoaded={handleProgramLoaded} currentLocation={currentPromoter.lastLocation} />}
            {activeView === 'activities' && <ActivityLog activities={filteredActivities} promoters={promoters} userRole={userRole} onUpdateActivity={handleUpdateActivity} />}
            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}
            {activeView === 'admin-custom-reports' && <AdminReportGenerator activities={activities} promoters={promoters} />}
            {activeView === 'final-report' && <ReportingModule activities={filteredActivities} promoter={currentPromoter} />}
          </div>
        </div>

        {/* Mobile Bottom Navigation - iOS style */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 safe-pb z-50 flex justify-around items-center px-2 py-1">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-all rounded-xl ${
                  activeView === item.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-400'
                }`}
              >
                <div className={`text-lg mb-1 transition-transform ${activeView === item.id ? 'scale-110' : ''}`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Mobile-Optimized Full Screen Modal for Registration */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
          <header className="safe-pt px-6 py-4 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Nueva Registro</h2>
            <button onClick={() => setIsNewActivityModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Información de Acción</label>
              <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value as ActivityType})}>
                {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="text" placeholder="Título de la Acción" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm" value={newActivity.title || ''} onChange={e => setNewActivity({...newActivity, title: e.target.value})} />
              <textarea placeholder="Descripción detallada..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={newActivity.description || ''} onChange={e => setNewActivity({...newActivity, description: e.target.value})} />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-indigo-500 uppercase tracking-widest block">Contacto en Territorio</label>
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <input placeholder="Nombre Contacto" className="w-full h-12 bg-white border border-indigo-200 rounded-xl px-4 text-sm" value={newActivity.communityContact?.name} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, name: e.target.value}})} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Teléfono" type="tel" className="w-full h-12 bg-white border border-indigo-200 rounded-xl px-4 text-sm" value={newActivity.communityContact?.phone} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, phone: e.target.value}})} />
                  <label className="flex items-center justify-center gap-2 bg-white border border-indigo-200 rounded-xl px-4 h-12 select-none">
                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={newActivity.communityContact?.hasWhatsApp} onChange={e => setNewActivity({...newActivity, communityContact: {...newActivity.communityContact!, hasWhatsApp: e.target.checked}})}/>
                    <span className="text-xs font-bold text-slate-600">WhatsApp</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest">Medio de Verificación</p>
                <i className="fa-solid fa-camera-retro text-xl text-indigo-400"></i>
              </div>
              <div className="aspect-video border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 active:bg-slate-800 transition-colors">
                <i className="fa-solid fa-plus-circle text-3xl mb-2"></i>
                <p className="text-[10px] font-bold">CAPTURAR O SUBIR FOTO</p>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl">
                <i className="fa-solid fa-location-crosshairs text-emerald-400 mt-0.5"></i>
                <p className="text-[10px] leading-relaxed opacity-70">
                  Ubicación GPS bloqueada para esta entrada: <br/>
                  <span className="font-mono text-emerald-400">{currentPromoter.lastLocation.lat}, {currentPromoter.lastLocation.lng}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-100 safe-pb fixed bottom-0 inset-x-0">
            <button 
              onClick={handleCreateActivity}
              className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 active:scale-95 transition-all uppercase tracking-widest"
            >
              Finalizar y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, color, bg, label, value, isMobile }: { icon: string, color: string, bg: string, label: string, value: string, isMobile?: boolean }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center ${isMobile ? 'p-3 gap-3' : 'p-6 gap-5'} active:bg-slate-50 transition-colors`}>
    <div className={`${isMobile ? 'w-10 h-10 text-lg' : 'w-14 h-14 text-2xl'} ${bg} ${color} rounded-xl flex items-center justify-center shadow-inner flex-shrink-0`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div className="overflow-hidden">
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <p className={`font-black text-slate-800 truncate ${isMobile ? 'text-sm' : 'text-xl'}`}>{value}</p>
    </div>
  </div>
);

export default App;
