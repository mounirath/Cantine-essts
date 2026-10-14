export type MealCategory = 'entree' | 'plat' | 'dessert';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealTypeMeta {
  id: MealType;
  label: string;
  labelAr: string;
  icon: string;
  defaultSlots: string[];
  defaultHours: string;
  ticketPrefix: string;
  color: string;
}

export const MEAL_TYPES_CONFIG: Record<MealType, MealTypeMeta> = {
  breakfast: {
    id: 'breakfast',
    label: 'Petit-déjeuner',
    labelAr: 'وجبة الإفطار',
    icon: '🥐',
    defaultSlots: ['07h00 - 07h30', '07h30 - 08h00', '08h00 - 08h30', '08h30 - 09h00'],
    defaultHours: '07h00 - 09h00',
    ticketPrefix: 'PDJ',
    color: 'amber',
  },
  lunch: {
    id: 'lunch',
    label: 'Repas de midi (Déjeuner)',
    labelAr: 'وجبة الغداء',
    icon: '🍽️',
    defaultSlots: ['11h45 - 12h15', '12h15 - 12h45', '12h45 - 13h15', '13h15 - 13h45'],
    defaultHours: '11h45 - 13h45',
    ticketPrefix: 'REP',
    color: 'emerald',
  },
  dinner: {
    id: 'dinner',
    label: 'Dîner (Soir)',
    labelAr: 'وجبة العشاء',
    icon: '🌙',
    defaultSlots: ['19h00 - 19h30', '19h30 - 20h00', '20h00 - 20h30', '20h30 - 21h00'],
    defaultHours: '19h00 - 21h00',
    ticketPrefix: 'DIN',
    color: 'indigo',
  },
};

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
  mealType?: MealType | 'all'; // Repas spécifique ou tous
}

export interface DailyMenu {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  // Déjeuner (Midi)
  entrees: MenuItem[];
  plats: MenuItem[];
  desserts: MenuItem[];
  // Petit-déjeuner
  breakfastItems?: MenuItem[];
  // Dîner (Repas du soir)
  dinnerEntrees?: MenuItem[];
  dinnerPlats?: MenuItem[];
  dinnerDesserts?: MenuItem[];
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
  mealType?: MealType; // 'breakfast' | 'lunch' | 'dinner'
  selectedEntreeId?: string;
  selectedPlatId: string;
  selectedDessertId?: string;
  dietaryNotes?: string;
  timeSlot: string; // e.g. "12h00 - 12h30", "07h30 - 08h00", "19h30 - 20h00"
  status: ReservationStatus;
  ticketCode: string; // Short code e.g. "REP-842", "PDJ-102", "DIN-304"
  servedAt?: string; // Timestamp when meal was scanned and served
}

export interface AppSettings {
  establishmentName: string;
  establishmentType: string; // "Établissement Scolaire", "Centre Hospitalier", "Entreprise", etc.
  capacityPerDay: number;
  bookingWindowStart: string; // "08:00"
  bookingWindowEnd: string; // "10:00"
  breakfastServiceHours?: string; // "07h00 - 09h00"
  serviceHours: string; // "11h45 - 13h45" (Midi)
  dinnerServiceHours?: string; // "19h00 - 21h00" (Soir)
  adminPasswordHash: string; // Hashed or encoded representation
  allowCancellation: boolean;
  kitchenContactEmail: string;
  logoUrl?: string; // Custom uploaded image (Data URL) or web URL
  logoIcon?: string; // Icon preset identifier (e.g., 'utensils', 'hospital', 'school', 'chef', 'building')
  restrictToAuthorizedUsers: boolean; // Vérifie que l'agent est dans la liste autorisée
  enableQrExpressBooking?: boolean; // Activer ou désactiver le bouton réservation express par Badge QR
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
