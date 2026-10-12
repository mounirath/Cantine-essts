/**
 * COUCHE D'ABSTRACTION DES DONNÉES (ARCHITECTURE AGNOSTIQUE)
 * 
 * Supporte :
 * 1. LocalStorage persistant
 * 2. Supabase Cloud (PostgreSQL distant) lorsque configuré
 * 3. Gestion de menus multiples & sélection du menu actif par l'administrateur
 * 4. Gestion du "Plat du Jour" mis en valeur
 * 5. Gestion de la liste d'utilisateurs autorisés (whitelist)
 */

import { AppSettings, DailyMenu, Reservation, AuthorizedUser, MenuItem, SupabaseSyncStatus, RealtimeSyncInfo } from '../types';
import { getTodayDateString } from '../utils/timeUtils';
import { isCanteenCounterCode } from '../utils/canteenQR';
import { getSupabaseClient, SUPABASE_CONFIG } from './supabaseClient';

// ==========================================
// 1. CONTRAT D'INTERFACE AGNOSTIQUE (IDataStore)
// ==========================================
export interface IDataStore {
  /** Récupère le menu actuellement actif pour l'affichage utilisateur */
  getDailyMenu(dateStr: string): Promise<DailyMenu | null>;

  /** Récupère la liste de tous les menus enregistrés */
  getAllMenus(): Promise<DailyMenu[]>;

  /** Définit un menu comme étant le menu actif affiché pour les usagers */
  setActiveMenu(menuId: string): Promise<DailyMenu | null>;

  /** Enregistre ou met à jour un menu */
  saveDailyMenu(menu: DailyMenu): Promise<DailyMenu>;

  /** Supprime un menu */
  deleteDailyMenu(menuId: string): Promise<boolean>;

  /** Définit le Plat du Jour vedette d'un menu */
  setFeaturedPlat(menuId: string, platId: string): Promise<boolean>;

  /** Récupère la liste de toutes les réservations pour une date */
  getReservations(dateStr: string): Promise<Reservation[]>;

  /** Crée une nouvelle réservation pour un membre du personnel */
  createReservation(
    data: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'ticketCode'>
  ): Promise<Reservation>;

  /** Annule une réservation existante */
  cancelReservation(reservationId: string): Promise<boolean>;

  /** Marque une réservation comme servie/émargée lors du passage en cantine */
  toggleReservationServed(reservationId: string, served: boolean): Promise<boolean>;

  /** Valide directement qu'une réservation est servie (ex: scan du QR Code cantine par l'agent) */
  confirmMealServed(
    reservationId: string
  ): Promise<{ success: boolean; reservation?: Reservation; message: string; alreadyServed?: boolean }>;

  /** Confirme et valide un repas comme servi via lecture du QR code ou saisie du code de retrait */
  confirmMealServedByCode(
    ticketCodeOrId: string
  ): Promise<{ success: boolean; reservation?: Reservation; message: string; alreadyServed?: boolean }>;

  /** Récupère la liste des utilisateurs autorisés */
  getAuthorizedUsers(): Promise<AuthorizedUser[]>;

  /** Enregistre ou met à jour un utilisateur autorisé */
  saveAuthorizedUser(user: AuthorizedUser): Promise<AuthorizedUser>;

  /** Formulaire d'enregistrement utilisateur en libre-service (en attente d'approbation) */
  registerUser(data: {
    lastName: string;
    firstName: string;
    role: string;
    department?: string;
    email?: string;
    badgeNumber?: string;
    dietaryNotes?: string;
  }): Promise<AuthorizedUser>;

  /** Approuve la demande d'inscription d'un utilisateur par l'administration */
  approveUser(id: string): Promise<AuthorizedUser | null>;

  /** Rejette la demande d'inscription d'un utilisateur par l'administration */
  rejectUser(id: string): Promise<AuthorizedUser | null>;

  /** Supprime un utilisateur autorisé */
  deleteAuthorizedUser(id: string): Promise<boolean>;

  /** Vérifie si un nom, matricule ou email figure dans la liste autorisée */
  verifyUserAuthorized(nameOrBadge: string): Promise<{ authorized: boolean; user?: AuthorizedUser; message?: string }>;

  /** Récupère les paramètres globaux (capacité, horaires, etc.) */
  getSettings(): Promise<AppSettings>;

  /** Met à jour les paramètres de l'établissement */
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  /** Vérifie le mot de passe administrateur */
  verifyAdminPassword(password: string): Promise<boolean>;

  /** Modifie le mot de passe administrateur */
  updateAdminPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }>;

  /** Teste la connexion au projet Supabase */
  testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }>;

  /** Synchronisation complète vers Supabase */
  syncAllToSupabase(): Promise<{
    success: boolean;
    menusCount: number;
    usersCount: number;
    reservationsCount: number;
    message: string;
  }>;

  /** Récupération et synchronisation complète depuis Supabase */
  syncAllFromSupabase(): Promise<{
    success: boolean;
    menusCount: number;
    usersCount: number;
    reservationsCount: number;
    message: string;
  }>;

  /** État et diagnostic de synchronisation Supabase */
  getSupabaseSyncStatus(): Promise<SupabaseSyncStatus>;

  /** Écoute en temps réel des modifications Supabase et locales */
  subscribeToChanges(callback: (table: string, payload?: any) => void): (() => void) | null;

  /** Récupère les informations de diagnostic de synchronisation temps réel */
  getRealtimeStatus(): RealtimeSyncInfo;

  /** Écoute les changements d'état de la connexion temps réel */
  onRealtimeStatusChange(callback: (status: RealtimeSyncInfo) => void): () => void;

  /** Déclenche une synchronisation manuelle forcée avec la base de données */
  triggerManualSync(): Promise<void>;

  /** Réinitialise les données vers les données de démonstration */
  resetDemoData(): Promise<void>;
}

// ==========================================
// 2. UTILITAIRES DE HACHAGE SIMPLE (Sécurité)
// ==========================================
async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 3. DONNÉES INITIALES PAR DÉFAUT (SEEDS)
// ==========================================
export const DEFAULT_ADMIN_PASSWORD_PLAIN = 'admin123';

const DEFAULT_SETTINGS: AppSettings = {
  establishmentName: 'ESSTS - École Supérieure des Sciences et Technologies du Sport',
  establishmentType: 'Établissement Universitaire',
  logoUrl: '/logo.svg',
  logoIcon: 'essts',
  capacityPerDay: 75,
  bookingWindowStart: '08:00',
  bookingWindowEnd: '10:00',
  serviceHours: '11h45 - 13h45',
  adminPasswordHash: '',
  allowCancellation: true,
  kitchenContactEmail: 'restauration@essts.dz',
  restrictToAuthorizedUsers: true,
  supabaseUrl: 'https://vebfzgiblpnocusdlozu.supabase.co',
  supabaseAnonKey: 'sb_publishable_GU2cGO16rGYG80K7ne9sSQ_JuVuX9r_',
  useSupabaseBackend: true,
};

