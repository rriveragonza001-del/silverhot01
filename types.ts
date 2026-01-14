
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

export interface CommunityContact {
  name: string;
  phone: string;
  hasWhatsApp: boolean;
  role: string;
  community: string;
}

export interface Promoter {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  position: string;
  status: 'active' | 'inactive' | 'away';
  isOnline: boolean;
  lastLocation: Location;
  lastUpdated: string;
  lastConnection: string;
  zone?: string;
  role: UserRole;
}

export interface Activity {
  id: string;
  promoterId: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: ActivityStatus;
  location: Location;
  observations?: string;
  incidents?: string;
  adminComments?: string;
  verificationPhoto?: string;
  communityContact?: CommunityContact;
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
