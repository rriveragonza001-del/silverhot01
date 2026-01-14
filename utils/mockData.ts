
import { Promoter, Activity, ActivityStatus, ProblemType, UserRole } from '../types';

export const MOCK_PROMOTERS: Promoter[] = [
  {
    id: 'p1',
    name: 'Carlos Mendoza',
    photo: 'https://picsum.photos/seed/p1/200/200',
    email: 'admin',
    password: 'admin123',
    phone: '+52 555 123 4567',
    position: 'Supervisor de Sistemas',
    status: 'active',
    isOnline: true,
    lastLocation: { lat: 19.4326, lng: -99.1332, address: 'Zócalo CDMX' },
    lastUpdated: new Date().toISOString(),
    lastConnection: new Date().toISOString(),
    zone: 'Zona Centro',
    role: UserRole.ADMIN
  },
  {
    id: 'p2',
    name: 'Elena Rodríguez',
    photo: 'https://picsum.photos/seed/p2/200/200',
    email: 'gestor',
    password: 'gestor123',
    phone: '+52 555 987 6543',
    position: 'Gestor Operativo',
    status: 'away',
    isOnline: false,
    lastLocation: { lat: 19.4194, lng: -99.1673, address: 'Roma Norte' },
    lastUpdated: new Date().toISOString(),
    lastConnection: new Date(Date.now() - 3600000).toISOString(),
    zone: 'Zona Norte',
    role: UserRole.FIELD_PROMOTER
  },
  {
    id: 'p3',
    name: 'Roberto Gómez',
    photo: 'https://picsum.photos/seed/p3/200/200',
    email: 'roberto.g@promoterflow.com',
    password: '123',
    phone: '+52 555 111 2222',
    position: 'Gestor Técnico',
    status: 'active',
    isOnline: true,
    lastLocation: { lat: 19.3907, lng: -99.2837, address: 'Santa Fe' },
    lastUpdated: new Date().toISOString(),
    lastConnection: new Date().toISOString(),
    zone: 'Zona Sur',
    role: UserRole.FIELD_PROMOTER
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    promoterId: 'p1',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    community: 'Sector Sur 4',
    objective: 'Visita Sector 4 - Diagnóstico',
    attendeeName: 'Maria Lopez',
    attendeeRole: 'Presidenta Junta Vecinal',
    attendeePhone: '555-0102',
    proposals: 'Relevamiento de necesidades básicas en el sector sur.',
    problemsIdentified: ProblemType.LUMINARIAS,
    agreements: 'Se acordó revisión técnica.',
    additionalObservations: 'Se detectó falta de alumbrado. Vecinos conformes.',
    driveLinks: '',
    referral: '',
    companions: '',
    status: ActivityStatus.COMPLETED,
    location: { lat: 19.4326, lng: -99.1332 },
    verificationPhoto: 'https://picsum.photos/seed/work1/400/300'
  }
];
