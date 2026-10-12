export type MealCategory = 'entree' | 'plat' | 'dessert';

export interface MenuItem {
  id: string;
  category: MealCategory;
  name: string;
  description: string;
  allergens: string[];
  isVegetarian?: boolean;
  calories?: number;
  imageUrl?: string;
  isPlatDuJour?: boolean; // Marqueur du plat vedette du jour
}

export interface DailyMenu {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  entrees: MenuItem[];
  plats: MenuItem[];
  desserts: MenuItem[];
  breadBeverageIncluded: boolean;
  chefNote?: string;
  featuredPlatId?: string; // Plat du jour sélectionné
  isActive?: boolean; // Menu actuellement affiché et sélectionné par l'admin
  coverImageUrl?: string; // Image de couverture / bannière du menu
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'served';

export type UserApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface AuthorizedUser {
  id: string;
  badgeNumber: string; // Matricule / N° de badge (ex: AG-104)
  lastName?: string; // Nom de famille (ex: MARTIN, BENALI)
  firstName?: string; // Prénom (ex: Claire, Karim)
  role?: string; // Fonction / Titre / Poste (ex: Enseignant EPS, Médecin, Entraîneur...)
  fullName: string; // Nom & Prénom complet
  department: string; // Service / Pôle
  email?: string;
  dietaryNotes?: string;
  active: boolean; // Autorisé ou suspendu
  approvalStatus?: UserApprovalStatus; // Statut d'approbation : 'approved' | 'pending' | 'rejected'
  registeredAt?: string; // Horodatage de la demande d'enregistrement
  approvedAt?: string; // Horodatage de l'approbation
  createdAt: string;
}

export interface Reservation {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  staffName: string;
  staffDepartment: string;
  staffEmail?: string;
  selectedEntreeId?: string;
  selectedPlatId: string;
  selectedDessertId?: string;
  dietaryNotes?: string;
  timeSlot: string; // e.g. "12h00 - 12h30"
  status: ReservationStatus;
  ticketCode: string; // Short code e.g. "REP-842"
  servedAt?: string; // Timestamp when meal was scanned and served
}

export interface AppSettings {
  establishmentName: string;
  establishmentType: string; // "Établissement Scolaire", "Centre Hospitalier", "Entreprise", etc.
  capacityPerDay: number;
  bookingWindowStart: string; // "08:00"
  bookingWindowEnd: string; // "10:00"
  serviceHours: string; // "11h45 - 13h45"
  adminPasswordHash: string; // Hashed or encoded representation
  allowCancellation: boolean;
  kitchenContactEmail: string;
  logoUrl?: string; // Custom uploaded image (Data URL) or web URL
  logoIcon?: string; // Icon preset identifier (e.g., 'utensils', 'hospital', 'school', 'chef', 'building')
  restrictToAuthorizedUsers: boolean; // Vérifie que l'agent est dans la liste autorisée
  activeMenuId?: string; // ID du menu sélectionné par l'admin pour affichage
  supabaseUrl?: string; // Configuration Supabase URL
  supabaseAnonKey?: string; // Configuration Supabase Anon Key
  useSupabaseBackend?: boolean; // Activer le stockage distant Supabase
}

export interface TimeCheckResult {
  isOpen: boolean;
  state: 'BEFORE_WINDOW' | 'IN_WINDOW' | 'AFTER_WINDOW';
  message: string;
  timeRemaining?: string;
  currentDisplayTime: string;
  startTime: string;
  endTime: string;
}

export interface SupabaseSyncStatus {
  isConnected: boolean;
  url: string;
  menusCount: number;
  usersCount: number;
  reservationsCount: number;
  lastSyncTime?: string;
  error?: string;
}

export interface RealtimeSyncInfo {
  isConnected: boolean;
  provider: 'supabase' | 'local';
  lastSyncAt: Date | null;
  lastEvent?: { table: string; action?: string; timestamp: Date } | null;
  channelStatus: 'SUBSCRIBED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
}
