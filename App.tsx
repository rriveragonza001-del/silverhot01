
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

const STORAGE_KEYS = {
  PROMOTERS: 'pf_promoters_final_v3',
  ACTIVITIES: 'pf_activities_final_v3',
  NOTIFICATIONS: 'pf_notifications_final_v3',
  AUTH_ID: 'pf_auth_user_id',
  AUTH_ROLE: 'pf_auth_user_role'
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(STORAGE_KEYS.AUTH_ID));
  const [currentPromoterId, setCurrentPromoterId] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.AUTH_ID) || '');
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.AUTH_ROLE) as UserRole) || UserRole.ADMIN);

  const [promoters, setPromoters] = useState<Promoter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMOTERS);
      return saved ? JSON.parse(saved) : MOCK_PROMOTERS;
    } catch (e) { return MOCK_PROMOTERS; }
  });
  
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : MOCK_ACTIVITIES;
    } catch (e) { return MOCK_ACTIVITIES; }
  });
  
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Persistencia Blindada: Cualquier cambio en actividades, promotores o avisos se guarda al instante.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(promoters));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    
    setShowSaveSuccess(true);
    const timer = setTimeout(() => setShowSaveSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [promoters, activities, notifications]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddUser = (user: Promoter) => setPromoters(prev => [user, ...prev]);
  const handleUpdateUser = (id: string, updates: Partial<Promoter>) => setPromoters(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const handleDeleteUser = (id: string) => {
    if(confirm('¿Seguro que deseas eliminar a este usuario permanentemente?')) {
      setPromoters(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleAddActivity = (activity: Activity) => {
    const activityWithPromoter = {
      ...activity,
      promoterId: currentPromoterId // Asignación automática segura
    };
    setActivities(prev => [activityWithPromoter, ...prev]);
  };

  const currentPromoter = useMemo(() => {
    return promoters.find(p => p.id === currentPromoterId) || promoters[0];
  }, [promoters, currentPromoterId]);

  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) return activities;
    return activities.filter(a => a.promoterId === currentPromoterId);
  }, [activities, userRole, currentPromoterId]);

  const handleLogin = (role: UserRole, userId: string) => {
    setUserRole(role);
    setCurrentPromoterId(userId);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH_ID, userId);
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);
    setPromoters(prev => prev.map(p => p.id === userId ? { ...p, isOnline: true, lastConnection: new Date().toISOString() } : p));
  };

  const handleLogout = () => {
    setPromoters(prev => prev.map(p => p.id === currentPromoterId ? { ...p, isOnline: false, lastConnection: new Date().toISOString() } : p));
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
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
      {/* Indicador Global de Guardado */}
      {showSaveSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-indigo-600 text-white px-6 py-2 rounded-full text-[11px] font-black shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300">
          <i className="fa-solid fa-cloud-check"></i> DATOS SINCRONIZADOS
        </div>
      )}

      {/* Menú Lateral Escritorio */}
      {!isMobile && (
        <aside className="bg-slate-900 text-slate-300 w-72 flex-shrink-0 flex flex-col border-r border-slate-800">
          <div className="p-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
              <i className="fa-solid fa-route text-2xl"></i>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block leading-none">Promoter<span className="text-indigo-500">Flow</span></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Control de Gestión</span>
            </div>
          </div>
          <nav className="flex-1 px-5 mt-4 space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all ${
                  activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-6 text-lg`}></i>
                <span className="text-sm uppercase tracking-wider text-[11px] font-black">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button onClick={handleLogout} className="w-full bg-slate-800/50 hover:bg-red-900/30 hover:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-black transition-all mb-6 uppercase tracking-widest">
              <i className="fa-solid fa-right-from-bracket"></i> Salir del Sistema
            </button>
            <div className="p-4 bg-slate-800/30 rounded-2xl flex items-center gap-4 border border-slate-800/50">
              <img src={currentPromoter?.photo || `https://picsum.photos/seed/${currentPromoter?.id}/200`} className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-sm" />
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{currentPromoter?.name}</p>
                <p className="text-[8px] text-indigo-400 uppercase font-black tracking-[0.2em]">{userRole}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="safe-pt bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex justify-between items-center z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {isMobile && <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"><i className="fa-solid fa-route text-lg"></i></div>}
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">{navItems.find(i => i.id === activeView)?.label}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-native pb-24 lg:pb-8">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="fa-users" color="text-indigo-600" bg="bg-indigo-50" label="Personal" value={promoters.length.toString()} />
                  <StatCard icon="fa-satellite-dish" color="text-emerald-600" bg="bg-emerald-50" label="GPS" value="LOCK ON" />
                  <StatCard icon="fa-clipboard-check" color="text-blue-600" bg="bg-blue-50" label="Acciones" value={activities.length.toString()} />
                  <StatCard icon="fa-triangle-exclamation" color="text-red-600" bg="bg-red-50" label="Avisos" value={notifications.length.toString()} />
                </div>
                <ActivityLog 
                  activities={filteredActivities.slice(0, 10)} 
                  promoters={promoters} 
                  userRole={userRole} 
                  onUpdateActivity={handleUpdateActivity}
                  onAddActivity={handleAddActivity}
                />
              </div>
            )}
            {activeView === 'team' && <TeamModule promoters={promoters} />}
            {activeView === 'user-management' && <UserManagementModule users={promoters} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
            {activeView === 'admin-notifications' && <AdminNotificationModule promoters={promoters.filter(p => p.role === UserRole.FIELD_PROMOTER)} onSendNotification={(n) => {}} />}
            {activeView === 'tracking' && <TrackingMap promoters={promoters} />}
            {activeView === 'activities' && (
              <ActivityLog 
                activities={filteredActivities} 
                promoters={promoters} 
                userRole={userRole} 
                onUpdateActivity={handleUpdateActivity}
                onAddActivity={handleAddActivity}
              />
            )}
            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}
            {activeView === 'admin-custom-reports' && <AdminReportGenerator activities={activities} promoters={promoters} />}
            {activeView === 'program' && <ProgramModule onProgramLoaded={(newActs) => setActivities(prev => [...newActs, ...prev])} currentLocation={currentPromoter.lastLocation} />}
            {activeView === 'final-report' && <ReportingModule activities={filteredActivities} promoter={currentPromoter} />}
          </div>
        </div>

        {/* Barra de Navegación Móvil */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 safe-pb z-50 flex justify-around items-center px-4 py-2 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            {navItems.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id as View)} className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${activeView === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                <div className="text-xl mb-1"><i className={`fa-solid ${item.icon}`}></i></div>
                <span className="text-[9px] font-black uppercase truncate w-full text-center tracking-tighter">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, bg, label, value }: { icon: string, color: string, bg: string, label: string, value: string }) => (
  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-all active:bg-slate-50">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner`}><i className={`fa-solid ${icon}`}></i></div>
    <div className="overflow-hidden">
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] truncate mb-1">{label}</p>
      <p className="font-black text-slate-800 truncate text-lg tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

export default App;
