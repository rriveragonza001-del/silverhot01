// App.tsx (FINAL - limpio, 1 sola pieza)
// - Sincroniza Activities desde Neon vía /api/activities (GET/POST)
// - Sincroniza Promoters (perfiles) vía /api/promoters (GET/PATCH) -> si NO existe, hace fallback a localStorage
// - Mantiene localStorage como cache/compatibilidad
// - Incluye helpers, mapRowToUiActivity, mapRowToUiPromoter, useEffect de carga, y 4 funciones sustituidas:
//   refreshGlobalData, handleAddActivity, handleBulkAddActivities, handleUpdateActivity
//
// IMPORTANTE (control admin de perfiles):
// Para que el ADMIN vea cambios hechos por cada promotor (foto/correo/clave/etc) desde OTRO dispositivo,
// esos cambios deben persistirse en servidor. Este App.tsx ya intenta usar /api/promoters.
// Si aún no tienes esa API creada, el admin SOLO verá cambios locales del mismo navegador.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_ACTIVITIES, MOCK_PROMOTERS } from './utils/mockData';
import { Activity, Promoter, UserRole, Notification } from './types';

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
  AUTH_ROLE: 'pf_auth_user_role_v7',
};

const DEFAULT_LOCATION = { lat: 13.6929, lng: -89.2182 };

/** =========================
 * Helpers API
 * ========================= */

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

/** ACTIVITIES */
async function apiGetActivities(params: { role: string; user?: string }) {
  const qs = new URLSearchParams();
  qs.set('role', params.role);
  if (params.user) qs.set('user', params.user);

  const r = await fetch(`/api/activities?${qs.toString()}`, { method: 'GET' });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || 'Error GET /api/activities');
  return data as { ok: true; items: any[] };
}

async function apiCreateActivity(payload: any) {
  const r = await fetch(`/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || 'Error POST /api/activities');
  return data as { ok: true; item: any };
}

/** PROMOTERS (perfiles) */
async function apiGetPromoters() {
  // Si tu backend no existe, esto caerá a catch y se usará localStorage/mock.
  const r = await fetch(`/api/promoters`, { method: 'GET' });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || 'Error GET /api/promoters');
  return data as { ok: true; items: any[] };
}

async function apiUpsertPromoter(id: string, updates: Partial<Promoter>) {
  // PATCH /api/promoters?id=...  (o ajusta según tu ruta real)
  const qs = new URLSearchParams();
  qs.set('id', id);

  const r = await fetch(`/api/promoters?${qs.toString()}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || 'Error PATCH /api/promoters');
  return data as { ok: true; item: any };
}

/** =========================
 * Mappers
 * ========================= */

function mapRowToUiActivity(row: any): Activity {
  const date = row.activity_date ?? row.date ?? '';
  const time = row.activity_time ?? row.time ?? '';

  return {
    id: String(row.id),
    promoterId: String(row.created_by ?? ''),

    community: row.community ?? '',
    objective: row.objective ?? row.title ?? '',
    date,
    time,
    status: (row.status ?? 'pendiente') as any,

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

    location: row.location ?? DEFAULT_LOCATION,
    observations: row.observations ?? [],
  } as Activity;
}

