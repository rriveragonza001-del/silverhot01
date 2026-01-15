
export enum ActivityStatus {
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Proceso',
  COMPLETED = 'Completado',
  CANCELLED = 'Cancelado'
}

export enum ActivityType {
  COMMUNITY_VISIT = 'Visita Comunitaria',
  COMPLAINT_FOLLOWUP = 'Seguimiento a Denuncias',
  COMMUNITY_MEETING = 'Reunion Comunitaria',
  LEGALIZATION_PROCESS = 'Proceso de Legalizacion',
  OATH_TAKING = 'Juramentacion',
  CONSTITUTION = 'Constitucion',
  WORK_FOLLOWUP = 'Seguimiento de obra',
  SOCIAL_ACTIVITY = 'Actividad social',
  TRAINING_ACTIVITY = 'Actividad formativa',
  OTHER = 'Otra'
}

export enum ProblemType {
  LUMINARIAS = 'FALLAS EN LUMINARIAS PUBLICAS',
  CALLES = 'CALLES EN MAL ESTADO',
  BASURA = 'PROBLEMA DE BASURA',
  VECINALES = 'PROBLEMAS VECINALES',
  ORGANIZACION = 'PROBLEMAS DE ORGANIZACION COMUNITARIA',
  ARBOLES = 'ARBOLES EN RIESGO',
  ZONA_VERDE = 'ZONA VERDE SUCIA',
  OTRAS = 'OTRAS'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  FIELD_PROMOTER = 'FIELD_PROMOTER'
}

export enum ReportPeriod {
  DAILY = 'Diario',
  WEEKLY = 'Semanal',
  MONTHLY = 'Mensual',
  ANNUAL = 'Anual'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Activity {
  id: string;
  promoterId: string;
  date: string;
  time: string; 
  community: string;
  objective: string;
  attendeeName: string;
  attendeeRole: string;
  attendeePhone: string;
  proposals: string;
  problemsIdentified: ProblemType | string;
  agreements: string;
  additionalObservations: string;
  driveLinks: string; 
  referral: string;
  companions: string;
  status: ActivityStatus;
  location: Location;
  type: ActivityType;
  verificationPhoto?: string;
  galleryPhotos?: string[];
  adminComments?: string;
  assignedBy?: string;
  cancellationReason?: string;
  willReschedule?: boolean;
}

export interface Promoter {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  position: string;
  password?: string;
  status: 'active' | 'inactive' | 'away';
  isOnline: boolean;
  lastLocation: Location;
  lastUpdated: string;
  lastConnection: string;
  zone?: string;
  role: UserRole;
  googleDriveConnected?: boolean;
  googleCalendarSynced?: boolean;
  mustChangePassword?: boolean;
  username?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'NEW_ACTION' | 'PROGRAM_UPLOAD' | 'USER_LOGIN' | 'ADMIN_ANNOUNCEMENT' | 'ADMIN_WARNING';
  senderId?: string;
  recipientId?: string;
}
