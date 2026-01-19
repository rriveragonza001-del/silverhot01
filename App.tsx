import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Promoter,
  ActivityStatus,
  ActivityType,
  UserRole,
  Notification,
} from "./types";

import TrackingMap from "./components/TrackingMap";
import ActivityLog from "./components/ActivityLog";
import PerformanceReport from "./components/PerformanceReport";
import ProgramModule from "./components/ProgramModule";
import ReportingModule from "./components/ReportingModule";
import AdminReportGenerator from "./components/AdminReportGenerator";
import TeamModule from "./components/TeamModule";
import Login from "./components/Login";
import UserManagementModule from "./components/UserManagementModule";
import AdminNotificationModule from "./components/AdminNotificationModule";
import AdminAssignmentModule from "./components/AdminAssignmentModule";
import ProfileModule from "./components/ProfileModule";

type View =
  | "dashboard"
  | "tracking"
  | "activities"
  | "reports"
  | "program"
  | "admin-custom-reports"
  | "team"
  | "user-management"
  | "admin-notifications"
  | "admin-assignments"
  | "profile";

/* ======================================================
   HELPERS (FUERA DEL COMPONENTE)
====================================================== */

function mapRowToUiActivity(row: any): Activity {
  return {
    id: String(row.id),
    promoterId: row.created_by,
    community: row.community ?? "",
    objective: row.objective ?? row.title ?? "",
    date: row.activity_date ?? "",
    time: row.activity_time ?? "",
    status: row.status ?? ActivityStatus.PENDING,

    attendeeName: "",
    attendeeRole: "",
    attendeePhone: "",
    proposals: "",
    agreements: "",
    additionalObservations: "",
    driveLinks: "",
    referral: "",
    companions: "",
    verificationPhoto: "",

    location: { lat: 13.6929, lng: -89.2182 },
    observations: row.observations ?? [],
  };
}

function toApiPayload(activity: Activity, role: UserRole) {
  const isAdmin = role === UserRole.ADMIN;

  return {
    created_by: activity.promoterId,
    role: role.toLowerCase(),
    assigned_to: isAdmin ? activity.promoterId : "admin@demo.com",
    objective: activity.objective,
    community: activity.community,
    date: activity.date,
    time: activity.time,
    status: activity.status,
  };
}

/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPromoterId, setCurrentPromoterId] = useState("");
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [activeView, setActiveView] = useState<View>("dashboard");

  /* ======================================================
     🔁 FUNCIONES REEMPLAZADAS (PASO 3.4)
  ====================================================== */

  const refreshGlobalData = useCallback(async () => {
    try {
      const role =
        userRole === UserRole.ADMIN ? "admin" : "gestor";

      const userParam =
        userRole === UserRole.ADMIN
          ? ""
          : `&user=${encodeURIComponent(currentPromoterId)}`;

      const res = await fetch(
        `/api/activities?role=${role}${userParam}`
      );

      const data = await res.json();

      if (data.ok) {
        const mapped = data.items.map(mapRowToUiActivity);
        setActivities(mapped);
      }
    } catch (err) {
      console.error("Error sincronizando actividades", err);
    }
  }, [userRole, currentPromoterId]);

  const handleAddActivity = async (activity: Activity) => {
    try {
      const payload = toApiPayload(activity, userRole);

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        await refreshGlobalData();
      }
    } catch (err) {
      console.error("Error creando actividad", err);
    }
  };

  const handleBulkAddActivities = async (newActivities: Activity[]) => {
    for (const act of newActivities) {
      await handleAddActivity(act);
    }
  };

  const handleUpdateActivity = async (
    id: string,
    updates: Partial<Activity>
  ) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  /* ======================================================
     🔄 CARGA INICIAL (PASO 3.3)
  ====================================================== */

  useEffect(() => {
    if (isAuthenticated) {
      refreshGlobalData();
    }
  }, [isAuthenticated, refreshGlobalData]);

  /* ======================================================
     LOGIN / LOGOUT
  ====================================================== */

  const handleLogin = (role: UserRole, userId: string) => {
    setUserRole(role);
    setCurrentPromoterId(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPromoterId("");
  };

  /* ======================================================
     FILTRO
  ====================================================== */

  const filteredActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) return activities;
    return activities.filter(
      (a) => a.promoterId === currentPromoterId
    );
  }, [activities, userRole, currentPromoterId]);

  /* ======================================================
     RENDER
  ====================================================== */

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        users={promoters}
        onUpdateUser={() => {}}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50">
      {activeView === "dashboard" && (
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

      {activeView === "program" && (
        <ProgramModule
          promoterId={currentPromoterId}
          activities={filteredActivities}
          promoters={promoters}
          onAddActivity={handleAddActivity}
          currentLocation={{ lat: 13.6929, lng: -89.2182 }}
          userRole={userRole}
          onRefresh={refreshGlobalData}
          onProgramLoaded={handleBulkAddActivities}
        />
      )}

      {activeView === "tracking" && (
        <TrackingMap promoters={promoters} />
      )}

      {activeView === "profile" && (
        <ProfileModule
          user={promoters.find((p) => p.id === currentPromoterId)!}
          onUpdateUser={() => {}}
        />
      )}
    </div>
  );
};

export default App;
