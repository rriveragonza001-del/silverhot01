
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import AdminAssignmentModule from './components/AdminAssignmentModule';
import ProfileModule from './components/ProfileModule';

type View = 'dashboard' | 'tracking' | 'activities' | 'reports' | 'program' | 'final-report' | 'admin-custom-reports' | 'team' | 'user-management' | 'admin-notifications' | 'admin-assignments' | 'profile';

const STORAGE_KEYS = {
  PROMOTERS: 'pf_promoters_v7',
  ACTIVITIES: 'pf_activities_v7',
  NOTIFICATIONS: 'pf_notifications_v7',
  AUTH_ID: 'pf_auth_user_id_v7',
  AUTH_ROLE: 'pf_auth_user_role_v7'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [adminViewPromoterId, setAdminViewPromoterId] = useState<string>('ALL');

  const currentPromoter = useMemo(() => 
    promoters.find(p => p.id === currentPromoterId), 
    [promoters, currentPromoterId]
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACTIVITIES && e.newValue) {
        setActivities(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEYS.PROMOTERS && e.newValue) {
        setPromoters(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(promoters));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [promoters, activities, notifications]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshGlobalData = useCallback(() => {
    try {
      const savedActs = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (savedActs) setActivities(JSON.parse(savedActs));
      
      const savedProms = localStorage.getItem(STORAGE_KEYS.PROMOTERS);
      if (savedProms) setPromoters(JSON.parse(savedProms));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1500);
    } catch (e) { console.error("Error al sincronizar datos locales", e); }
  }, []);

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleAddActivity = (activity: Activity) => {
    const newActivity = {
      ...activity,
      promoterId: activity.promoterId || currentPromoterId
    };
    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updatedActivities));
  };

  const handleBulkAddActivities = (newActivities: Activity[]) => {
    setActivities(prev => {
      // Evitar duplicados por ID si es que vienen de la misma fuente
      const existingIds = new Set(prev.map(a => a.id));
      const uniqueNew = newActivities.filter(a => !existingIds.has(a.id));
      const updated = [...uniqueNew, ...prev];
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
      return updated;
    });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) {
        if (adminViewPromoterId === 'ALL') return activities;
        return activities.filter(a => a.promoterId === adminViewPromoterId);
    }
    return activities.filter(a => a.promoterId === currentPromoterId);
  }, [activities, userRole, currentPromoterId, adminViewPromoterId]);

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
    { id: 'admin-assignments', label: 'Asignar', icon: 'fa-tasks', adminOnly: true },
    { id: 'team', label: 'Equipo', icon: 'fa-users-line', adminOnly: true },
    { id: 'user-management', label: 'Usuarios', icon: 'fa-user-gear', adminOnly: true },
    { id: 'admin-notifications', label: 'Avisos', icon: 'fa-bullhorn', adminOnly: true },
    { id: 'reports', label: 'Resumen IA', icon: 'fa-chart-pie', adminOnly: true },
    { id: 'admin-custom-reports', label: 'Reportes', icon: 'fa-file-invoice-dollar', adminOnly: true },
    { id: 'program', label: 'Agenda', icon: 'fa-calendar-plus' },
    { id: 'profile', label: 'Mi Perfil', icon: 'fa-user-circle' },
  ].filter(item => {
    if (item.adminOnly && userRole !== UserRole.ADMIN) return false;
    return true;
  });

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
          <i className="fa-solid fa-route text-2xl"></i>
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-white block leading-none">Promoter<span className="text-indigo-500">Flow</span></span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Gestión Institucional</span>
        </div>
      </div>
      <nav className="flex-1 px-5 mt-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id as View); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all ${
              activeView === item.id 
              ? 'bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-600/20' 
              : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-6 text-lg`}></i>
            <span className="text-sm uppercase tracking-wider text-[11px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <button onClick={handleLogout} className="w-full bg-slate-800/50 hover:bg-red-900/30 hover:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-black transition-all mb-6 uppercase tracking-widest text-slate-300">
          <i className="fa-solid fa-right-from-bracket"></i> Salir del Sistema
        </button>
        <div className="p-4 bg-slate-800/30 rounded-2xl flex items-center gap-4 border border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-all" onClick={() => setActiveView('profile')}>
          <img src={currentPromoter?.photo} className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-sm" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{currentPromoter?.name}</p>
            <p className="text-[8px] text-indigo-400 uppercase font-black tracking-[0.2em]">{userRole}</p>
          </div>
        </div>
      </div>
    </>
  );

  if (!isAuthenticated) return <Login onLogin={handleLogin} users={promoters} onUpdateUser={(id, up) => setPromoters(p => p.map(u => u.id === id ? {...u, ...up} : u))} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {showSaveSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-8 py-3 rounded-full text-[11px] font-black shadow-[0_20px_40px_rgba(5,150,105,0.3)] flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <i className="fa-solid fa-cloud-arrow-down text-lg"></i> DATOS SINCRONIZADOS CORRECTAMENTE
        </div>
      )}

      {!isMobile && (
        <aside className="bg-slate-900 text-slate-300 w-72 flex-shrink-0 flex flex-col border-r border-slate-800">
          <SidebarContent />
        </aside>
      )}

      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[500] flex">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative bg-slate-900 w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="safe-pt bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex justify-between items-center z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-bars"></i>
              </button>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">{navItems.find(i => i.id === activeView)?.label}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincronización en tiempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole === UserRole.ADMIN && activeView === 'program' && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista:</span>
                <select 
                  value={adminViewPromoterId} 
                  onChange={e => setAdminViewPromoterId(e.target.value)}
                  className="bg-slate-100 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">TODO EL EQUIPO</option>
                  {promoters.filter(p => p.role === UserRole.FIELD_PROMOTER).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={refreshGlobalData}
              className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
              title="Forzar Sincronización"
            >
              <i className="fa-solid fa-sync"></i> Actualizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-native">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="fa-users" color="text-indigo-600" bg="bg-indigo-50" label="Personal" value={promoters.length.toString()} />
                  <StatCard icon="fa-clipboard-list" color="text-blue-600" bg="bg-blue-50" label="Actividades" value={activities.length.toString()} />
                  <StatCard icon="fa-calendar-check" color="text-emerald-600" bg="bg-emerald-50" label="En Agenda" value={filteredActivities.length.toString()} />
                  <StatCard icon="fa-tower-broadcast" color="text-amber-600" bg="bg-amber-50" label="Red Sync" value="OK" />
                </div>
                <ActivityLog 
                  activities={filteredActivities} 
                  promoters={promoters} 
                  userRole={userRole} 
                  onUpdateActivity={handleUpdateActivity}
                  onAddActivity={handleAddActivity}
                  currentUserId={currentPromoterId}
                  onRefresh={refreshGlobalData}
                />
              </div>
            )}
            {activeView === 'program' && (
              <ProgramModule 
                promoterId={userRole === UserRole.ADMIN ? adminViewPromoterId : currentPromoterId}
                activities={filteredActivities} 
                promoters={promoters}
                onAddActivity={handleAddActivity}
                currentLocation={currentPromoter?.lastLocation || { lat: 13.6929, lng: -89.2182 }} 
                userRole={userRole}
                onRefresh={refreshGlobalData}
                onProgramLoaded={handleBulkAddActivities}
              />
            )}
            {activeView === 'activities' && (
              <ActivityLog 
                activities={filteredActivities} 
                promoters={promoters} 
                userRole={userRole} 
                onUpdateActivity={handleUpdateActivity}
                onAddActivity={handleAddActivity}
                currentUserId={currentPromoterId}
                onRefresh={refreshGlobalData}
              />
            )}
            {activeView === 'tracking' && <TrackingMap promoters={promoters} />}
            {activeView === 'team' && <TeamModule promoters={promoters} />}
            {activeView === 'user-management' && <UserManagementModule users={promoters} onAddUser={u => setPromoters(p => [u, ...p])} onUpdateUser={(id, up) => setPromoters(p => p.map(u => u.id === id ? {...u, ...up} : u))} onDeleteUser={id => setPromoters(p => p.filter(u => u.id !== id))} />}
            {activeView === 'profile' && currentPromoter && <ProfileModule user={currentPromoter} onUpdateUser={(id, up) => setPromoters(p => p.map(u => u.id === id ? {...u, ...up} : u))} />}
            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}
            {activeView === 'admin-notifications' && <AdminNotificationModule promoters={promoters} notifications={notifications} onSendNotification={n => setNotifications(prev => [{...n, id: Date.now().toString()} as any, ...prev])} />}
            {activeView === 'admin-assignments' && <AdminAssignmentModule adminId={currentPromoterId} promoters={promoters.filter(p => p.role === UserRole.FIELD_PROMOTER)} onAssignActivities={acts => setActivities(prev => [...acts, ...prev])} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, bg, label, value }: { icon: string, color: string, bg: string, label: string, value: string }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner`}><i className={`fa-solid ${icon}`}></i></div>
    <div className="overflow-hidden">
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest truncate">{label}</p>
      <p className="font-black text-slate-800 text-lg tracking-tighter leading-none mt-1">{value}</p>
    </div>
  </div>
);

export default App;
