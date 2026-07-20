export type PatientsWorkspaceTab = 'operations' | 'directory' | 'alerts';

export type QuickActionModalType = 'print-card' | 'print-barcode' | 'generate-qr' | 'send-sms' | null;

export type RegistrationChannel = 'walk-in' | 'emergency' | 'corporate' | 'family';

export const PATIENTS_WORKSPACE_TABS: { id: PatientsWorkspaceTab; label: string; description: string }[] = [
  { id: 'operations', label: 'Operations & Metrics', description: 'Census · intake · analytics · quick actions' },
  { id: 'directory', label: 'Patient Search & Directory', description: 'Advanced filters · full records · detail drawer' },
  { id: 'alerts', label: 'Alerts & Communication', description: 'Clinical warnings · SMS · email · WhatsApp logs' },
];