function mapRowToUiPromoter(row: any): Promoter {
  // Ajusta mapeo según tu tabla/campos reales en Neon (si ya los creaste).
  // Fallbacks para no romper.
  return {
    id: String(row.id ?? row.email ?? ''),
    name: row.name ?? row.full_name ?? 'Sin nombre',
    role: (row.role ?? UserRole.FIELD_PROMOTER) as any,
    email: row.email ?? '',
    photo: row.photo ?? row.avatar_url ?? '',
    isOnline: !!row.isOnline,
    lastConnection: row.lastConnection ?? row.last_connection ?? '',
    lastLocation: row.lastLocation ?? row.last_location ?? undefined,

    // Si tu tipo Promoter tiene password, phone, etc:
    ...(row.password ? { password: row.password } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
  } as Promoter;
}

/** Merge por id: preserva lo local cuando el server no trae un campo */
function mergePromotersById(localList: Promoter[], serverList: Promoter[]) {
  const map = new Map<string, Promoter>();
  for (const p of localList) map.set(p.id, p);
  for (const sp of serverList) {
    const prev = map.get(sp.id);
    map.set(sp.id, prev ? { ...prev, ...sp } : sp);
  }
  return Array.from(map.values());
}

/** =========================
 * App
 * ========================= */

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(STORAGE_KEYS.AUTH_ID));
  const [currentPromoterId, setCurrentPromoterId] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.AUTH_ID) || '');
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.AUTH_ROLE) as UserRole) || UserRole.ADMIN);

  const [promoters, setPromoters] = useState<Promoter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMOTERS);
      return saved ? JSON.parse(saved) : MOCK_PROMOTERS;
    } catch {
      return MOCK_PROMOTERS;
    }
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : MOCK_ACTIVITIES;
    } catch {
      return MOCK_ACTIVITIES;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [adminViewPromoterId, setAdminViewPromoterId] = useState<string>('ALL');

  const currentPromoter = useMemo(
    () => promoters.find((p) => p.id === currentPromoterId),
    [promoters, currentPromoterId]
  );

  /** Persistencia local (cache/compatibilidad) */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(promoters));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [promoters, activities, notifications]);

  /** Responsive */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Sync entre pestañas (localStorage) */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACTIVITIES && e.newValue) setActivities(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.PROMOTERS && e.newValue) setPromoters(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /** =========================
   * Carga inicial desde API
   * ========================= */
  useEffect(() => {
    if (!isAuthenticated || !currentPromoterId) return;

    (async () => {
      // 1) Cargar promoters desde API (para que admin vea perfiles actualizados)
      try {
        const pr = await apiGetPromoters();
        const serverProms = (pr.items || []).map(mapRowToUiPromoter);
        setPromoters((prev) => {
          const merged = mergePromotersById(prev, serverProms);
          localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(merged));
          return merged;
        });
      } catch (err) {
        // si no existe API aún, no rompas
        console.warn('No se pudo sincronizar /api/promoters (se usa localStorage).', err);
      }

      // 2) Cargar activities desde API
      try {
        const roleParam = userRole === UserRole.ADMIN ? 'admin' : 'gestor';
        const userParam = userRole === UserRole.ADMIN ? undefined : currentPromoterId;

        const data = await apiGetActivities({ role: roleParam, user: userParam });
        const mapped = (data.items || []).map(mapRowToUiActivity);

        setActivities(mapped);
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(mapped));
      } catch (err) {
        console.error('Error sincronizando Activities (GET /api/activities):', err);
      }
    })();
  }, [isAuthenticated, currentPromoterId, userRole]);

  /** =========================================================
   * 4 FUNCIONES SUSTITUIDAS (POST + Refresh)
   * ========================================================= */

  // refreshGlobalData: recarga Activities + Promoters (si existe API) y actualiza cache
  const refreshGlobalData = useCallback(async () => {
    try {
      // Promoters (perfiles) primero: control admin
      try {
        const pr = await apiGetPromoters();
        const serverProms = (pr.items || []).map(mapRowToUiPromoter);
        setPromoters((prev) => {
          const merged = mergePromotersById(prev, serverProms);
          localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(merged));
          return merged;
        });
      } catch (err) {
        // fallback silencioso
      }

      // Activities
      const roleParam = userRole === UserRole.ADMIN ? 'admin' : 'gestor';
      const userParam = userRole === UserRole.ADMIN ? undefined : currentPromoterId;

      const data = await apiGetActivities({ role: roleParam, user: userParam });
      const mapped = (data.items || []).map(mapRowToUiActivity);

      setActivities(mapped);
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(mapped));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1500);
    } catch (err) {
      console.error('refreshGlobalData error:', err);
      // fallback: localStorage
      try {
        const savedActs = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        if (savedActs) setActivities(JSON.parse(savedActs));
        const savedProms = localStorage.getItem(STORAGE_KEYS.PROMOTERS);
        if (savedProms) setPromoters(JSON.parse(savedProms));
      } catch {}
    }
  }, [userRole, currentPromoterId]);

  // handleAddActivity: POST a la API y luego refresh
  const handleAddActivity = useCallback(
    async (activity: Activity) => {
      try {
        const isAdmin = userRole === UserRole.ADMIN;

        const payload = {
          created_by: currentPromoterId || activity.promoterId || '',
          role: isAdmin ? 'admin' : 'gestor',
          assigned_to: (activity as any).assigned_to ?? null,

          objective: (activity as any).objective ?? (activity as any).title ?? '',
          community: (activity as any).community ?? null,
          date: (activity as any).date ?? null,
          time: (activity as any).time ?? null,
          status: (activity as any).status ?? 'pendiente',

          // compat: por si tu API aún usa title/description
          title: (activity as any).title ?? (activity as any).objective ?? '',
          description: (activity as any).description ?? null,
        };

        await apiCreateActivity(payload);
        await refreshGlobalData();
      } catch (err) {
        console.error('handleAddActivity error:', err);

        // fallback local
        const newActivity = {
          ...activity,
          id: (activity as any).id || 'act-' + Date.now(),
          promoterId: (activity as any).promoterId || currentPromoterId,
          location: (activity as any).location || DEFAULT_LOCATION,
        } as Activity;

        setActivities((prev) => {
          const updated = [newActivity, ...prev];
          localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
          return updated;
        });

        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 1500);
      }
    },
    [userRole, currentPromoterId, refreshGlobalData]
  );

  // handleBulkAddActivities: agrega localmente y luego refresh para traer la verdad del servidor
  const handleBulkAddActivities = useCallback(
    async (newActivities: Activity[]) => {
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const uniqueNew = newActivities.filter((a) => !existingIds.has(a.id));
        const updated = [...uniqueNew, ...prev];
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
        return updated;
      });

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1200);

      try {
        await refreshGlobalData();
      } catch {}
    },
    [refreshGlobalData]
  );

  // handleUpdateActivity: (sin endpoint PUT/PATCH) actualiza localmente
  const handleUpdateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    setActivities((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** =========================================================
   * Control ADMIN de perfiles: actualizar usuario (local + API)
   * ========================================================= */
  const handleUpsertPromoter = useCallback(
    async (id: string, updates: Partial<Promoter>) => {
      // 1) optimista local
      setPromoters((prev) => {
        const updated = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
        localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(updated));
        return updated;
      });

      // 2) persistir en servidor (si existe API)
      try {
        await apiUpsertPromoter(id, updates);
        // 3) recarga para que admin vea la verdad del servidor
        await refreshGlobalData();
      } catch (err) {
        // si aún no existe API, al menos no rompas la UI
        console.warn('No se pudo persistir perfil en /api/promoters. Quedó solo local.', err);
      }
    },
    [refreshGlobalData]
  );

  /** =========================
   * Filtrado (Registro/Dashboard)
   * ========================= */
  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) {
      if (adminViewPromoterId === 'ALL') return activities;
      return activities.filter((a) => a.promoterId === adminViewPromoterId);
    }
    return activities.filter((a) => a.promoterId === currentPromoterId);
  }, [activities, userRole, currentPromoterId, adminViewPromoterId]);

  /** =========================
   * Agenda (ProgramModule) - ADMIN debe ver TODO
   * ========================= */
  const agendaActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) {
      if (adminViewPromoterId === 'ALL') return activities;
      return activities.filter((a) => a.promoterId === adminViewPromoterId);
    }
    return activities.filter((a) => a.promoterId === currentPromoterId);
  }, [activities, userRole, currentPromoterId, adminViewPromoterId]);

  /** =========================
   * Auth
   * ========================= */
  const handleLogin = (role: UserRole, userId: string) => {
    setUserRole(role);
    setCurrentPromoterId(userId);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH_ID, userId);
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);

    setPromoters((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isOnline: true, lastConnection: new Date().toISOString() } : p))
    );
  };

  const handleLogout = () => {
    setPromoters((prev) =>
      prev.map((p) =>
        p.id === currentPromoterId ? { ...p, isOnline: false, lastConnection: new Date().toISOString() } : p
      )
    );
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
  };

  /** =========================
   * Navegación
   * ========================= */
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
  ].filter((item) => !(item.adminOnly && userRole !== UserRole.ADMIN));

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
        {navItems.map((item) => (
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
            src={currentPromoter?.photo}
            className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-sm"
          />
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{currentPromoter?.name}</p>
            <p className="text-[8px] text-indigo-400 uppercase font-black tracking-[0.2em]">{userRole}</p>
          </div>
        </div>
      </div>
    </>
  );

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        users={promoters}
        onUpdateUser={(id, up) => handleUpsertPromoter(id, up as any)}
      />
    );
  }

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
                {navItems.find((i) => i.id === activeView)?.label}
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincronización en tiempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole === UserRole.ADMIN && activeView === 'program' && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista:</span>
                <select
                  value={adminViewPromoterId}
                  onChange={(e) => setAdminViewPromoterId(e.target.value)}
                  className="bg-slate-100 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">TODO EL EQUIPO</option>
                  {promoters
                    .filter((p) => p.role === UserRole.FIELD_PROMOTER)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
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
                // CLAVE: NO mandes "ALL" como promoterId, porque muchos ProgramModule filtran por igualdad
                promoterId={
                  userRole === UserRole.ADMIN
                    ? (adminViewPromoterId === 'ALL' ? '' : adminViewPromoterId)
                    : currentPromoterId
                }
                activities={agendaActivities}
                promoters={promoters}
                onAddActivity={handleAddActivity}
                currentLocation={currentPromoter?.lastLocation || DEFAULT_LOCATION}
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

            {activeView === 'user-management' && (
              <UserManagementModule
                users={promoters}
                onAddUser={(u) => {
                  setPromoters((p) => {
                    const updated = [u, ...p];
                    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(updated));
                    return updated;
                  });
                  // si existe api, persiste (opcional)
                  handleUpsertPromoter((u as any).id, u as any);
                }}
                onUpdateUser={(id, up) => handleUpsertPromoter(id, up as any)}
                onDeleteUser={(id) =>
                  setPromoters((p) => {
                    const updated = p.filter((u) => u.id !== id);
                    localStorage.setItem(STORAGE_KEYS.PROMOTERS, JSON.stringify(updated));
                    return updated;
                  })
                }
              />
            )}

            {activeView === 'profile' && currentPromoter && (
              <ProfileModule
                user={currentPromoter}
                onUpdateUser={(id, up) => handleUpsertPromoter(id, up as any)}
              />
            )}

            {activeView === 'reports' && <PerformanceReport activities={activities} promoters={promoters} />}

            {activeView === 'admin-notifications' && (
              <AdminNotificationModule
                promoters={promoters}
                notifications={notifications}
                onSendNotification={(n) =>
                  setNotifications((prev) => [{ ...(n as any), id: Date.now().toString() }, ...prev])
                }
              />
            )}

            {activeView === 'admin-assignments' && (
              <AdminAssignmentModule
                adminId={currentPromoterId}
                promoters={promoters.filter((p) => p.role === UserRole.FIELD_PROMOTER)}
                onAssignActivities={(acts) =>
                  setActivities((prev) => {
                    const updated = [...acts, ...prev];
                    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
                    return updated;
                  })
                }
              />
            )}

            {/* ReportingModule / AdminReportGenerator quedan importados si en tu proyecto existen otros views */}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  color,
  bg,
  label,
  value,
}: {
  icon: string;
  color: string;
  bg: string;
  label: string;
  value: string;
}) => (
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