// Utilisateurs autorisés par défaut
const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: 'user-1',
    badgeNumber: 'AG-101',
    lastName: 'Bernard',
    firstName: 'Claire',
    role: 'Responsable RH',
    fullName: 'BERNARD Claire',
    department: 'Ressources Humaines',
    email: 'claire.bernard@etablissement.fr',
    dietaryNotes: 'Sans lactose si possible',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    badgeNumber: 'AG-102',
    lastName: 'Martin',
    firstName: 'Thomas',
    role: 'Ingénieur Systèmes & Réseaux',
    fullName: 'MARTIN Thomas',
    department: 'Pôle Technique & Informatique',
    email: 'thomas.martin@etablissement.fr',
    dietaryNotes: 'Végétarien',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    badgeNumber: 'AG-103',
    lastName: 'Dubois',
    firstName: 'Sophie',
    role: 'Médecin du Sport',
    fullName: 'DUBOIS Sophie',
    department: 'Service Médical & Soins',
    email: 'sophie.dubois@etablissement.fr',
    dietaryNotes: '',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-4',
    badgeNumber: 'AG-104',
    lastName: 'Vasseur',
    firstName: 'Marc',
    role: 'Professeur d’Éducation Physique',
    fullName: 'VASSEUR Marc',
    department: 'Enseignement & Formation',
    email: 'marc.vasseur@etablissement.fr',
    dietaryNotes: '',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-5',
    badgeNumber: 'AG-105',
    lastName: 'Renard',
    firstName: 'Julie',
    role: 'Comptable Principale',
    fullName: 'RENARD Julie',
    department: 'Administration & Finances',
    email: 'julie.renard@etablissement.fr',
    dietaryNotes: 'Sans gluten',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-6',
    badgeNumber: 'AG-106',
    lastName: 'Morel',
    firstName: 'Antoine',
    role: 'Responsable Logistique & Stocks',
    fullName: 'MOREL Antoine',
    department: 'Logistique & Services Généraux',
    email: 'antoine.morel@etablissement.fr',
    dietaryNotes: '',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-7',
    badgeNumber: 'AG-107',
    lastName: 'Petit',
    firstName: 'Valérie',
    role: 'Directrice des Études',
    fullName: 'PETIT Valérie',
    department: 'Direction Générale',
    email: 'valerie.petit@etablissement.fr',
    dietaryNotes: '',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export function createDefaultMenu(dateStr: string): DailyMenu {
  return {
    id: `menu-terroir-${dateStr}`,
    date: dateStr,
    title: 'Menu Terroir & Saveurs Gourmandes',
    isActive: true,
    featuredPlatId: 'plat-1', // Pavé de saumon défini comme PLAT DU JOUR
    entrees: [
      {
        id: 'entree-1',
        category: 'entree',
        name: 'Velouté crémeux de potimarron bio & graines toastées',
        description: 'Potimarron rôti du maraîcher local, crème de Bresse AOP, graines de courge croquantes.',
        allergens: ['Lait'],
        isVegetarian: true,
        calories: 140,
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'entree-2',
        category: 'entree',
        name: 'Terrine de campagne artisanale & condiments maison',
        description: 'Terrine pur porc fermier aux herbes de Provence, cornichons du terroir et mesclun.',
        allergens: ['Moutarde', 'Gluten'],
        isVegetarian: false,
        calories: 210,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'entree-3',
        category: 'entree',
        name: 'Salade de quinoa aux agrumes, grenade et feta AOP',
        description: 'Quinoa tricolore, suprêmes d’oranges, vinaigrette miel-citron et menthe fraîche.',
        allergens: ['Lait'],
        isVegetarian: true,
        calories: 165,
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
    ],
    plats: [
      {
        id: 'plat-1',
        category: 'plat',
        name: 'Pavé de saumon rôti à l’aneth & écrasé de pommes de terre',
        description: 'Filet de saumon Label Rouge rôti au four, étuvée de poireaux fondants, sauce beurre blanc citronnée.',
        allergens: ['Poisson', 'Lait'],
        isVegetarian: false,
        calories: 480,
        isPlatDuJour: true, // Star dish
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'plat-2',
        category: 'plat',
        name: 'Sauté de volaille fermière au thym & gratin dauphinois',
        description: 'Filet de poulet français rôti aux herbes, carottes fanes glacées, gratin crémeux à l’ail.',
        allergens: ['Lait'],
        isVegetarian: false,
        calories: 520,
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'plat-3',
        category: 'plat',
        name: 'Risotto crémeux aux champignons des bois & copeaux de parmesan',
        description: 'Riz Carnaroli fondant, pleurotes, girolles sautées au persil plat, bouillon végétal corsé.',
        allergens: ['Lait'],
        isVegetarian: true,
        calories: 430,
        imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80',
      },
    ],
    desserts: [
      {
        id: 'dessert-1',
        category: 'dessert',
        name: 'Tarte fine tiède aux pommes caramélisées & cannelle',
        description: 'Pâte feuilletée pur beurre croustillante, compotée vanillée et quartiers de pommes dorés.',
        allergens: ['Gluten', 'Lait'],
        isVegetarian: true,
        calories: 220,
        imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'dessert-2',
        category: 'dessert',
        name: 'Mousse légère au chocolat noir Valrhona 70%',
        description: 'Mousse aérée au chocolat intense, éclats de fèves de cacao torréfiées et fleur de sel.',
        allergens: ['Œufs', 'Lait'],
        isVegetarian: true,
        calories: 195,
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'dessert-3',
        category: 'dessert',
        name: 'Fromage blanc de campagne & coulis de fruits rouges',
        description: 'Fromage blanc fermier battu, coulis framboise-mûre sans sucre ajouté.',
        allergens: ['Lait'],
        isVegetarian: true,
        calories: 110,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
      },
    ],
    breadBeverageIncluded: true,
    chefNote: 'Tous nos plats sont préparés le matin même par la brigade de cuisine avec des produits frais et locaux.',
  };
}

export function createSecondaryMenu(dateStr: string): DailyMenu {
  return {
    id: `menu-mediterranee-${dateStr}`,
    date: dateStr,
    title: 'Menu Saveurs Méditerranéennes & Soleil',
    isActive: false,
    featuredPlatId: 'plat-med-1',
    entrees: [
      {
        id: 'entree-med-1',
        category: 'entree',
        name: 'Bruschetta aux tomates cerises, basilic & burrata crémeuse',
        description: 'Pain ciabatta frotté à l’ail, concassée de tomates fraîches, huile d’olive de Nyons et burrata crémeuse.',
        allergens: ['Gluten', 'Lait'],
        isVegetarian: true,
        calories: 180,
        imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'entree-med-2',
        category: 'entree',
        name: 'Gaspacho andalou rafraîchissant & croûtons dorés',
        description: 'Tomates mûres, poivrons doux, concombre, huile d’olive vierge extra et vinaigre de Xérès.',
        allergens: ['Gluten'],
        isVegetarian: true,
        calories: 120,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      },
    ],
    plats: [
      {
        id: 'plat-med-1',
        category: 'plat',
        name: 'Filet de dorade royale grillée aux herbes & tian de légumes provençal',
        description: 'Dorade fraîche saisie à la plancha, émulsion au citron confit et tian courgettes-tomates-aubergines.',
        allergens: ['Poisson'],
        isVegetarian: false,
        isPlatDuJour: true, // Star dish
        calories: 450,
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'plat-med-2',
        category: 'plat',
        name: 'Gnocchis frais à la crème de truffe d’été & pecorino',
        description: 'Gnocchis de pommes de terre faits maison, crème légère de truffe blanche, copeaux de pecorino romano.',
        allergens: ['Gluten', 'Lait'],
        isVegetarian: true,
        calories: 490,
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      },
    ],
    desserts: [
      {
        id: 'dessert-med-1',
        category: 'dessert',
        name: 'Tiramisu traditionnel au café & mascarpone',
        description: 'Biscuits à la cuillère imbibés d’espresso, crème mascarpone onctueuse et cacao amer.',
        allergens: ['Gluten', 'Œufs', 'Lait'],
        isVegetarian: true,
        calories: 240,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'dessert-med-2',
        category: 'dessert',
        name: 'Carpaccio d’ananas victoria mariné à la menthe & sorbet citron',
        description: 'Fines lamelles d’ananas frais, sirop léger à la cardamome et boule de sorbet plein fruit.',
        allergens: [],
        isVegetarian: true,
        calories: 95,
        imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
      },
    ],
    breadBeverageIncluded: true,
    chefNote: 'Un rayon de soleil dans vos assiettes avec nos produits de saison et nos herbes fraîches du potager.',
  };
}

const INITIAL_RESERVATIONS_SAMPLE: Reservation[] = [
  {
    id: 'res-101',
    date: getTodayDateString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    staffName: 'Claire Bernard',
    staffDepartment: 'Ressources Humaines',
    staffEmail: 'claire.bernard@etablissement.fr',
    selectedEntreeId: 'entree-1',
    selectedPlatId: 'plat-1',
    selectedDessertId: 'dessert-1',
    timeSlot: '12h00 - 12h30',
    dietaryNotes: 'Sans lactose si possible',
    status: 'confirmed',
    ticketCode: 'REP-741',
  },
  {
    id: 'res-102',
    date: getTodayDateString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    staffName: 'Thomas Martin',
    staffDepartment: 'Pôle Technique & Informatique',
    staffEmail: 'thomas.martin@etablissement.fr',
    selectedEntreeId: 'entree-3',
    selectedPlatId: 'plat-3',
    selectedDessertId: 'dessert-2',
    timeSlot: '12h30 - 13h00',
    dietaryNotes: 'Repas 100% végétarien',
    status: 'confirmed',
    ticketCode: 'REP-742',
  },
  {
    id: 'res-103',
    date: getTodayDateString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    staffName: 'Dr. Sophie Dubois',
    staffDepartment: 'Service Médical & Soins',
    staffEmail: 'sophie.dubois@etablissement.fr',
    selectedEntreeId: 'entree-1',
    selectedPlatId: 'plat-2',
    selectedDessertId: 'dessert-3',
    timeSlot: '12h00 - 12h30',
    dietaryNotes: '',
    status: 'served',
    ticketCode: 'REP-743',
    servedAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'res-104',
    date: getTodayDateString(),
    createdAt: new Date(Date.now() - 900000).toISOString(),
    staffName: 'Marc Vasseur',
    staffDepartment: 'Enseignement & Formation',
    staffEmail: 'marc.vasseur@etablissement.fr',
    selectedEntreeId: 'entree-2',
    selectedPlatId: 'plat-2',
    selectedDessertId: 'dessert-1',
    timeSlot: '13h00 - 13h30',
    dietaryNotes: '',
    status: 'confirmed',
    ticketCode: 'REP-744',
  },
];

// =========================================================================
// 4. IMPLÉMENTATION HYBRIDE : SUPABASE CLOUD AVEC FALLBACK LOCAL STORAGE
// =========================================================================
export class HybridDataStore implements IDataStore {
  private readonly STORAGE_KEY_PREFIX = 'mensa_staff_';
  private defaultPasswordHashPromise: Promise<string>;

  // Synchronisation temps réel
  private realtimeListeners = new Set<(table: string, payload?: any) => void>();
  private realtimeStatusListeners = new Set<(status: RealtimeSyncInfo) => void>();
  private realtimeStatus: RealtimeSyncInfo = {
    isConnected: false,
    provider: 'local',
    lastSyncAt: null,
    lastEvent: null,
    channelStatus: 'CONNECTING',
  };
  private supabaseRealtimeChannel: any = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private heartbeatIntervalId: any = null;
  private isManualSyncing = false;

  constructor() {
    this.defaultPasswordHashPromise = hashPassword(DEFAULT_ADMIN_PASSWORD_PLAIN);
    this.ensureInitialized();
    this.initRealtimeInfrastructure();
  }

  private async ensureInitialized(): Promise<void> {
    try {
      // 1. Settings
      const savedSettings = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}settings`);
      if (!savedSettings) {
        const defaultHash = await this.defaultPasswordHashPromise;
        const initSettings = { ...DEFAULT_SETTINGS, adminPasswordHash: defaultHash };
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}settings`, JSON.stringify(initSettings));
      }

      // 2. Multi-Menus
      const today = getTodayDateString();
      const savedMenusList = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}all_menus`);
      if (!savedMenusList) {
        const menu1 = createDefaultMenu(today);
        const menu2 = createSecondaryMenu(today);
        const initialMenus = [menu1, menu2];
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(initialMenus));
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`, menu1.id);
      }

      // 3. Authorized users
      const savedUsers = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}authorized_users`);
      if (!savedUsers) {
        localStorage.setItem(
          `${this.STORAGE_KEY_PREFIX}authorized_users`,
          JSON.stringify(INITIAL_AUTHORIZED_USERS)
        );
      }

      // 4. Initial reservations for demo
      const savedRes = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}reservations_${today}`);
      if (!savedRes) {
        localStorage.setItem(
          `${this.STORAGE_KEY_PREFIX}reservations_${today}`,
          JSON.stringify(INITIAL_RESERVATIONS_SAMPLE)
        );
      }
    } catch (e) {
      console.warn('LocalStorage error during initialization', e);
    }
  }

  // ==========================================
  // MOTEUR DE SYNCHRONISATION EN TEMPS RÉEL
  // ==========================================
  private initRealtimeInfrastructure() {
    if (typeof window === 'undefined') return;

    // 1. Bus de synchronisation inter-onglets (BroadcastChannel natif)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.localBroadcastChannel = new BroadcastChannel('canteen_realtime_sync_bus');
        this.localBroadcastChannel.onmessage = (event) => {
          if (event.data?.table) {
            this.handleIncomingChange(event.data.table, event.data.action || 'tab_sync', event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel non supporté:', e);
      }
    }

    // 2. Écouteur d'événements de stockage (pour synchroniser d'autres fenêtres/onglets)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(this.STORAGE_KEY_PREFIX)) {
        const table = e.key.includes('reservations')
          ? 'reservations'
          : e.key.includes('menu')
          ? 'menus'
          : e.key.includes('authorized_users')
          ? 'authorized_users'
          : e.key.includes('settings')
          ? 'app_settings'
          : 'general';
        this.handleIncomingChange(table, 'storage_change');
      }
    });

    // 3. Connexion au canal temps réel Supabase
    this.connectSupabaseRealtime();

    // 4. Poller de pulsation en arrière-plan (heartbeat de secours toutes les 5s)
    this.startHeartbeatSync();
  }

  private connectSupabaseRealtime() {
    try {
      const url = SUPABASE_CONFIG.url;
      const key = SUPABASE_CONFIG.publishableKey;
      const client = getSupabaseClient(url, key);
      if (!client) {
        this.realtimeStatus.isConnected = false;
        this.realtimeStatus.channelStatus = 'DISCONNECTED';
        this.notifyStatusListeners();
        return;
      }

      this.realtimeStatus.channelStatus = 'CONNECTING';
      this.notifyStatusListeners();

      if (this.supabaseRealtimeChannel) {
        try {
          client.removeChannel(this.supabaseRealtimeChannel);
        } catch {}
      }

      const channel = client.channel('canteen_live_realtime', {
        config: { broadcast: { self: false } },
      });

      // A. Écoute des diffusions instantanées entre clients de la cantine (WebSocket direct)
      channel.on('broadcast', { event: 'canteen_db_change' }, (payload: any) => {
        const data = payload?.payload;
        if (data?.table) {
          this.handleIncomingChange(data.table, data.action, data);
        }
      });

      // B. Écoute des mutations PostgreSQL (Supabase Replication)
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload: any) => {
          if (payload?.table) {
            this.handleIncomingChange(payload.table, payload.eventType, payload.new);
          }
        }
      );

      // C. Suivi de l'état de la connexion WebSocket
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.realtimeStatus.isConnected = true;
          this.realtimeStatus.channelStatus = 'SUBSCRIBED';
          this.realtimeStatus.provider = 'supabase';
          this.realtimeStatus.lastSyncAt = new Date();
          this.notifyStatusListeners();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.realtimeStatus.isConnected = false;
          this.realtimeStatus.channelStatus = status as any;
          this.notifyStatusListeners();
          // Tentative de reconnexion automatique
          setTimeout(() => {
            if (!this.realtimeStatus.isConnected) {
              this.connectSupabaseRealtime();
            }
          }, 4000);
        }
      });

      this.supabaseRealtimeChannel = channel;
    } catch (err) {
      console.warn('Erreur connectSupabaseRealtime:', err);
      this.realtimeStatus.isConnected = false;
      this.realtimeStatus.channelStatus = 'ERROR';
      this.notifyStatusListeners();
    }
  }

  private startHeartbeatSync() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = setInterval(async () => {
      if (this.isManualSyncing) return;
      try {
        const client = await this.getActiveSupabase();
        if (!client) return;

        const today = getTodayDateString();
        const { count, error } = await client
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('date', today);

        if (!error && count !== null) {
          this.realtimeStatus.isConnected = true;
          this.realtimeStatus.lastSyncAt = new Date();
          this.notifyStatusListeners();
        }
      } catch {}
    }, 6000);
  }

  private notifyChange(table: string, action: string, data?: any) {
    const timestamp = new Date();
    this.realtimeStatus.lastSyncAt = timestamp;
    this.realtimeStatus.lastEvent = { table, action, timestamp };
    this.notifyStatusListeners();

    // 1. Notification immédiate des composants de l'onglet courant (0 ms)
    this.realtimeListeners.forEach((cb) => {
      try {
        cb(table, { action, data });
      } catch (err) {
        console.warn('Realtime listener error:', err);
      }
    });

    // 2. Diffusion instantanée aux autres onglets ouverts sur le même appareil
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({ table, action, data, timestamp: timestamp.getTime() });
      } catch {}
    }

    // 3. Diffusion WebSocket temps réel Supabase à tous les autres utilisateurs connectés
    if (this.supabaseRealtimeChannel) {
      try {
        this.supabaseRealtimeChannel.send({
          type: 'broadcast',
          event: 'canteen_db_change',
          payload: { table, action, data, timestamp: timestamp.getTime() },
        });
      } catch (e) {
        console.warn('Supabase realtime broadcast send error:', e);
      }
    }
  }

  private handleIncomingChange(table: string, action?: string, data?: any) {
    const timestamp = new Date();
    this.realtimeStatus.lastSyncAt = timestamp;
    this.realtimeStatus.lastEvent = { table, action: action || 'incoming_sync', timestamp };
    this.notifyStatusListeners();

    this.realtimeListeners.forEach((cb) => {
      try {
        cb(table, { action, data });
      } catch (err) {
        console.warn('Realtime listener callback error:', err);
      }
    });
  }

  private notifyStatusListeners() {
    const snapshot = this.getRealtimeStatus();
    this.realtimeStatusListeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch {}
    });
  }

  getRealtimeStatus(): RealtimeSyncInfo {
    return { ...this.realtimeStatus };
  }

  onRealtimeStatusChange(callback: (status: RealtimeSyncInfo) => void): () => void {
    this.realtimeStatusListeners.add(callback);
    callback(this.getRealtimeStatus());
    return () => {
      this.realtimeStatusListeners.delete(callback);
    };
  }

  async triggerManualSync(): Promise<void> {
    try {
      this.isManualSyncing = true;
      await this.syncAllFromSupabase();
      this.realtimeStatus.lastSyncAt = new Date();
      this.realtimeStatus.isConnected = true;
      this.notifyStatusListeners();
      this.notifyChange('all', 'manual_refresh');
    } finally {
      this.isManualSyncing = false;
    }
  }

  // --- LOCAL HELPERS ---
  private getLocalMenus(): DailyMenu[] {
    const data = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}all_menus`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const today = getTodayDateString();
    return [createDefaultMenu(today), createSecondaryMenu(today)];
  }

  private getLocalUsers(): AuthorizedUser[] {
    const raw = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}authorized_users`);
    if (!raw) return INITIAL_AUTHORIZED_USERS;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return INITIAL_AUTHORIZED_USERS;
    } catch {
      return INITIAL_AUTHORIZED_USERS;
    }
  }

  private getLocalReservations(dateStr: string): Reservation[] {
    const data = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}reservations_${dateStr}`);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // --- SUPABASE CLIENT HELPER ---
  private async getActiveSupabase() {
    const settings = await this.getSettings();
    if (settings.useSupabaseBackend === false) {
      return null;
    }
    const url = settings.supabaseUrl || SUPABASE_CONFIG.url;
    const anonKey = settings.supabaseAnonKey || SUPABASE_CONFIG.publishableKey;
    if (!url || !anonKey) {
      return null;
    }
    return getSupabaseClient(url, anonKey);
  }

  // ====================================================
  // MENUS & GESTION DU MENU CHOISI PAR L'ADMIN
  // ====================================================
  async getAllMenus(): Promise<DailyMenu[]> {
    await this.ensureInitialized();
    const supabase = await this.getActiveSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.from('menus').select('*').order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          const list: DailyMenu[] = data.map((item: any) => item.data || item);
          localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(list));
          return list;
        } else if (!error && (!data || data.length === 0)) {
          // Si Supabase est vide, injecter les menus locaux pour éviter toute désynchronisation
          const localMenus = this.getLocalMenus();
          for (const m of localMenus) {
            await supabase.from('menus').upsert({
              id: m.id,
              date: m.date,
              title: m.title,
              is_active: !!m.isActive,
              featured_plat_id: m.featuredPlatId,
              data: m,
            });
          }
          return localMenus;
        }
      } catch (err) {
        console.warn('Supabase getAllMenus fallback to local storage:', err);
      }
    }

    return this.getLocalMenus();
  }

  async getDailyMenu(dateStr: string): Promise<DailyMenu | null> {
    await this.ensureInitialized();
    const menus = await this.getAllMenus();
    const activeMenuId = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`);

    // 1. Chercher le menu marqué comme actif par l'admin
    if (activeMenuId) {
      const active = menus.find((m) => m.id === activeMenuId);
      if (active) return active;
    }

    // 2. Ou chercher un menu ayant isActive = true
    const flaggedActive = menus.find((m) => m.isActive);
    if (flaggedActive) return flaggedActive;

    // 3. Ou chercher un menu pour la date demandée
    const dateMenu = menus.find((m) => m.date === dateStr);
    if (dateMenu) return dateMenu;

    // 4. Fallback sur le premier menu de la liste
    return menus[0] || createDefaultMenu(dateStr);
  }

  async setActiveMenu(menuId: string): Promise<DailyMenu | null> {
    const menus = await this.getAllMenus();
    let selectedMenu: DailyMenu | null = null;

    const updatedMenus = menus.map((m) => {
      if (m.id === menuId) {
        selectedMenu = { ...m, isActive: true };
        return selectedMenu;
      }
      return { ...m, isActive: false };
    });

    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(updatedMenus));
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`, menuId);

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase && selectedMenu) {
      try {
        await supabase.from('menus').upsert({
          id: menuId,
          date: (selectedMenu as DailyMenu).date,
          title: (selectedMenu as DailyMenu).title,
          is_active: true,
          data: selectedMenu,
        });
      } catch (e) {
        console.warn('Supabase setActiveMenu error:', e);
      }
    }

    return selectedMenu;
  }

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const menus = await this.getAllMenus();
    const existingIndex = menus.findIndex((m) => m.id === menu.id);

    // Ensure plat du jour consistency
    if (menu.featuredPlatId) {
      menu.plats = menu.plats.map((p) => ({
        ...p,
        isPlatDuJour: p.id === menu.featuredPlatId,
      }));
    } else {
      const starred = menu.plats.find((p) => p.isPlatDuJour);
      if (starred) {
        menu.featuredPlatId = starred.id;
      } else if (menu.plats[0]) {
        menu.plats[0].isPlatDuJour = true;
        menu.featuredPlatId = menu.plats[0].id;
      }
    }

    if (existingIndex >= 0) {
      menus[existingIndex] = menu;
    } else {
      menus.push(menu);
    }

    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(menus));

    // Si c'est le seul menu ou qu'il est marqué actif, l'enregistrer comme actif
    if (menu.isActive || menus.length === 1) {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`, menu.id);
    }

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('menus').upsert({
          id: menu.id,
          date: menu.date,
          title: menu.title,
          is_active: !!menu.isActive,
          featured_plat_id: menu.featuredPlatId,
          data: menu,
        });
      } catch (e) {
        console.warn('Supabase saveDailyMenu error:', e);
      }
    }

    return menu;
  }

  async deleteDailyMenu(menuId: string): Promise<boolean> {
    const menus = await this.getAllMenus();
    if (menus.length <= 1) {
      return false; // Garder au moins 1 menu
    }

    const filtered = menus.filter((m) => m.id !== menuId);
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(filtered));

    const activeId = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`);
    if (activeId === menuId && filtered[0]) {
      await this.setActiveMenu(filtered[0].id);
    }

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('menus').delete().eq('id', menuId);
      } catch (e) {
        console.warn('Supabase deleteDailyMenu error:', e);
      }
    }

    return true;
  }

  async setFeaturedPlat(menuId: string, platId: string): Promise<boolean> {
    const menus = await this.getAllMenus();
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return false;

    menu.featuredPlatId = platId;
    menu.plats = menu.plats.map((p) => ({
      ...p,
      isPlatDuJour: p.id === platId,
    }));

    await this.saveDailyMenu(menu);
    return true;
  }

  // ====================================================
  // UTILISATEURS AUTORISÉS (WHITELIST)
  // ====================================================
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    await this.ensureInitialized();
    const supabase = await this.getActiveSupabase();

    const normalizeUser = (u: any): AuthorizedUser => {
      let lastName = u.lastName || '';
      let firstName = u.firstName || '';
      if (!lastName && !firstName && u.fullName) {
        const parts = u.fullName.trim().split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          lastName = parts[0] || 'Agent';
          firstName = '';
        }
      }
      const role = u.role || u.department || 'Personnel';
      const fullName = u.fullName || `${(lastName || '').toUpperCase()} ${firstName || ''}`.trim();
      const approvalStatus = u.approvalStatus || (u.active !== false ? 'approved' : 'pending');
      return {
        ...u,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        role: role.trim(),
        fullName,
        approvalStatus,
      };
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('authorized_users').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const remoteUsers = data.map((item: any) => normalizeUser(item.data || item));
          
          // Vérifier si des utilisateurs initiaux ou locaux manquent sur Supabase
          const localUsers = this.getLocalUsers().map(normalizeUser);
          const missingUsers = localUsers.filter(
            (lu) => !remoteUsers.some((ru) => ru.id === lu.id || ru.badgeNumber === lu.badgeNumber)
          );

          if (missingUsers.length > 0) {
            for (const mu of missingUsers) {
              await supabase.from('authorized_users').upsert({
                id: mu.id,
                badge_number: mu.badgeNumber,
                full_name: mu.fullName,
                department: mu.department,
                email: mu.email,
                active: mu.active,
                data: mu,
              });
            }
            remoteUsers.push(...missingUsers);
          }

          localStorage.setItem(`${this.STORAGE_KEY_PREFIX}authorized_users`, JSON.stringify(remoteUsers));
          return remoteUsers;
        }
      } catch (err) {
        console.warn('Supabase getAuthorizedUsers fallback to local storage:', err);
      }
    }

    const localUsers = this.getLocalUsers();
    return localUsers.map(normalizeUser);
  }

  async saveAuthorizedUser(user: AuthorizedUser): Promise<AuthorizedUser> {
    const list = await this.getAuthorizedUsers();
    const index = list.findIndex((u) => u.id === user.id);

    if (index >= 0) {
      list[index] = user;
    } else {
      list.unshift(user);
    }

    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}authorized_users`, JSON.stringify(list));

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('authorized_users').upsert({
          id: user.id,
          badge_number: user.badgeNumber,
          full_name: user.fullName,
          department: user.department,
          email: user.email,
          active: user.active,
          data: user,
        });
      } catch (e) {
        console.warn('Supabase saveAuthorizedUser error:', e);
      }
    }

    return user;
  }

  async registerUser(data: {
    lastName: string;
    firstName: string;
    role: string;
    department?: string;
    email?: string;
    badgeNumber?: string;
    dietaryNotes?: string;
  }): Promise<AuthorizedUser> {
    const cleanLast = data.lastName.trim();
    const cleanFirst = data.firstName.trim();
    const cleanRole = data.role.trim();
    const badge = data.badgeNumber?.trim().toUpperCase() || `AG-${Math.floor(100 + Math.random() * 900)}`;
    const formattedFullName = `${cleanLast.toUpperCase()} ${cleanFirst}`;

    const newUser: AuthorizedUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      badgeNumber: badge,
      lastName: cleanLast,
      firstName: cleanFirst,
      role: cleanRole,
      fullName: formattedFullName,
      department: data.department || 'Enseignement & Formation',
      email: data.email?.trim() || undefined,
      dietaryNotes: data.dietaryNotes?.trim() || undefined,
      active: false, // Inactif jusqu'à approbation
      approvalStatus: 'pending', // En attente d'approbation par l'administration
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return await this.saveAuthorizedUser(newUser);
  }

  async approveUser(id: string): Promise<AuthorizedUser | null> {
    const list = await this.getAuthorizedUsers();
    const user = list.find((u) => u.id === id);
    if (!user) return null;
    const updated: AuthorizedUser = {
      ...user,
      active: true,
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
    };
    return await this.saveAuthorizedUser(updated);
  }

  async rejectUser(id: string): Promise<AuthorizedUser | null> {
    const list = await this.getAuthorizedUsers();
    const user = list.find((u) => u.id === id);
    if (!user) return null;
    const updated: AuthorizedUser = {
      ...user,
      active: false,
      approvalStatus: 'rejected',
    };
    return await this.saveAuthorizedUser(updated);
  }

  async deleteAuthorizedUser(id: string): Promise<boolean> {
    const list = await this.getAuthorizedUsers();
    const filtered = list.filter((u) => u.id !== id);
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}authorized_users`, JSON.stringify(filtered));

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('authorized_users').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteAuthorizedUser error:', e);
      }
    }

    return true;
  }

  async verifyUserAuthorized(
    nameOrBadge: string
  ): Promise<{ authorized: boolean; user?: AuthorizedUser; message?: string }> {
    const settings = await this.getSettings();

    // Si la restriction n'est pas activée, tout le personnel peut réserver
    if (!settings.restrictToAuthorizedUsers) {
      return { authorized: true };
    }

    const users = await this.getAuthorizedUsers();
    const cleanSearch = nameOrBadge.trim().toLowerCase();

    const match = users.find(
      (u) =>
        u.fullName.toLowerCase() === cleanSearch ||
        u.badgeNumber.toLowerCase() === cleanSearch ||
        (u.lastName && u.lastName.toLowerCase() === cleanSearch) ||
        (u.firstName && u.firstName.toLowerCase() === cleanSearch) ||
        (u.email && u.email.toLowerCase() === cleanSearch) ||
        u.fullName.toLowerCase().includes(cleanSearch)
    );

    if (!match) {
      return {
        authorized: false,
        message: `L'agent "${nameOrBadge}" ne figure pas dans le répertoire du personnel autorisé pour le service de restauration. Vous pouvez formuler une demande d'enregistrement.`,
      };
    }

    // Vérification du statut d'approbation
    if (match.approvalStatus === 'pending') {
      return {
        authorized: false,
        user: match,
        message: `Votre demande d'inscription pour ${match.fullName} (${match.role || 'Personnel'}) est en attente d'approbation par l'administration. Vous aurez accès aux réservations dès que l'administrateur aura validé votre compte.`,
      };
    }

    if (match.approvalStatus === 'rejected') {
      return {
        authorized: false,
        user: match,
        message: `Votre demande d'inscription pour ${match.fullName} n'a pas été validée par l'administration. Veuillez contacter la direction ou le service de restauration.`,
      };
    }

    if (!match.active) {
      return {
        authorized: false,
        user: match,
        message: `L'accès au réfectoire pour ${match.fullName} (${match.badgeNumber}) est temporairement suspendu. Veuillez contacter l'administration.`,
      };
    }

    return {
      authorized: true,
      user: match,
    };
  }

  // ====================================================
  // RÉSERVATIONS & POINTAGE
  // ====================================================
  async getReservations(dateStr: string): Promise<Reservation[]> {
    await this.ensureInitialized();
    const supabase = await this.getActiveSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('date', dateStr)
          .order('created_at', { ascending: false });
        if (!error && data) {
          if (data.length > 0) {
            const list: Reservation[] = data.map((item: any) => item.data || item);
            localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${dateStr}`, JSON.stringify(list));
            return list;
          } else {
            // Si aucune réservation sur Supabase pour cette date, vérifier si le cache local en a
            const localList = this.getLocalReservations(dateStr);
            if (localList.length > 0) {
              for (const r of localList) {
                await supabase.from('reservations').upsert({
                  id: r.id,
                  date: r.date,
                  ticket_code: r.ticketCode,
                  staff_name: r.staffName,
                  staff_department: r.staffDepartment,
                  status: r.status,
                  served_at: r.servedAt,
                  data: r,
                });
              }
              return localList;
            }
            return [];
          }
        }
      } catch (err) {
        console.warn('Supabase getReservations fallback to local storage:', err);
      }
    }

    return this.getLocalReservations(dateStr);
  }

  async createReservation(
    data: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'ticketCode'>
  ): Promise<Reservation> {
    const list = await this.getReservations(data.date);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      ticketCode: `REP-${randomSuffix}`,
    };

    list.unshift(newReservation);
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${data.date}`, JSON.stringify(list));

    // Sync Supabase
    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('reservations').upsert({
          id: newReservation.id,
          date: newReservation.date,
          ticket_code: newReservation.ticketCode,
          staff_name: newReservation.staffName,
          staff_department: newReservation.staffDepartment,
          status: newReservation.status,
          data: newReservation,
        });
      } catch (e) {
        console.warn('Supabase createReservation error:', e);
      }
    }

    return newReservation;
  }

  async cancelReservation(reservationId: string): Promise<boolean> {
    const today = getTodayDateString();
    const list = await this.getReservations(today);
    const index = list.findIndex((r) => r.id === reservationId);
    if (index === -1) return false;

    list[index].status = 'cancelled';
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${today}`, JSON.stringify(list));

    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservationId);
      } catch (e) {
        console.warn('Supabase cancelReservation error:', e);
      }
    }

    return true;
  }

  async toggleReservationServed(reservationId: string, served: boolean): Promise<boolean> {
    const today = getTodayDateString();
    const list = await this.getReservations(today);
    const index = list.findIndex((r) => r.id === reservationId);
    if (index === -1) return false;

    list[index].status = served ? 'served' : 'confirmed';
    list[index].servedAt = served ? new Date().toISOString() : undefined;
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${today}`, JSON.stringify(list));

    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('reservations').update({
          status: list[index].status,
          served_at: list[index].servedAt,
          data: list[index],
        }).eq('id', reservationId);
      } catch (e) {
        console.warn('Supabase toggleReservationServed error:', e);
      }
    }

    return true;
  }

  async confirmMealServed(
    reservationId: string
  ): Promise<{ success: boolean; reservation?: Reservation; message: string; alreadyServed?: boolean }> {
    const today = getTodayDateString();
    const list = await this.getReservations(today);
    const index = list.findIndex((r) => r.id === reservationId);

    if (index === -1) {
      return {
        success: false,
        message: "Réservation introuvable pour aujourd'hui.",
      };
    }

    const reservation = list[index];

    if (reservation.status === 'cancelled') {
      return {
        success: false,
        reservation,
        message: `La réservation pour ${reservation.staffName} (${reservation.ticketCode}) a été annulée.`,
      };
    }

    if (reservation.status === 'served') {
      const servedTime = reservation.servedAt
        ? new Date(reservation.servedAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'plus tôt';
      return {
        success: true,
        alreadyServed: true,
        reservation,
        message: `Ce plateau a DÉJÀ été émargé et servi à ${servedTime} pour ${reservation.staffName}.`,
      };
    }

    // Valider comme servi
    reservation.status = 'served';
    reservation.servedAt = new Date().toISOString();
    list[index] = reservation;
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${today}`, JSON.stringify(list));

    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('reservations').update({
          status: 'served',
          served_at: reservation.servedAt,
          data: reservation,
        }).eq('id', reservation.id);
      } catch (e) {
        console.warn('Supabase confirmMealServed error:', e);
      }
    }

    return {
      success: true,
      alreadyServed: false,
      reservation,
      message: `Repas validé et servi avec succès pour ${reservation.staffName} !`,
    };
  }

  async confirmMealServedByCode(
    ticketCodeOrId: string
  ): Promise<{ success: boolean; reservation?: Reservation; message: string; alreadyServed?: boolean }> {
    const today = getTodayDateString();
    const list = await this.getReservations(today);

    let cleanCode = ticketCodeOrId.trim();

    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = parsed.ticketCode || parsed.id || cleanCode;
      } catch {}
    } else if (cleanCode.includes(':')) {
      const parts = cleanCode.split(':');
      if (parts.length >= 2 && parts[1].startsWith('REP-')) {
        cleanCode = parts[1];
      } else if (parts.length >= 3 && parts[2].startsWith('res-')) {
        cleanCode = parts[2];
      }
    }

    // Si le code scanné est le QR Code du comptoir de la cantine
    if (isCanteenCounterCode(cleanCode)) {
      const lastTicketId = typeof localStorage !== 'undefined' ? localStorage.getItem('mensa_last_ticket_id') : null;
      let target = lastTicketId ? list.find((r) => r.id === lastTicketId && r.status !== 'cancelled') : null;
      if (!target) {
        target = list.find((r) => r.status === 'confirmed');
      }
      if (target) {
        return this.confirmMealServed(target.id);
      }
      return {
        success: false,
        message: "QR Code du comptoir cantine détecté, mais aucune réservation active trouvée pour aujourd'hui.",
      };
    }

    const uppercaseClean = cleanCode.toUpperCase();
    const index = list.findIndex(
      (r) =>
        r.ticketCode.toUpperCase() === uppercaseClean ||
        r.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (index === -1) {
      return {
        success: false,
        message: `Aucune réservation trouvée pour le code "${cleanCode}" pour la date d'aujourd'hui.`,
      };
    }

    return this.confirmMealServed(list[index].id);
  }

  // ====================================================
  // PARAMÈTRES & MOT DE PASSE ADMIN
  // ====================================================
  async getSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    const data = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}settings`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Migration automatique vers le logo et l'établissement ESSTS si ancien nom ou aucun logo
        if (!parsed.logoUrl && (!parsed.logoIcon || parsed.logoIcon === 'utensils')) {
          parsed.logoUrl = '/logo.svg';
          parsed.logoIcon = 'essts';
        }
        if (!parsed.establishmentName || parsed.establishmentName === 'Centre Hospitalier & Scolaire Sainte-Barbe') {
          parsed.establishmentName = 'ESSTS - École Supérieure des Sciences et Technologies du Sport';
          parsed.establishmentType = 'Établissement Universitaire';
          parsed.kitchenContactEmail = 'restauration@essts.dz';
        }
        if (!parsed.supabaseUrl) {
          parsed.supabaseUrl = 'https://vebfzgiblpnocusdlozu.supabase.co';
        }
        if (!parsed.supabaseAnonKey) {
          parsed.supabaseAnonKey = 'sb_publishable_GU2cGO16rGYG80K7ne9sSQ_JuVuX9r_';
        }
        if (parsed.useSupabaseBackend === undefined) {
          parsed.useSupabaseBackend = true;
        }
        return parsed;
      } catch {}
    }
    const defaultHash = await this.defaultPasswordHashPromise;
    return { ...DEFAULT_SETTINGS, adminPasswordHash: defaultHash };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(`${this.STORAGE_KEY_PREFIX}settings`, JSON.stringify(updated));

    const supabase = await this.getActiveSupabase();
    if (supabase) {
      try {
        await supabase.from('app_settings').upsert({
          id: 'global_settings',
          data: updated,
        });
      } catch (e) {
        console.warn('Supabase updateSettings error:', e);
      }
    }

    return updated;
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const settings = await this.getSettings();
    const candidateHash = await hashPassword(password);
    return settings.adminPasswordHash === candidateHash;
  }

  async updateAdminPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const isValid = await this.verifyAdminPassword(currentPassword);
    if (!isValid) {
      return { success: false, error: 'Le mot de passe administrateur actuel est incorrect.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return {
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 4 caractères.',
      };
    }

    const newHash = await hashPassword(newPassword);
    await this.updateSettings({ adminPasswordHash: newHash });
    return { success: true };
  }

  async testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = getSupabaseClient(url, key);
      if (!client) {
        return { success: false, message: 'URL ou clé Supabase invalide.' };
      }
      // Simple probe
      const { error } = await client.from('menus').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table does not exist or permission error
        return {
          success: false,
          message: `Connexion établie mais erreur sur les tables : ${error.message}. Pensez à exécuter le script SQL fourni ci-dessous.`,
        };
      }
      return { success: true, message: 'Connexion à votre base Supabase réussie avec succès !' };
    } catch (err: any) {
      return { success: false, message: `Échec de connexion : ${err.message || 'Erreur réseau'}` };
    }
  }

  async syncAllToSupabase(): Promise<{
    success: boolean;
    menusCount: number;
    usersCount: number;
    reservationsCount: number;
    message: string;
  }> {
    await this.ensureInitialized();
    const supabase = await this.getActiveSupabase();
    if (!supabase) {
      return {
        success: false,
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        message: 'Stockage Supabase non configuré ou désactivé dans les paramètres.',
      };
    }

    try {
      // 1. Menus
      const localMenus = this.getLocalMenus();
      for (const m of localMenus) {
        await supabase.from('menus').upsert({
          id: m.id,
          date: m.date,
          title: m.title,
          is_active: !!m.isActive,
          featured_plat_id: m.featuredPlatId,
          data: m,
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Users
      const localUsers = this.getLocalUsers();
      for (const u of localUsers) {
        await supabase.from('authorized_users').upsert({
          id: u.id,
          badge_number: u.badgeNumber,
          full_name: u.fullName,
          department: u.department,
          email: u.email,
          active: u.active !== false,
          data: u,
        });
      }

      // 3. Reservations - scan all localStorage keys for reservations
      const allReservations: Reservation[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.STORAGE_KEY_PREFIX}reservations_`)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                allReservations.push(...parsed);
              }
            } catch {}
          }
        }
      }

      for (const r of allReservations) {
        await supabase.from('reservations').upsert({
          id: r.id,
          date: r.date,
          ticket_code: r.ticketCode,
          staff_name: r.staffName,
          staff_department: r.staffDepartment,
          status: r.status,
          served_at: r.servedAt,
          data: r,
        });
      }

      // 4. Settings
      const settings = await this.getSettings();
      await supabase.from('app_settings').upsert({
        id: 'global_settings',
        data: settings,
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        menusCount: localMenus.length,
        usersCount: localUsers.length,
        reservationsCount: allReservations.length,
        message: `Synchronisation vers Supabase réussie : ${localMenus.length} menus, ${localUsers.length} usagers, ${allReservations.length} réservations sauvegardés dans le Cloud.`,
      };
    } catch (err: any) {
      return {
        success: false,
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        message: `Erreur lors de la synchronisation vers Supabase : ${err.message || 'Erreur réseau'}`,
      };
    }
  }

  async syncAllFromSupabase(): Promise<{
    success: boolean;
    menusCount: number;
    usersCount: number;
    reservationsCount: number;
    message: string;
  }> {
    await this.ensureInitialized();
    const supabase = await this.getActiveSupabase();
    if (!supabase) {
      return {
        success: false,
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        message: 'Stockage Supabase non configuré ou désactivé.',
      };
    }

    try {
      // 1. Menus
      const { data: menusData, error: menusErr } = await supabase.from('menus').select('*');
      let menusCount = 0;
      if (!menusErr && menusData && menusData.length > 0) {
        const menus: DailyMenu[] = menusData.map((item: any) => item.data || item);
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}all_menus`, JSON.stringify(menus));
        menusCount = menus.length;
      }

      // 2. Users
      const { data: usersData, error: usersErr } = await supabase.from('authorized_users').select('*');
      let usersCount = 0;
      if (!usersErr && usersData && usersData.length > 0) {
        const users: AuthorizedUser[] = usersData.map((item: any) => item.data || item);
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}authorized_users`, JSON.stringify(users));
        usersCount = users.length;
      }

      // 3. Reservations
      const { data: resData, error: resErr } = await supabase.from('reservations').select('*');
      let reservationsCount = 0;
      if (!resErr && resData && resData.length > 0) {
        const reservations: Reservation[] = resData.map((item: any) => item.data || item);
        reservationsCount = reservations.length;
        // Group by date
        const byDate: Record<string, Reservation[]> = {};
        for (const r of reservations) {
          if (!byDate[r.date]) byDate[r.date] = [];
          byDate[r.date].push(r);
        }
        for (const [date, list] of Object.entries(byDate)) {
          localStorage.setItem(`${this.STORAGE_KEY_PREFIX}reservations_${date}`, JSON.stringify(list));
        }
      }

      // 4. Settings
      const { data: setRow } = await supabase.from('app_settings').select('*').eq('id', 'global_settings').maybeSingle();
      if (setRow && setRow.data) {
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}settings`, JSON.stringify(setRow.data));
      }

      return {
        success: true,
        menusCount,
        usersCount,
        reservationsCount,
        message: `Synchronisation depuis Supabase terminée : ${menusCount} menus, ${usersCount} usagers, ${reservationsCount} réservations synchronisés en local.`,
      };
    } catch (err: any) {
      return {
        success: false,
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        message: `Erreur lors de la récupération depuis Supabase : ${err.message || 'Erreur réseau'}`,
      };
    }
  }

  async getSupabaseSyncStatus(): Promise<SupabaseSyncStatus> {
    const settings = await this.getSettings();
    const url = settings.supabaseUrl || SUPABASE_CONFIG.url;
    const anonKey = settings.supabaseAnonKey || SUPABASE_CONFIG.publishableKey;

    if (!settings.useSupabaseBackend) {
      return {
        isConnected: false,
        url: url || '',
        menusCount: this.getLocalMenus().length,
        usersCount: this.getLocalUsers().length,
        reservationsCount: this.getLocalReservations(getTodayDateString()).length,
        error: 'Mode stockage distant désactivé (Mode LocalStorage actif)',
      };
    }

    const client = getSupabaseClient(url, anonKey);
    if (!client) {
      return {
        isConnected: false,
        url: url || '',
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        error: 'Identifiants Supabase non valides',
      };
    }

    try {
      const [mRes, uRes, rRes] = await Promise.all([
        client.from('menus').select('id', { count: 'exact', head: true }),
        client.from('authorized_users').select('id', { count: 'exact', head: true }),
        client.from('reservations').select('id', { count: 'exact', head: true }),
      ]);

      if (mRes.error || uRes.error || rRes.error) {
        const errMsg = mRes.error?.message || uRes.error?.message || rRes.error?.message;
        return {
          isConnected: false,
          url,
          menusCount: 0,
          usersCount: 0,
          reservationsCount: 0,
          error: `Erreur d'accès aux tables : ${errMsg}`,
        };
      }

      return {
        isConnected: true,
        url,
        menusCount: mRes.count ?? 0,
        usersCount: uRes.count ?? 0,
        reservationsCount: rRes.count ?? 0,
        lastSyncTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch (err: any) {
      return {
        isConnected: false,
        url,
        menusCount: 0,
        usersCount: 0,
        reservationsCount: 0,
        error: err.message || 'Erreur réseau',
      };
    }
  }

  subscribeToChanges(callback: (table: string) => void): (() => void) | null {
    const url = SUPABASE_CONFIG.url;
    const key = SUPABASE_CONFIG.publishableKey;
    const client = getSupabaseClient(url, key);
    if (!client) return null;

    try {
      const channel = client
        .channel('realtime_all_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload: any) => {
            if (payload.table) {
              callback(payload.table);
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription error:', e);
      return null;
    }
  }

  async resetDemoData(): Promise<void> {
    const today = getTodayDateString();
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}all_menus`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}active_menu_id`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}authorized_users`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}reservations_${today}`);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}settings`);
    await this.ensureInitialized();
  }
}

// ==========================================
// 5. INSTANCE EXPORTÉE UNIQUE (SINGLETON)
// ==========================================
export const dbService: IDataStore = new HybridDataStore();
