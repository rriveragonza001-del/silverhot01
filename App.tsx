// App.tsx
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

type View =
  | 'dashboard'
  | 'tracking'
  | 'activities'
  | 'reports'
  | 'program'
  | 'final-report'
  | 'admin-custom-reports'
  | 'team'
  | 'user-management'
  | 'admin-notifications'
  | 'admin-assignments'
  | 'profile';

const STORAGE_KEYS = {
  PROMOTERS: 'pf_promoters_v7',
  ACTIVITIES: 'pf_activities_v7',
  NOTIFICATIONS: 'pf_notifications_v7',
  AUTH_ID: 'pf_auth_user_id_v7',
  AUTH_ROLE: 'pf_auth_user_role_v7'
};

/**
 * Ajusta aquí si tu Promoter no tiene "email".
 * - Si sí tiene: return p.email
 * - Si no: usa el campo correcto (p.username, p.userEmail, etc.)
 */
function getUserEmailFromPromoter(p?: Promoter | null) {
  // @ts-ignore (por si tu type Promoter no define email aún)
  const email = (p as any)?.email;
  if (email && typeof email === 'string') return email;

  // fallback: en algunos proyectos usan id como email
  if (p?.id) return p.id;

  return '';
}

function mapRowToUiActivity(row: any): Activity {
  // Normaliza "date/time"
  const date = row.activity_date ?? row.date ?? '';
  const time = row.activity_time ?? row.time ?? '';

  return {
    id: String(row.id),
    promoterId: row.created_by, // OJO: aquí promoterId pasa a ser EMAIL (created_by)

    community: row.community ?? '',
    objective: row.objective ?? row.title ?? '',
    date,
    time,
    status: row.status ?? ActivityStatus.PENDING,

    attendeeName: row.attendeeName ?? '',
    attendeeRole: row.attendeeRole ?? '',
    attendeePhone: row.attendeePhone ?? '',
    proposals: row.proposals ?? '',
    agreements: row.agreements ?? '',
    additionalObservations: row.additionalObservations ?? '',
    driveLinks: row.driveLinks ?? '',
    referral: row.referral ?? '',
    companions: row.companions ?? '',
    verificationPhoto: row.verificationPhoto ?? '',

    location: row.location ?? { lat: 13.6929, lng: -89.2182 },

    // Si tu API trae observaciones (json_agg)
    observations: row.observations ?? []
  } as any;
}
// ===== API helpers (Front) =====
async function apiListActivities(params: { role: string; user?: string }) {
  const qs = new URLSearchParams();
  qs.set("role", params.role);
  if (params.user) qs.set("user", params.user);

  const r = await fetch(`/api/activities?${qs.toString()}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error listando actividades");
  return data as { ok: true; items: any[] };
}

async function apiCreateActivity(payload: any) {
  const r = await fetch(`/api/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error creando actividad");
  return data as { ok: true; item: any };
}

// Convierte fila de BD -> Activity de tu UI
function mapRowToUiActivity(row: any) {
  const date = row.activity_date ?? row.date ?? "";
  const time = row.activity_time ?? row.time ?? "";

  return {
    id: String(row.id),
    promoterId: String(row.created_by ?? ""),
    community: row.community ?? "",
    objective: row.objective ?? row.title ?? "",

    date,
    time,
    status: row.status ?? "pendiente",

    // extras (si no existen en BD quedarán vacíos)
    attendeeName: row.attendeeName ?? "",
    attendeeRole: row.attendeeRole ?? "",
    attendeePhone: row.attendeePhone ?? "",
    proposals: row.proposals ?? "",
    agreements: row.agreements ?? "",
    additionalObservations: row.additionalObservations ?? "",
    driveLinks: row.driveLinks ?? "",
    referral: row.referral ?? "",
    companions: row.companions ?? "",
    verificationPhoto: row.verificationPhoto ?? "",
    location: row.location ?? { lat: 13.6929, lng: -89.2182 },
    observations: row.observations ?? [],
  };
}

// Convierte Activity de tu UI -> payload para tu API
function mapUiActivityToApiPayload(activity: any, ctx: { currentUserId: string; userRole: string }) {
  const isAdmin = String(ctx.userRole).toLowerCase() === "admin";

  return {
    created_by: ctx.currentUserId,     // tu login ID (en tu demo son emails)
    role: isAdmin ? "admin" : "gestor",
    assigned_to: activity.assigned_to ?? (isAdmin ? (activity.promoterId ?? null) : "admin@demo.com"),

    // Tu API acepta objective o title (según tu versión)
    objective: activity.objective ?? activity.title ?? "",
    community: activity.community ?? null,
    date: activity.date ?? null,
    time: activity.time ?? null,
    status: activity.status ?? "pendiente",
  };
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(STORAGE_KEYS.AUTH_ID));
  const [currentPromoterId, setCurrentPromoterId] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.AUTH_ID) || '');
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.AUTH_ROLE) as UserRole) || UserRole.ADMIN);

  const [promoters, setPromoters] = useState<Promoter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMOTERS);
      return saved ? JSON.parse(saved) : MOCK_PROMOTERS;
    } catch (e) {
      return MOCK_PROMOTERS;
    }
  });

  /**
   * ACTIVITIES:
   * - mantenemos el cache local si existe, pero la verdad la traerá la API.
   * - apenas se autentique el usuario, se refresca desde /api/activities
   */
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : MOCK_ACTIVITIES;
    } catch (e) {
      return MOCK_ACTIVITIES;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminViewPromoterId, setAdminViewPromoterId] = useState<string>('ALL');

  const [isSyncingApi, setIsSyncingApi] = useState(false);

  const currentPromoter = useMemo(
    () => promoters.find(p => p.id === currentPromoterId),
    [promoters, currentPromoterId]
  );

  const currentUserEmail = useMemo(() => getUserEmailFromPromoter(currentPromoter), [currentPromoter]);

  // Mantener promotores/avisos en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(promoters));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [promoters, notifications]);

  // Cache local opcional para activities (no manda, solo cache)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * SINCRONIZACIÓN REAL: trae actividades de la BD vía API
   */
  const refreshActivitiesFromApi = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsSyncingApi(true);
    try {
      const isAdmin = userRole === UserRole.ADMIN;
      const qs = isAdmin
        ? `?role=admin`
        : `?role=gestor&user=${encodeURIComponent(currentUserEmail)}`;

      const r = await fetch(`/api/activities${qs}`);
      const data = await r.json();

      if (!r.ok) throw new Error(data?.error || 'Error loading activities');

      const mapped: Activity[] = (data.items || []).map(mapRowToUiActivity);

      setActivities(mapped);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1500);
    } catch (e) {
      console.error('refreshActivitiesFromApi:', e);
    } finally {
      setIsSyncingApi(false);
    }
  }, [isAuthenticated, userRole, currentUserEmail]);

  /**
   * Ejecutar refresh al autenticarse o cambiar usuario/rol
   */
  useEffect(() => {
    if (isAuthenticated && currentUserEmail) {
      refreshActivitiesFromApi();
    }
  }, [isAuthenticated, currentUserEmail, userRole, refreshActivitiesFromApi]);

  /**
   * Crear actividad en BD (POST /api/activities)
   * Nota: tu API hoy guarda objective/community/date/time/status y relaciona por created_by/assigned_to (emails).
   */
  const handleAddActivityApi = useCallback(
    async (activity: Activity) => {
      try {
        const isAdmin = userRole === UserRole.ADMIN;

        const payload = {
          created_by: currentUserEmail,
          role: isAdmin ? 'admin' : 'gestor',

          // Si el admin asigna, debe mandar assigned_to (email).
          // Si el gestor crea, puedes asignar al admin o dejar null.
          assigned_to: isAdmin ? (activity.assigned_to ?? null) : 'admin@demo.com',

          objective: activity.objective,
          community: activity.community,
          date: activity.date,
          time: activity.time,
          status: activity.status ?? 'pendiente'
        };

        const r = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || 'Error creating activity');

        // Refresca desde BD para que quede igual en todos los dispositivos
        await refreshActivitiesFromApi();
      } catch (e) {
        console.error('handleAddActivityApi:', e);
      }
    },
    [userRole, currentUserEmail, refreshActivitiesFromApi]
  );

  /**
   * Actualizaciones locales (por ahora) para status/inputs.
   * OJO: esto NO persiste en BD aún. Luego hacemos PATCH /api/activities/:id
   */
  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  /**
   * Bulk load (por ahora local). Si ProgramModule importa, lo podemos llevar a BD después.
   */
  const handleBulkAddActivities = (newActivities: Activity[]) => {
    setActivities(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const uniqueNew = newActivities.filter(a => !existingIds.has(a.id));
      const updated = [...uniqueNew, ...prev];
      return updated;
    });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  /**
   * FILTRO:
   * - Como ahora promoterId = created_by (EMAIL)
   * - entonces gestor filtra por email, no por id interno
   */
  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) {
      if (adminViewPromoterId === 'ALL') return activities;

      const p = promoters.find(x => x.id === adminViewPromoterId);
      const email = getUserEmailFromPromoter(p);

      return activities.filter(a => a.promoterId === email);
    }
    return activities.filter(a => a.promoterId === currentUserEmail);
  }, [activities, userRole, currentUserEmail, adminViewPromoterId, promoters]);

  const handleLogin = (role: UserRole, userId: string) => {
    setUserRole(role);
    setCurrentPromoterId(userId);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH_ID, userId);
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);

    setPromoters(prev =>
      prev.map(p => (p.id === userId ? { ...p, isOnline: true, lastConnection: new Date().toISOString() } : p))
    );
  };

  const handleLogout = () => {
    setPromoters(prev =>
      prev.map(p => (p.id === currentPromoterId ? { ...p, isOnline: false, lastConnection: new Date().toISOString() } : p))
    );
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
    { id: 'profile', label: 'Mi Perfil', icon: 'fa-user-circle' }
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
          <span className="text-2xl font-black tracking-tight text-white block leading-none">
            Promoter<span className="text-indigo-500">Flow</span>
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">
            Gestión Institucional
          </span>
        </div>
      </div>

      <nav className="flex-1 px-5 mt-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id as View);
              setIsMobileMenuOpen(false);
            }}
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
        <button
          onClick={handleLogout}
          className="w-full bg-slate-800/50 hover:bg-red-900/30 hover:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-black transition-all mb-6 uppercase tracking-widest text-slate-300"
        >
          <i className="fa-solid fa-right-from-bracket"></i> Salir del Sistema
        </button>
        <div
          className="p-4 bg-slate-800/30 rounded-2xl flex items-center gap-4 border border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-all"
          onClick={() => setActiveView('profile')}
        >
          <img
            src={(currentPromoter as any)?.photo}
            className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-sm"
          />
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
              {(currentPromoter as any)?.name}
            </p>
            <p className="text-[8px] text-indigo-400 uppercase font-black tracking-[0.2em]">{userRole}</p>
          </div>
        </div>
      </div>
    </>
  );

  if (!isAuthenticated)
    return (
      <Login
        onLogin={handleLogin}
        users={promoters}
        onUpdateUser={(id, up) => setPromoters(p => p.map(u => (u.id === id ? { ...(u as any), ...(up as any) } : u)))}
      />
    );

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
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">
                {navItems.find(i => i.id === activeView)?.label}
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Sincronización en tiempo real
              </p>
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
                  {promoters.filter((p: any) => p.role === UserRole.FIELD_PROMOTER).map(p => (
                    <option key={p.id} value={p.id}>
                      {(p as any).name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={refreshActivitiesFromApi}
              className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
              title="Sincronizar desde BD"
            >
              <i className={`fa-solid fa-sync ${isSyncingApi ? 'fa-spin' : ''}`}></i> Actualizar
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
                  onAddActivity={handleAddActivityApi}
                  currentUserId={currentPromoterId}
                  onRefresh={refreshActivitiesFromApi}
                />
              </div>
            )}

            {activeView === 'program' && (
              <ProgramModule
                promoterId={userRole === UserRole.ADMIN ? adminViewPromoterId : currentPromoterId}
                activities={filteredActivities}
                promoters={promoters}
                onAddActivity={handleAddActivityApi}
                currentLocation={(currentPromoter as any)?.lastLocation || { lat: 13.6929, lng: -89.2182 }}
                userRole={userRole}
                onRefresh={refreshActivitiesFromApi}
                onProgramLoaded={handleBulkAddActivities}
              />
            )}

            {activeView === 'activities' && (
              <ActivityLog
                activities={filteredActivities}
                promoters={promoters}
                userRole={userRole}
                onUpdateActivity={handleUpdateActivity}
                onAddActivity={handleAddActivityApi}
                currentUserId={currentPromoterId}
                onRefresh={refreshActivitiesFromApi}
              />
            )}

            {activeView === 'tracking' && <TrackingMap promoters={promoters} />}
            {activeView === 'team' && <TeamModule promoters={promoters} />}

            {activeView === 'user-management' && (
              <UserManagementModule
                users={promoters}
                onAddUser={(u: any) => setPromoters(p => [u, ...p])}
                onUpdateUser={(id: string, up: any) => setPromoters(p => p.map(u => (u.id === id ? { ...(u as any), ...(up as any) } : u)))}
                onDeleteUser={(id: string) => setPromoters(p => p.filter(u => u.id !== id))}
              />
            )}

            {activeView === 'profile' && currentPromoter && (
              <ProfileModule
                user={currentPromoter as any}
                onUpdateUser={(id: string, up: any) => setPromoters(p => p.map(u => (u.id === id ? { ...(u as any), ...(up as any) } : u)))}
              />
            )}

            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}

            {activeView === 'admin-notifications' && (
              <AdminNotificationModule
                promoters={promoters}
                notifications={notifications}
                onSendNotification={(n: any) => setNotifications(prev => [{ ...(n as any), id: Date.now().toString() } as any, ...prev])}
              />
            )}

            {activeView === 'admin-assignments' && (
              <AdminAssignmentModule
                adminId={currentPromoterId}
                promoters={promoters.filter((p: any) => p.role === UserRole.FIELD_PROMOTER)}
                onAssignActivities={(acts: any[]) => {
                  // OJO: esto sigue siendo local. Luego lo convertimos a POST masivo a BD.
                  setActivities(prev => [...acts, ...prev]);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, bg, label, value }: { icon: string; color: string; bg: string; label: string; value: string }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div className="overflow-hidden">
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest truncate">{label}</p>
      <p className="font-black text-slate-800 text-lg tracking-tighter leading-none mt-1">{value}</p>
    </div>
  </div>
);

export default App;
// =========================
// API helpers (App.tsx)
// =========================
async function apiFetchActivities(userRole: UserRole, currentUserId: string) {
  const role = userRole === UserRole.ADMIN ? "admin" : "gestor";

  const url =
    role === "admin"
      ? `/api/activities?role=admin`
      : `/api/activities?role=gestor&user=${encodeURIComponent(currentUserId)}`;

  const r = await fetch(url);
  const d = await r.json();
  if (!d?.ok) throw new Error(d?.error || "API error");
  return d.items as any[];
}

async function apiCreateActivity(payload: any) {
  const r = await fetch(`/api/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!d?.ok) throw new Error(d?.error || "API error");
  return d.item;
}

async function apiPatchActivity(payload: any) {
  const r = await fetch(`/api/activities`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
 

