import React, { useState } from 'react';
import {
  DailyMenu,
  Reservation,
  AppSettings,
  MenuItem,
  MealCategory,
  AuthorizedUser,
  SupabaseSyncStatus,
} from '../types';
import { dbService } from '../services/dbService';
import {
  Users,
  UtensilsCrossed,
  Settings as SettingsIcon,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  Save,
  Key,
  ShieldAlert,
  Leaf,
  LogOut,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  ScanLine,
  Image as ImageIcon,
  Upload,
  HeartPulse,
  GraduationCap,
  Building2,
  ChefHat,
  Coffee,
  Utensils,
  Star,
  Database,
  ShieldCheck,
  Check,
  Sparkles,
  ExternalLink,
  Terminal,
  TrendingUp,
  CloudUpload,
  CloudDownload,
  Wifi,
  WifiOff,
  RefreshCcw,
  Camera,
  QrCode,
  Sun,
  Moon,
} from 'lucide-react';
import { formatFrenchDate } from '../utils/timeUtils';
import { exportReservationsToExcel } from '../utils/excelExport';
import { compressImageFile } from '../utils/dishImageUtils';
import { AppLogo } from './AppLogo';
import { EsstsLogo } from './EsstsLogo';
import { AuthorizedUsersManager } from './AuthorizedUsersManager';
import { WeeklyReservationTrends } from './WeeklyReservationTrends';
import { SevenDayAttendanceChart } from './SevenDayAttendanceChart';
import { SupabaseSchemaModal } from './SupabaseSchemaModal';
import { DishPhotoModal } from './DishPhotoModal';
import { CanteenCounterPosterModal } from './CanteenCounterPosterModal';
import { AdminNewReservationModal } from './AdminNewReservationModal';
import { MealType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { auth, signInWithGoogle, signOutUser, subscribeToAuth } from '../services/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminDashboardProps {
  initialMenu: DailyMenu;
  initialReservations: Reservation[];
  settings: AppSettings;
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
  onOpenScanner: () => void;
  todayDateStr: string;
}

const COMMON_ALLERGENS = [
  'Gluten',
  'Lait',
  'Œufs',
  'Poisson',
  'Crustacés',
  'Arachides',
  'Soja',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialMenu,
  initialReservations,
  settings,
  onLogout,
  onRefreshData,
  onOpenScanner,
  todayDateStr,
}) => {
  const { t, formatDate } = useLanguage();
  const [activeAdminTab, setActiveAdminTab] = useState<'inscrits' | 'menu' | 'users' | 'trends' | 'settings'>('inscrits');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'logo' | 'database' | 'security'>('general');

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'confirmed' | 'served' | 'cancelled'>('ALL');
  const [mealTypeFilter, setMealTypeFilter] = useState<'ALL' | MealType>('ALL');
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [menuMealSection, setMenuMealSection] = useState<'lunch' | 'breakfast' | 'dinner'>('lunch');

  // Multi-menus state
  const [menusList, setMenusList] = useState<DailyMenu[]>([initialMenu]);
  const [menuData, setMenuData] = useState<DailyMenu>(initialMenu);
  const [activeMenuId, setActiveMenuId] = useState<string>(initialMenu.id);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [menuSaveMessage, setMenuSaveMessage] = useState<string | null>(null);

  // Dish photo modal state & Canteen poster modal
  const [photoModalDish, setPhotoModalDish] = useState<MenuItem | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isMenuCoverModalOpen, setIsMenuCoverModalOpen] = useState(false);
  const [isCanteenPosterOpen, setIsCanteenPosterOpen] = useState(false);

  const handleOpenPhotoModal = (dish: MenuItem) => {
    setPhotoModalDish(dish);
    setIsPhotoModalOpen(true);
  };

  const handleOpenMenuCoverModal = () => {
    setIsMenuCoverModalOpen(true);
  };

  const handleSaveDishPhoto = async (
    dishId: string,
    category: MealCategory | 'menu',
    imageUrl?: string
  ) => {
    if (category === 'menu') {
      const updatedMenu: DailyMenu = {
        ...menuData,
        coverImageUrl: imageUrl || undefined,
      };
      setMenuData(updatedMenu);
      setMenusList((prev) => prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)));
      try {
        await dbService.saveDailyMenu(updatedMenu);
        await onRefreshData();
      } catch (e) {
        console.warn('Error saving menu cover image:', e);
      }
      return;
    }

    const updateList = (list: MenuItem[]) =>
      list.map((item) => (item.id === dishId ? { ...item, imageUrl: imageUrl || undefined } : item));

    const updatedMenu: DailyMenu = {
      ...menuData,
      entrees: category === 'entree' ? updateList(menuData.entrees) : menuData.entrees,
      plats: category === 'plat' ? updateList(menuData.plats) : menuData.plats,
      desserts: category === 'dessert' ? updateList(menuData.desserts) : menuData.desserts,
    };

    setMenuData(updatedMenu);
    setMenusList((prev) => prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)));
    try {
      await dbService.saveDailyMenu(updatedMenu);
      await onRefreshData();
    } catch (e) {
      console.warn('Error saving dish image:', e);
    }
  };

  const handleDirectRemovePhoto = async (dishId: string, category: MealCategory | 'menu') => {
    await handleSaveDishPhoto(dishId, category, undefined);
  };

  const handleQuickUploadDishPhoto = async (
    file: File,
    dishId: string,
    category: MealCategory | 'menu'
  ) => {
    try {
      const compressedDataUrl = await compressImageFile(
        file,
        category === 'menu' ? 1200 : 700,
        category === 'menu' ? 600 : 500
      );
      await handleSaveDishPhoto(dishId, category, compressedDataUrl);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du traitement de la photo.');
    }
  };

  // Whitelist state
  const [authorizedUsersList, setAuthorizedUsersList] = useState<AuthorizedUser[]>([]);

  // Settings & Password change state
  const [appSettings, setAppSettings] = useState<AppSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logo state
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(settings.logoUrl || '');
  const [selectedIconPreset, setSelectedIconPreset] = useState<string>(settings.logoIcon || 'utensils');
  const [logoSaveMessage, setLogoSaveMessage] = useState<string | null>(null);

  // Supabase settings state
  const [supabaseUrl, setSupabaseUrl] = useState<string>(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(settings.supabaseAnonKey || '');
  const [useSupabaseBackend, setUseSupabaseBackend] = useState<boolean>(!!settings.useSupabaseBackend);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Supabase sync diagnosis & actions state
  const [syncStatus, setSyncStatus] = useState<SupabaseSyncStatus | null>(null);
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState(false);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState(false);
  const [isSyncingFromSupabase, setIsSyncingFromSupabase] = useState(false);
  const [syncActionMessage, setSyncActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Firebase state & actions
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [isFirebaseTesting, setIsFirebaseTesting] = useState(false);
  const [firebaseTestMessage, setFirebaseTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isFirebaseSyncingTo, setIsFirebaseSyncingTo] = useState(false);
  const [isFirebaseSyncingFrom, setIsFirebaseSyncingFrom] = useState(false);

  React.useEffect(() => {
    const unsub = subscribeToAuth((u) => setFirebaseUser(u));
    return unsub;
  }, []);

  const handleTestFirebase = async () => {
    setIsFirebaseTesting(true);
    setFirebaseTestMessage(null);
    try {
      const ok = await dbService.testFirebaseConnection();
      if (ok) {
        setFirebaseTestMessage({
          type: 'success',
          text: `Connexion Firebase Firestore vérifiée avec succès (Projet: ${(firebaseConfig as any).projectId}) !`,
        });
      } else {
        setFirebaseTestMessage({
          type: 'error',
          text: 'Connexion Firebase impossible ou client hors ligne.',
        });
      }
    } catch (e: any) {
      setFirebaseTestMessage({
        type: 'error',
        text: `Erreur Firebase : ${e.message || 'Échec'}`,
      });
    } finally {
      setIsFirebaseTesting(false);
    }
  };

  const handleSyncToFirebase = async () => {
    setIsFirebaseSyncingTo(true);
    setFirebaseTestMessage(null);
    try {
      const res = await dbService.syncAllToFirebase();
      setFirebaseTestMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (e: any) {
      setFirebaseTestMessage({
        type: 'error',
        text: `Erreur sync Firebase : ${e.message}`,
      });
    } finally {
      setIsFirebaseSyncingTo(false);
    }
  };

  const handleSyncFromFirebase = async () => {
    setIsFirebaseSyncingFrom(true);
    setFirebaseTestMessage(null);
    try {
      const res = await dbService.syncAllFromFirebase();
      setFirebaseTestMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        await refreshAdminData();
        await onRefreshData();
      }
    } catch (e: any) {
      setFirebaseTestMessage({
        type: 'error',
        text: `Erreur récupération Firebase : ${e.message}`,
      });
    } finally {
      setIsFirebaseSyncingFrom(false);
    }
  };

  const fetchSyncStatus = async () => {
    setIsLoadingSyncStatus(true);
    try {
      const status = await dbService.getSupabaseSyncStatus();
      setSyncStatus(status);
    } catch (e: any) {
      console.warn('Erreur lecture sync status Supabase:', e);
    } finally {
      setIsLoadingSyncStatus(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load all menus and authorized users on mount
  const refreshAdminData = async () => {
    try {
      const [allMenus, users] = await Promise.all([
        dbService.getAllMenus(),
        dbService.getAuthorizedUsers(),
      ]);
      setMenusList(allMenus);
      setAuthorizedUsersList(users);

      const activeMenu = allMenus.find((m) => m.isActive) || allMenus[0];
      if (activeMenu) {
        setActiveMenuId(activeMenu.id);
      }
      await fetchSyncStatus();
    } catch (e) {
      console.warn('Error loading admin multi-menus or whitelist:', e);
    }
  };

  React.useEffect(() => {
    refreshAdminData();
  }, []);

  // Update local reservations state when parent refreshes
  React.useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);

  // Update local menu state when parent refreshes
  React.useEffect(() => {
    setMenuData(initialMenu);
  }, [initialMenu]);

  // Update settings state when parent refreshes
  React.useEffect(() => {
    setAppSettings(settings);
    setCustomLogoUrl(settings.logoUrl || '');
    setSelectedIconPreset(settings.logoIcon || 'utensils');
    setSupabaseUrl(settings.supabaseUrl || '');
    setSupabaseAnonKey(settings.supabaseAnonKey || '');
    setUseSupabaseBackend(!!settings.useSupabaseBackend);
  }, [settings]);

  // Choisir un menu actif affiché pour les usagers
  const handleSetActiveMenu = async (menuId: string) => {
    const updated = await dbService.setActiveMenu(menuId);
    if (updated) {
      setActiveMenuId(menuId);
      setMenuData(updated);
      setMenuSaveMessage(`Le menu « ${updated.title} » est désormais le MENU ACTIF affiché pour les usagers !`);
      await onRefreshData();
      await refreshAdminData();
      setTimeout(() => setMenuSaveMessage(null), 4000);
    }
  };

  // Créer un nouveau menu
  const handleCreateNewMenu = async () => {
    const newMenu: DailyMenu = {
      id: `menu-custom-${Date.now()}`,
      date: todayDateStr,
      title: `Nouveau Menu ${menusList.length + 1}`,
      isActive: false,
      featuredPlatId: undefined,
      entrees: [
        {
          id: `entree-${Date.now()}`,
          category: 'entree',
          name: 'Nouvelle Entrée Maison',
          description: 'Salade fraîche ou velouté de saison.',
          allergens: [],
          isVegetarian: true,
          calories: 130,
        },
      ],
      plats: [
        {
          id: `plat-${Date.now()}`,
          category: 'plat',
          name: 'Nouveau Plat du Chef',
          description: 'Plat chaud garni avec légumes et féculents.',
          allergens: [],
          isVegetarian: false,
          isPlatDuJour: true,
          calories: 460,
        },
      ],
      desserts: [
        {
          id: `dessert-${Date.now()}`,
          category: 'dessert',
          name: 'Nouveau Dessert Gourmand',
          description: 'Pâtisserie ou fruit frais de saison.',
          allergens: [],
          isVegetarian: true,
          calories: 180,
        },
      ],
      breadBeverageIncluded: true,
      chefNote: 'Préparé avec passion pour le personnel.',
    };

    await dbService.saveDailyMenu(newMenu);
    setMenusList((prev) => [...prev, newMenu]);
    setMenuData(newMenu);
    setMenuSaveMessage('Nouveau menu créé avec succès ! Vous pouvez maintenant le personnaliser et le définir comme actif.');
    setTimeout(() => setMenuSaveMessage(null), 3500);
  };

  // Définir un plat comme Plat du Jour vedette
  const handleSetPlatDuJour = async (platId: string) => {
    const updatedPlats = menuData.plats.map((p) => ({
      ...p,
      isPlatDuJour: p.id === platId,
    }));
    const updatedMenu = { ...menuData, featuredPlatId: platId, plats: updatedPlats };
    setMenuData(updatedMenu);
    await dbService.saveDailyMenu(updatedMenu);
    setMenuSaveMessage(`Plat du jour défini sur : ${menuData.plats.find((p) => p.id === platId)?.name} ⭐`);
    await onRefreshData();
    setTimeout(() => setMenuSaveMessage(null), 3000);
  };

  // Supprimer un menu de la liste
  const handleDeleteMenu = async (menuId: string) => {
    if (menusList.length <= 1) {
      alert('Impossible de supprimer le dernier menu de l’établissement.');
      return;
    }
    const toDelete = menusList.find((m) => m.id === menuId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le menu « ${toDelete?.title || ''} » ?`)) {
      return;
    }
    await dbService.deleteDailyMenu(menuId);
    const updatedList = menusList.filter((m) => m.id !== menuId);
    setMenusList(updatedList);
    if (menuData.id === menuId) {
      setMenuData(updatedList[0]);
    }
    if (activeMenuId === menuId) {
      await handleSetActiveMenu(updatedList[0].id);
    }
    setMenuSaveMessage('Menu supprimé.');
    setTimeout(() => setMenuSaveMessage(null), 3000);
  };

  // Tester la connexion Supabase
  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseTestResult({
        success: false,
        message: 'Veuillez renseigner l’URL et la clé anonyme de votre projet Supabase.',
      });
      return;
    }

    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    const res = await dbService.testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSupabaseTestResult(res);
    setIsTestingSupabase(false);
  };

  // Enregistrer la configuration Supabase
  const handleSaveSupabaseConfig = async () => {
    try {
      await dbService.updateSettings({
        supabaseUrl: supabaseUrl.trim() || undefined,
        supabaseAnonKey: supabaseAnonKey.trim() || undefined,
        useSupabaseBackend: useSupabaseBackend,
      });
      alert('Configuration Supabase enregistrée !');
      await fetchSyncStatus();
      await onRefreshData();
    } catch {
      alert('Erreur lors de l’enregistrement de la configuration Supabase.');
    }
  };

  // Synchroniser tout vers Supabase (Push Cloud)
  const handleSyncToSupabase = async () => {
    setIsSyncingToSupabase(true);
    setSyncActionMessage(null);
    try {
      const res = await dbService.syncAllToSupabase();
      if (res.success) {
        setSyncActionMessage({ type: 'success', text: res.message });
        await fetchSyncStatus();
        await onRefreshData();
      } else {
        setSyncActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncActionMessage({
        type: 'error',
        text: `Erreur inattendue : ${err.message || 'Erreur réseau'}`,
      });
    } finally {
      setIsSyncingToSupabase(false);
      setTimeout(() => setSyncActionMessage(null), 8000);
    }
  };

  // Importer tout depuis Supabase (Pull Cloud)
  const handleSyncFromSupabase = async () => {
    setIsSyncingFromSupabase(true);
    setSyncActionMessage(null);
    try {
      const res = await dbService.syncAllFromSupabase();
      if (res.success) {
        setSyncActionMessage({ type: 'success', text: res.message });
        await fetchSyncStatus();
        await refreshAdminData();
        await onRefreshData();
      } else {
        setSyncActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncActionMessage({
        type: 'error',
        text: `Erreur inattendue : ${err.message || 'Erreur réseau'}`,
      });
    } finally {
      setIsSyncingFromSupabase(false);
      setTimeout(() => setSyncActionMessage(null), 8000);
    }
  };

  // Excel (.xlsx) export
  const handleExportExcel = () => {
    exportReservationsToExcel(reservations, menuData, appSettings, todayDateStr);
  };

  // Logo upload from local file
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Veuillez sélectionner une image de moins de 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    try {
      await dbService.updateSettings({
        logoUrl: customLogoUrl || undefined,
        logoIcon: selectedIconPreset,
      });
      setLogoSaveMessage('Logo enregistré et appliqué sur toute l’application !');
      await onRefreshData();
      setTimeout(() => setLogoSaveMessage(null), 3000);
    } catch {
      alert('Erreur lors de la sauvegarde du logo.');
    }
  };

  const handleApplyEsstsLogo = async () => {
    setCustomLogoUrl('/logo.svg');
    setSelectedIconPreset('essts');
    setAppSettings((prev) => ({
      ...prev,
      establishmentName: 'ESSTS - École Supérieure des Sciences et Technologies du Sport',
      logoUrl: '/logo.svg',
      logoIcon: 'essts',
    }));
    await dbService.updateSettings({
      establishmentName: 'ESSTS - École Supérieure des Sciences et Technologies du Sport',
      logoUrl: '/logo.svg',
      logoIcon: 'essts',
    });
    setLogoSaveMessage('Logo officiel ESSTS appliqué avec succès !');
    await onRefreshData();
    setTimeout(() => setLogoSaveMessage(null), 3500);
  };

  const handleResetLogo = async () => {
    setCustomLogoUrl('/logo.svg');
    setSelectedIconPreset('essts');
    await dbService.updateSettings({
      logoUrl: '/logo.svg',
      logoIcon: 'essts',
    });
    setLogoSaveMessage('Logo officiel ESSTS rétabli.');
    await onRefreshData();
    setTimeout(() => setLogoSaveMessage(null), 3000);
  };

  // ----------------------------------------------------
  // RESERVATIONS & KITCHEN METRICS
  // ----------------------------------------------------
  const confirmedReservations = reservations.filter((r) => r.status !== 'cancelled');
  const servedCount = reservations.filter((r) => r.status === 'served').length;
  const remainingToServe = confirmedReservations.length - servedCount;
  const placesLeft = Math.max(0, appSettings.capacityPerDay - confirmedReservations.length);

  // Répartition par type de repas
  const breakfastReservations = confirmedReservations.filter((r) => r.mealType === 'breakfast');
  const lunchReservations = confirmedReservations.filter((r) => (r.mealType || 'lunch') === 'lunch');
  const dinnerReservations = confirmedReservations.filter((r) => r.mealType === 'dinner');

  const breakfastServedCount = reservations.filter((r) => r.status === 'served' && r.mealType === 'breakfast').length;
  const lunchServedCount = reservations.filter((r) => r.status === 'served' && (r.mealType || 'lunch') === 'lunch').length;
  const dinnerServedCount = reservations.filter((r) => r.status === 'served' && r.mealType === 'dinner').length;

  // Pool de tous les plats et formules (Midi + Petit-déj + Dîner)
  const allDishes = React.useMemo(() => {
    return [
      ...menuData.plats,
      ...(menuData.breakfastItems || []),
      ...(menuData.dinnerPlats || []),
    ];
  }, [menuData]);

  // Kitchen dish quantities calculation
  const platCounts = React.useMemo(() => {
    const counts: Record<string, { name: string; isVeg: boolean; count: number }> = {};
    allDishes.forEach((p) => {
      counts[p.id] = { name: p.name, isVeg: !!p.isVegetarian, count: 0 };
    });

    confirmedReservations.forEach((r) => {
      if (counts[r.selectedPlatId]) {
        counts[r.selectedPlatId].count += 1;
      }
    });
    return Object.values(counts);
  }, [allDishes, confirmedReservations]);

  const vegetarianCount = platCounts
    .filter((p) => p.isVeg)
    .reduce((acc, curr) => acc + curr.count, 0);

  // Filtered reservations list (incluant le filtre par type de repas)
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.staffDepartment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDepartmentFilter === 'ALL' || r.staffDepartment === selectedDepartmentFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesMeal =
      mealTypeFilter === 'ALL' || (r.mealType || 'lunch') === mealTypeFilter;
    return matchesSearch && matchesDept && matchesStatus && matchesMeal;
  });

  const handleToggleServed = async (reservationId: string, currentStatus: string) => {
    const newServed = currentStatus !== 'served';
    await dbService.toggleReservationServed(reservationId, newServed);
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: newServed ? 'served' : 'confirmed' } : r))
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'N° Retrait',
      'Service',
      'Nom Prénom',
      'Service/Pôle',
      'Créneau horaire',
      'Plat principal / Formule',
      'Entrée',
      'Dessert',
      'Remarques diététiques',
      'Statut',
      'Heure réservation',
    ];

    const rows = confirmedReservations.map((r) => {
      const allEntrees = [...menuData.entrees, ...(menuData.dinnerEntrees || [])];
      const allDesserts = [...menuData.desserts, ...(menuData.dinnerDesserts || [])];
      const entreeName = allEntrees.find((e) => e.id === r.selectedEntreeId)?.name || '-';
      const platName = allDishes.find((p) => p.id === r.selectedPlatId)?.name || '-';
      const dessertName = allDesserts.find((d) => d.id === r.selectedDessertId)?.name || '-';
      const mealLabel = r.mealType === 'breakfast' ? 'Petit-déjeuner' : r.mealType === 'dinner' ? 'Dîner' : 'Déjeuner (Midi)';
      return [
        `"${r.ticketCode}"`,
        `"${mealLabel}"`,
        `"${r.staffName.replace(/"/g, '""')}"`,
        `"${r.staffDepartment.replace(/"/g, '""')}"`,
        `"${r.timeSlot}"`,
        `"${platName.replace(/"/g, '""')}"`,
        `"${entreeName.replace(/"/g, '""')}"`,
        `"${dessertName.replace(/"/g, '""')}"`,
        `"${(r.dietaryNotes || '').replace(/"/g, '""')}"`,
        `"${r.status === 'served' ? 'Servi' : 'En attente'}"`,
        `"${new Date(r.createdAt).toLocaleTimeString('fr-FR')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `repas_personnel_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // MENU MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleSaveMenu = async () => {
    setIsSavingMenu(true);
    setMenuSaveMessage(null);
    try {
      await dbService.saveDailyMenu(menuData);
      setMenuSaveMessage('Menu du jour enregistré avec succès !');
      await onRefreshData();
      setTimeout(() => setMenuSaveMessage(null), 3500);
    } catch {
      setMenuSaveMessage('Erreur lors de la sauvegarde du menu.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  const handleAddDish = (category: MealCategory) => {
    const newItem: MenuItem = {
      id: `${category}-${Date.now()}`,
      category,
      name: category === 'plat' ? 'Nouveau plat chaud' : category === 'entree' ? 'Nouvelle entrée' : 'Nouveau dessert',
      description: 'Description des ingrédients et de la préparation...',
      allergens: [],
      isVegetarian: false,
      calories: category === 'plat' ? 450 : 150,
    };

    if (category === 'entree') {
      setMenuData({ ...menuData, entrees: [...menuData.entrees, newItem] });
    } else if (category === 'plat') {
      setMenuData({ ...menuData, plats: [...menuData.plats, newItem] });
    } else {
      setMenuData({ ...menuData, desserts: [...menuData.desserts, newItem] });
    }
  };

  const handleDeleteDish = (category: MealCategory, id: string) => {
    if (category === 'entree') {
      setMenuData({ ...menuData, entrees: menuData.entrees.filter((i) => i.id !== id) });
    } else if (category === 'plat') {
      if (menuData.plats.length <= 1) {
        alert('Il doit subsister au moins un plat chaud dans le menu.');
        return;
      }
      setMenuData({ ...menuData, plats: menuData.plats.filter((i) => i.id !== id) });
    } else {
      setMenuData({ ...menuData, desserts: menuData.desserts.filter((i) => i.id !== id) });
    }
  };

  const handleUpdateDish = (category: MealCategory, id: string, updates: Partial<MenuItem>) => {
    const updateList = (list: MenuItem[]) =>
      list.map((item) => (item.id === id ? { ...item, ...updates } : item));

    if (category === 'entree') {
      setMenuData({ ...menuData, entrees: updateList(menuData.entrees) });
    } else if (category === 'plat') {
      setMenuData({ ...menuData, plats: updateList(menuData.plats) });
    } else {
      setMenuData({ ...menuData, desserts: updateList(menuData.desserts) });
    }
  };

  // ----------------------------------------------------
  // SETTINGS & PASSWORD CHANGE
  // ----------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage(null);
    try {
      await dbService.updateSettings({
        establishmentName: appSettings.establishmentName,
        capacityPerDay: Number(appSettings.capacityPerDay),
        bookingWindowStart: appSettings.bookingWindowStart,
        bookingWindowEnd: appSettings.bookingWindowEnd,
        serviceHours: appSettings.serviceHours,
      });
      setSettingsMessage({ type: 'success', text: 'Paramètres mis à jour avec succès.' });
      await onRefreshData();
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch {
      setSettingsMessage({ type: 'error', text: 'Impossible d’enregistrer les paramètres.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'La confirmation ne correspond pas au nouveau mot de passe.',
      });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit comporter au moins 4 caractères.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await dbService.updateAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordMessage({
          type: 'success',
          text: 'Mot de passe administrateur modifié avec succès ! Mémorisez-le bien.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({
          type: 'error',
          text: res.error || 'Erreur lors du changement de mot de passe.',
        });
      }
    } catch {
      setPasswordMessage({
        type: 'error',
        text: 'Une erreur technique est survenue.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'Voulez-vous réinitialiser le menu et les réservations de test vers les valeurs par défaut ?'
      )
    ) {
      await dbService.resetDemoData();
      await onRefreshData();
      alert('Données réinitialisées avec succès.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Sheet Header (VISIBLE ONLY ON PRINT) */}
      <div className="print-only mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Feuille d'émargement &bull; Restauration du personnel
        </h1>
        <p className="text-sm font-semibold mt-1">
          {appSettings.establishmentName} &bull; Date : {formatFrenchDate(todayDateStr)}
        </p>
        <div className="mt-2 text-xs flex gap-6">
          <span>Total inscrits : <strong>{confirmedReservations.length} repas</strong></span>
          <span>Dont végétariens : <strong>{vegetarianCount}</strong></span>
          <span>Plage horaire cantine : <strong>{appSettings.serviceHours}</strong></span>
        </div>
      </div>

      {/* Admin Top Banner */}
      <div className="no-print bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
            <Key className="w-3.5 h-3.5" />
            <span>Espace Gestionnaire &amp; Cuisine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('adminDashboardTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {settings.establishmentName} &bull; {formatDate(todayDateStr)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveAdminTab('settings');
              setSettingsSubTab('database');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition border ${
              syncStatus?.isConnected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
            }`}
            title="État Supabase Cloud (cliquer pour gérer)"
          >
            {syncStatus?.isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Wifi className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Supabase Connecté ({syncStatus.menusCount} menus, {syncStatus.usersCount} usagers)</span>
                <span className="md:hidden">Cloud OK</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Mode LocalStorage</span>
                <span className="md:hidden">Local</span>
              </>
            )}
          </button>

          <button
            onClick={async () => {
              await onRefreshData();
              await fetchSyncStatus();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={() => setIsCanteenPosterOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2 transition shadow-xs"
            title="Affiche et QR Code à imprimer ou télécharger pour le comptoir de la cantine"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Affiche Comptoir (QR Code)</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
            <span>{t('logoutBtn')}</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="no-print flex items-center border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveAdminTab('inscrits')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'inscrits'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('tabTodayReservations')} ({confirmedReservations.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('menu')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'menu'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>{t('tabMenusAndDishes')} ({menusList.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'users'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('tabAuthorizedUsers')} ({authorizedUsersList.length})</span>
          {authorizedUsersList.filter((u) => u.approvalStatus === 'pending' || (!u.approvalStatus && !u.active)).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {authorizedUsersList.filter((u) => u.approvalStatus === 'pending' || (!u.approvalStatus && !u.active)).length} en attente
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('trends')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'trends'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>{t('tabTrendsAndPredictions') || 'Tendance & Ingrédients'}</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>{t('tabSettings')}</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: INSCRITS DU JOUR & ÉMARGEMENT */}
      {/* ==================================================== */}
      {activeAdminTab === 'inscrits' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Réservations
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  {confirmedReservations.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {appSettings.capacityPerDay} max
                </span>
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                {placesLeft} places encore disponibles
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Repas Émargés / Servis
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-teal-700">{servedCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  ({Math.round((servedCount / (confirmedReservations.length || 1)) * 100)}%)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {remainingToServe} restants à servir
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Option Végétarienne
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-600">{vegetarianCount}</span>
                <span className="text-xs font-semibold text-slate-500">portions</span>
              </div>
              <span className="text-xs text-emerald-700 font-medium mt-1 block flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" />
                <span>Risotto ou option sans viande</span>
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Fenêtre de Commande
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {appSettings.bookingWindowStart} - {appSettings.bookingWindowEnd}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                Service midi : {appSettings.serviceHours}
              </span>
            </div>
          </div>

          {/* Répartition par service : Petit-déjeuner, Midi, Dîner */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide block">
                    🥐 Petit-déjeuner
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Service 07h00 - 09h00
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-900 font-mono">
                  {breakfastReservations.length}
                </span>
                <span className="text-[11px] text-amber-700 block">
                  {breakfastServedCount} servi{breakfastServedCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide block">
                    🍽️ Repas de midi
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Service 11h45 - 13h45
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {lunchReservations.length}
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  {lunchServedCount} servi{lunchServedCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide block">
                    🌙 Dîner (Soir)
                  </span>
                  <span className="text-[11px] text-indigo-800">
                    Service 19h00 - 21h00
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-900 font-mono">
                  {dinnerReservations.length}
                </span>
                <span className="text-[11px] text-indigo-700 block">
                  {dinnerServedCount} servi{dinnerServedCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Active Menu & Plat du Jour Live Indicator */}
          {(() => {
            const currentLiveMenu = menusList.find((m) => m.id === activeMenuId || m.isActive) || initialMenu;
            const livePlatDuJour = currentLiveMenu.plats.find((p) => p.id === currentLiveMenu.featuredPlatId || p.isPlatDuJour) || currentLiveMenu.plats[0];
            return (
              <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <Star className="w-6 h-6 fill-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Menu en direct pour les usagers
                      </span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {currentLiveMenu.title}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span className="text-slate-500 font-normal">Plat du Jour :</span>
                      <span>{livePlatDuJour ? livePlatDuJour.name : 'Non défini'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('menu')}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Changer le Menu du Jour</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Bannière d'accès direct aux prévisions d'ingrédients & tendances */}
          <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-emerald-900/40">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    Nouveau &bull; Analyse Recharts &amp; Prévisions
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white mt-0.5">
                  Anticipation des Approvisionnements &amp; Flux de la Semaine
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Estimez automatiquement les quantités d'ingrédients (poisson, maraîchage, féculents, boulangerie) pour minimiser le gaspillage.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveAdminTab('trends')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shrink-0 shadow-xs"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Consulter les Prévisions Ingrédients</span>
            </button>
          </div>

          {/* Kitchen dish prep synthesis */}
          <div className="no-print bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                <span>Synthèse de production pour les cuisiniers</span>
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Calibrage des portions chaudes
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platCounts.map((plat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1 block">
                      {plat.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {plat.isVeg ? '🌱 Végétarien' : 'Viande / Poisson'}
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-lg shrink-0">
                    {plat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique de fréquentation journalière des repas sur 7 jours (Anticipation cuisine) */}
          <div className="no-print">
            <SevenDayAttendanceChart
              settings={appSettings}
              todayDateStr={todayDateStr}
              todayReservations={confirmedReservations}
              currentMenu={menuData}
            />
          </div>

          {/* Table Toolbar */}
          <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, service ou code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsNewReservationModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Créer manuellement une réservation pour un agent (Petit-déjeuner, Midi ou Dîner)"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nouvelle Réservation</span>
              </button>

              <select
                value={mealTypeFilter}
                onChange={(e) => setMealTypeFilter(e.target.value as any)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Tous les services (Tous les repas)</option>
                <option value="breakfast">🥐 Petit-déjeuner ({breakfastReservations.length})</option>
                <option value="lunch">🍽️ Repas de midi ({lunchReservations.length})</option>
                <option value="dinner">🌙 Dîner ({dinnerReservations.length})</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="confirmed">Confirmés (en attente)</option>
                <option value="served">Déjà servis</option>
                <option value="cancelled">Annulés</option>
              </select>

              <button
                onClick={onOpenScanner}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Ouvrir la caméra pour scanner les QR codes de repas"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scanner Ticket (QR Code)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCanteenPosterOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Télécharger ou imprimer le QR Code affiché sur le comptoir de la cantine"
              >
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Affiche Comptoir (QR)</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                title="Télécharger le fichier Excel (.xlsx) complet avec liste des inscrits et synthèse cuisine"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exporter Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
                title="Format texte CSV standard"
              >
                <span>CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Feuille</span>
              </button>
            </div>
          </div>

          {/* Reservations List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Émarger</th>
                    <th className="py-3 px-4">N° Ticket</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Nom de l'agent</th>
                    <th className="py-3 px-4">Pôle / Service</th>
                    <th className="py-3 px-4">Plat / Formule</th>
                    <th className="py-3 px-4">Créneau</th>
                    <th className="py-3 px-4">Précisions</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Aucune réservation trouvée correspondant aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((r) => {
                      const platItem = allDishes.find((p) => p.id === r.selectedPlatId);
                      const isServed = r.status === 'served';
                      const isCancelled = r.status === 'cancelled';

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isCancelled ? 'opacity-40 bg-slate-50' : isServed ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              disabled={isCancelled}
                              onClick={() => handleToggleServed(r.id, r.status)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition border ${
                                isServed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 hover:border-emerald-500 bg-white text-transparent'
                              }`}
                              title={isServed ? 'Marquer comme non servi' : 'Marquer comme servi'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {r.ticketCode}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.mealType === 'breakfast'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : r.mealType === 'dinner'
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {r.mealType === 'breakfast'
                                ? '🥐 Petit-déj'
                                : r.mealType === 'dinner'
                                ? '🌙 Dîner'
                                : '🍽️ Midi'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{r.staffName}</span>
                            {r.staffEmail && (
                              <span className="text-[11px] text-slate-400 block">{r.staffEmail}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {r.staffDepartment}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {platItem ? platItem.name : 'Plat principal'}
                            </span>
                            {platItem?.isVegetarian && (
                              <span className="text-[10px] text-emerald-700 font-bold">
                                🌱 Végétarien
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {r.timeSlot}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {r.dietaryNotes ? (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                {r.dietaryNotes}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isCancelled ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                Annulé
                              </span>
                            ) : isServed ? (
                              <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  Servi
                                </span>
                                {r.servedAt && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    à {new Date(r.servedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                Confirmé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: GESTION DES MENUS & CHOIX DU MENU DU JOUR */}
      {/* ==================================================== */}
      {activeAdminTab === 'menu' && (
        <div className="space-y-6">
          {/* SÉLECTEUR DE MENUS MULTIPLES & ACTIVATION */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                  <Star className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Gestion &amp; Publication des Menus</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Choisir le Menu à afficher pour les usagers
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                  Sélectionnez parmi vos menus enregistrés celui qui sera immédiatement publié et visible sur l’interface de réservation du personnel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewMenu}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Créer un nouveau menu</span>
                </button>
              </div>
            </div>

            {/* Grille de cartes de sélection des menus */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menusList.map((m) => {
                const isActiveDisplay = m.id === activeMenuId || m.isActive;
                const isCurrentEdit = m.id === menuData.id;
                const featuredPlat = m.plats.find((p) => p.id === m.featuredPlatId || p.isPlatDuJour) || m.plats[0];

                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl flex flex-col justify-between transition border-2 overflow-hidden ${
                      isActiveDisplay
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                        : isCurrentEdit
                        ? 'bg-slate-800/70 border-amber-400/80 shadow-xs'
                        : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Cover photo banner */}
                    {m.coverImageUrl ? (
                      <div className="h-24 w-full relative overflow-hidden bg-slate-900 border-b border-slate-700 group">
                        <img
                          src={m.coverImageUrl}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                        <button
                          type="button"
                          onClick={() => {
                            setMenuData(m);
                            setIsMenuCoverModalOpen(true);
                          }}
                          className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition shadow-xs"
                          title="Modifier la photo de ce menu"
                        >
                          <Camera className="w-3 h-3 text-emerald-400" />
                          <span>Photo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 sm:px-5 pt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuData(m);
                            setIsMenuCoverModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition bg-emerald-950/60 hover:bg-emerald-900/80 px-2 py-0.5 rounded-lg border border-emerald-800/50"
                          title="Ajouter une photo de couverture pour ce menu"
                        >
                          <Camera className="w-3 h-3" />
                          <span>+ Ajouter photo</span>
                        </button>
                      </div>
                    )}

                    <div className="p-4 sm:p-5 pt-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Menu du {formatFrenchDate(m.date || todayDateStr)}
                        </span>
                        {isActiveDisplay ? (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs shrink-0">
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>Affiché en direct</span>
                          </span>
                        ) : (
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                            En réserve
                          </span>
                        )}
                      </div>

                      <h5 className="font-extrabold text-base text-white leading-snug">
                        {m.title}
                      </h5>

                      {featuredPlat && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>Plat du Jour :</span>
                          </span>
                          <span className="font-semibold text-slate-200 block truncate mt-0.5">
                            {featuredPlat.name}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{m.entrees.length} entrée{m.entrees.length > 1 ? 's' : ''}</span>
                        <span>&bull;</span>
                        <span>{m.plats.length} plat{m.plats.length > 1 ? 's' : ''}</span>
                        <span>&bull;</span>
                        <span>{m.desserts.length} dessert{m.desserts.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                      {isActiveDisplay ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 py-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Menu sélectionné</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetActiveMenu(m.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Afficher ce menu</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMenuData(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isCurrentEdit
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                          title="Modifier les plats de ce menu"
                        >
                          {isCurrentEdit ? 'Édition en cours' : 'Modifier'}
                        </button>

                        {menusList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMenu(m.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                            title="Supprimer ce menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Édition du menu : {menuData.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifiez les propositions, désignez le Plat du Jour vedette ou ajoutez de nouveaux plats.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCanteenPosterOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                title="Afficher et imprimer le QR Code du comptoir cantine pour les agents"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Affiche QR Code Cantine</span>
              </button>

              <button
                onClick={handleSaveMenu}
                disabled={isSavingMenu}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingMenu ? 'Enregistrement...' : 'Enregistrer le Menu'}</span>
              </button>
            </div>
          </div>

          {menuSaveMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{menuSaveMessage}</span>
            </div>
          )}

          {/* Menu Title & Chef note */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Titre d'ambiance du Menu
              </label>
              <input
                type="text"
                value={menuData.title}
                onChange={(e) => setMenuData({ ...menuData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Note de la brigade / Message du Chef
              </label>
              <input
                type="text"
                value={menuData.chefNote || ''}
                onChange={(e) => setMenuData({ ...menuData, chefNote: e.target.value })}
                placeholder="Ex : Produits bio en circuit court, maraîchage régional..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            {/* Photo de Couverture / Bannière du Menu */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Photo de Couverture / Bannière d'ambiance du Menu
              </label>
              {menuData.coverImageUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-full sm:w-44 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-inner">
                    <img
                      src={menuData.coverImageUrl}
                      alt={menuData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Bannière d'en-tête active pour ce menu
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Cette photo s'affiche en grand format d'ambiance sur la page d'accueil de la cantine.
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <button
                        type="button"
                        onClick={handleOpenMenuCoverModal}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Changer / Suggestions</span>
                      </button>

                      <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-slate-200 shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fichier local</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleQuickUploadDishPhoto(f, 'menu-cover', 'menu');
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDirectRemovePhoto('menu-cover', 'menu')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer la bannière</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">
                        Aucune photo de couverture
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Ajoutez une photo culinaire ou une bannière pour habiller ce menu.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fichier local</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleQuickUploadDishPhoto(f, 'menu-cover', 'menu');
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleOpenMenuCoverModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Choisir / Suggestions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. Entrées */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>1. Les Entrées ({menuData.entrees.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddDish('entree')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une entrée</span>
              </button>
            </div>

            <div className="space-y-4">
              {menuData.entrees.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateDish('entree', item.id, { name: e.target.value })}
                      className="font-bold text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteDish('entree', item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateDish('entree', item.id, { description: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />

                  {/* Photo area */}
                  {item.imageUrl ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">Photo enregistrée</span>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(item)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Changer</span>
                          </button>
                          <span className="text-slate-300">&bull;</span>
                          <label className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition">
                            <Upload className="w-3 h-3" />
                            <span>Fichier</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleQuickUploadDishPhoto(f, item.id, 'entree');
                              }}
                              className="hidden"
                            />
                          </label>
                          <span className="text-slate-300">&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleDirectRemovePhoto(item.id, 'entree')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 border border-dashed border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Aucune photo pour cette entrée</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs">
                          <Upload className="w-3 h-3" />
                          <span>Fichier local</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleQuickUploadDishPhoto(f, item.id, 'entree');
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Choisir / Suggestions</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!item.isVegetarian}
                        onChange={(e) => handleUpdateDish('entree', item.id, { isVegetarian: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>Option Végétarienne</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Plats Chauds */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>2. Les Plats Chauds ({menuData.plats.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddDish('plat')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un plat</span>
              </button>
            </div>

            <div className="space-y-4">
              {menuData.plats.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateDish('plat', item.id, { name: e.target.value })}
                      className="font-bold text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteDish('plat', item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateDish('plat', item.id, { description: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />

                  {/* Photo area */}
                  {item.imageUrl ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">Photo du plat</span>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(item)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Changer</span>
                          </button>
                          <span className="text-slate-300">&bull;</span>
                          <label className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition">
                            <Upload className="w-3 h-3" />
                            <span>Fichier</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleQuickUploadDishPhoto(f, item.id, 'plat');
                              }}
                              className="hidden"
                            />
                          </label>
                          <span className="text-slate-300">&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleDirectRemovePhoto(item.id, 'plat')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 border border-dashed border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Aucune photo pour ce plat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs">
                          <Upload className="w-3 h-3" />
                          <span>Fichier local</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleQuickUploadDishPhoto(f, item.id, 'plat');
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-teal-500 text-teal-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Choisir / Suggestions</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 text-xs pt-1 border-t border-slate-200/80">
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!item.isVegetarian}
                        onChange={(e) => handleUpdateDish('plat', item.id, { isVegetarian: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-bold text-emerald-700">🌱 Plat Végétarien</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSetPlatDuJour(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                        item.isPlatDuJour || item.id === menuData.featuredPlatId
                          ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-200 hover:bg-amber-100 text-slate-700'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {item.isPlatDuJour || item.id === menuData.featuredPlatId
                          ? '⭐ Plat du Jour (Actif)'
                          : 'Définir comme Plat du Jour'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Desserts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>3. Les Desserts ({menuData.desserts.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddDish('dessert')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un dessert</span>
              </button>
            </div>

            <div className="space-y-4">
              {menuData.desserts.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateDish('dessert', item.id, { name: e.target.value })}
                      className="font-bold text-sm px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteDish('dessert', item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateDish('dessert', item.id, { description: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />

                  {/* Photo area */}
                  {item.imageUrl ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">Photo du dessert</span>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(item)}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Changer</span>
                          </button>
                          <span className="text-slate-300">&bull;</span>
                          <label className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition">
                            <Upload className="w-3 h-3" />
                            <span>Fichier</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleQuickUploadDishPhoto(f, item.id, 'dessert');
                              }}
                              className="hidden"
                            />
                          </label>
                          <span className="text-slate-300">&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleDirectRemovePhoto(item.id, 'dessert')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 border border-dashed border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Aucune photo pour ce dessert</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs">
                          <Upload className="w-3 h-3" />
                          <span>Fichier local</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleQuickUploadDishPhoto(f, item.id, 'dessert');
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 text-amber-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Choisir / Suggestions</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: PERSONNEL AUTORISÉ (WHITELIST) */}
      {/* ==================================================== */}
      {activeAdminTab === 'users' && (
        <AuthorizedUsersManager
          initialUsers={authorizedUsersList}
          onRefresh={refreshAdminData}
        />
      )}

      {/* ==================================================== */}
      {/* TAB 4: TENDANCE & PRÉVISIONS INGRÉDIENTS (RECHARTS) */}
      {/* ==================================================== */}
      {activeAdminTab === 'trends' && (
        <div className="space-y-6">
          <SevenDayAttendanceChart
            settings={appSettings}
            todayDateStr={todayDateStr}
            todayReservations={confirmedReservations}
            currentMenu={menuData}
          />
          <WeeklyReservationTrends
            currentMenu={menuData}
            todayReservations={reservations}
            settings={appSettings}
            todayDateStr={todayDateStr}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: PARAMÈTRES, HORAIRES, LOGO & SUPABASE */}
      {/* ==================================================== */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-6">
          {/* Sub-navigation tabs for Settings */}
          <div className="no-print flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => setSettingsSubTab('general')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                settingsSubTab === 'general'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{t('settingsGeneralTitle')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSubTab('logo')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                settingsSubTab === 'logo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{t('settingsBrandingTitle')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSubTab('database')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                settingsSubTab === 'database'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>{t('settingsDatabaseTitle')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSubTab('security')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                settingsSubTab === 'security'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-4 h-4 text-amber-600" />
              <span>{t('settingsSecurityTitle')}</span>
            </button>
          </div>

          {/* Section 1: Paramètres généraux de la cantine */}
          {settingsSubTab === 'general' && (
          <>
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Configuration de la Capacité &amp; Horaires
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Réglez le nombre maximum de couverts quotidiens et les créneaux d'ouverture du service.
            </p>

            {settingsMessage && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                  settingsMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {settingsMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{settingsMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom de l'établissement
                  </label>
                  <input
                    type="text"
                    required
                    value={appSettings.establishmentName}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, establishmentName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Capacité maximale de repas par jour (couverts)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    required
                    value={appSettings.capacityPerDay}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, capacityPerDay: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Bloque automatiquement les réservations une fois cette jauge atteinte.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Début des réservations (Heure stricte)
                  </label>
                  <input
                    type="time"
                    required
                    value={appSettings.bookingWindowStart}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, bookingWindowStart: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Clôture des réservations (Heure stricte)
                  </label>
                  <input
                    type="time"
                    required
                    value={appSettings.bookingWindowEnd}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, bookingWindowEnd: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Horaires de service au réfectoire
                  </label>
                  <input
                    type="text"
                    required
                    value={appSettings.serviceHours}
                    onChange={(e) =>
                      setAppSettings({ ...appSettings, serviceHours: e.target.value })
                    }
                    placeholder="11h45 - 13h45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Contrôle Whitelist */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={!!appSettings.restrictToAuthorizedUsers}
                    onChange={(e) =>
                      setAppSettings({
                        ...appSettings,
                        restrictToAuthorizedUsers: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Contrôle Whitelist : Réserver l'accès exclusivement aux agents figurant sur la liste autorisée
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Si activé, l'application bloque toute réservation d'un nom ou badge non enregistré dans l'onglet « Personnel Autorisé ».
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les paramètres de l'établissement</span>
                </button>
              </div>
            </form>
          </div>

          {/* Carte dédiée : Affiche & QR Code du Comptoir de la Cantine */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 rounded-3xl border border-emerald-800/60 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Comptoir Cantine &bull; Distribution
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">Format A4 &amp; Chevalet</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1">
                    Affiche &amp; QR Code affiché sur le comptoir du réfectoire
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Téléchargez le QR Code officiel en PNG haute définition ou l'affiche PDF pour le chevalet de comptoir. Les agents le scannent sur place pour valider leur prise de repas.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCanteenPosterOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Ouvrir &amp; Télécharger</span>
                </button>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Section 2: Personnalisation & Logo de l'établissement */}
          {settingsSubTab === 'logo' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Personnalisation du Logo de l'Établissement
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Exigence du cahier des charges : permet à l'administrateur de modifier le logo affiché sur l'en-tête, les tickets et les impressions.
            </p>

            {logoSaveMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{logoSaveMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne 1 & 2 : Options d'import et de choix */}
              <div className="lg:col-span-2 space-y-5">
                {/* Option 0 : Logo officiel ESSTS */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 bg-white rounded-xl border border-blue-200/80 flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                      <EsstsLogo size="xs" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-blue-950">
                          Logo Officiel ESSTS
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          Recommandé
                        </span>
                      </div>
                      <p className="text-xs text-blue-800 font-semibold mt-0.5">
                        المدرسة العليا لعلوم الرياضة وتكنولوجياتها
                      </p>
                      <p className="text-[11px] text-blue-600/80 font-medium">
                        École Supérieure des Sciences et Technologies du Sport
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyEsstsLogo}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Appliquer Logo ESSTS</span>
                  </button>
                </div>

                {/* Option A : Importer un fichier image */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Option A &bull; Importer une autre image depuis votre ordinateur</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Formats acceptés : PNG, JPG, SVG, WebP (recommandé : fond transparent ou blanc).
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer"
                  />
                </div>

                {/* Option B : URL Web */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Option B &bull; Ou renseigner l'adresse URL d'un logo en ligne
                  </label>
                  <input
                    type="url"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://mon-etablissement.fr/logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium bg-white"
                  />
                </div>

                {/* Option C : Icônes d'établissement préconfigurées */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Option C &bull; Ou choisir une icône thématique d'établissement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'essts', label: 'ESSTS Officiel', icon: Sparkles },
                      { id: 'school', label: 'Éducation / Sport', icon: GraduationCap },
                      { id: 'utensils', label: 'Restauration', icon: Utensils },
                      { id: 'chef', label: 'Toque Chef', icon: ChefHat },
                      { id: 'hospital', label: 'Santé & Soins', icon: HeartPulse },
                      { id: 'building', label: 'Entreprise', icon: Building2 },
                    ].map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = selectedIconPreset === item.id && !customLogoUrl;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedIconPreset(item.id);
                            setCustomLogoUrl(item.id === 'essts' ? '/logo.svg' : '');
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveLogo}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Appliquer et Enregistrer le Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    <span>Réinitialiser par défaut</span>
                  </button>
                </div>
              </div>

              {/* Colonne 3 : Aperçu en direct */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                    Aperçu en temps réel
                  </span>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <AppLogo
                      settings={{
                        ...appSettings,
                        logoUrl: customLogoUrl || undefined,
                        logoIcon: selectedIconPreset,
                      }}
                      size="lg"
                      showText={true}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    Ce visuel sera immédiatement projeté sur la barre de navigation, les tickets de retrait du personnel et les feuilles de cantine.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/80 text-[10px] text-slate-400">
                  Modifiable à tout moment par l'administrateur.
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Section 3: Sécurité - Changement du mot de passe Admin */}
          {settingsSubTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Modifier le Mot de Passe Administrateur
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Exigence du cahier des charges : permet à l'administrateur de renouveler son mot de passe directement depuis l'interface.
            </p>

            {passwordMessage && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mot de passe actuel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nouveau mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 4 caractères..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <Key className="w-4 h-4" />
                  <span>
                    {isChangingPassword ? 'Mise à jour en cours...' : 'Valider le nouveau mot de passe'}
                  </span>
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Section: Base de données Cloud Firebase & Supabase */}
          {settingsSubTab === 'database' && (
          <div className="space-y-6">
            {/* 0. Carte dédiée Firebase Firestore & Auth */}
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white p-6 sm:p-8 rounded-3xl border border-amber-300/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.65 18.23l2.84-15.42a.5.5 0 0 1 .92-.15l3.29 6.22-7.05 9.35zm14.7 0l-3.32-15.42a.5.5 0 0 0-.92-.15l-3.29 6.22 7.53 9.35zm-9.3 1.95L3.6 15.65l6.45 4.53zm8.9 0l-6.45-4.53 6.45 4.53z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Firebase Firestore &amp; Authentification Google
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
                        Provisionné &bull; Actif
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Base de données NoSQL Firestore avec règles de sécurité ABAC et connexion Google
                    </p>
                  </div>
                </div>

                {/* Google Auth Status / Login */}
                <div className="flex items-center gap-2 shrink-0">
                  {firebaseUser ? (
                    <div className="flex items-center gap-2.5 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-2xs">
                      {firebaseUser.photoURL ? (
                        <img
                          src={firebaseUser.photoURL}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full border border-slate-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {firebaseUser.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 block leading-tight">
                          {firebaseUser.displayName || firebaseUser.email}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block leading-none">
                          {firebaseUser.email === 'rita68dz@gmail.com' ? 'Super-Admin' : 'Connecté'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => signOutUser()}
                        className="text-xs text-slate-400 hover:text-rose-600 transition ml-1"
                        title="Se déconnecter"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Connexion Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Détails de configuration Firebase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/60 block">
                    ID Projet Firebase
                  </span>
                  <code className="text-xs font-mono font-bold text-amber-950 mt-0.5 block truncate">
                    {(firebaseConfig as any).projectId || 'maximal-weaver-l8f9p'}
                  </code>
                </div>

                <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/60 block">
                    Base Firestore Database
                  </span>
                  <code className="text-xs font-mono font-bold text-amber-950 mt-0.5 block truncate">
                    {(firebaseConfig as any).firestoreDatabaseId || 'default'}
                  </code>
                </div>

                <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/60 block">
                    Règles de sécurité ABAC
                  </span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Déployées &amp; Actives</span>
                  </span>
                </div>
              </div>

              {/* Message de test / action */}
              {firebaseTestMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 mb-4 ${
                    firebaseTestMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {firebaseTestMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{firebaseTestMessage.text}</span>
                </div>
              )}

              {/* Actions de synchronisation Firebase */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={isFirebaseTesting}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isFirebaseTesting ? 'animate-spin' : ''}`} />
                  <span>{isFirebaseTesting ? 'Test...' : 'Tester Firestore'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToFirebase}
                  disabled={isFirebaseSyncingTo}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isFirebaseSyncingTo ? 'animate-bounce' : ''}`} />
                  <span>{isFirebaseSyncingTo ? 'Envoi...' : 'Pousser vers Firebase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncFromFirebase}
                  disabled={isFirebaseSyncingFrom}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
                >
                  <CloudDownload className={`w-3.5 h-3.5 text-emerald-600 ${isFirebaseSyncingFrom ? 'animate-bounce' : ''}`} />
                  <span>{isFirebaseSyncingFrom ? 'Récupération...' : 'Récupérer depuis Firebase'}</span>
                </button>
              </div>
            </div>

            {/* 1. Carte de Diagnostic & État Live de Supabase */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Base de Données Cloud &bull; Supabase (PostgreSQL)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synchronisation temps réel et centralisation des données de restauration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={fetchSyncStatus}
                    disabled={isLoadingSyncStatus}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Actualiser le statut de synchronisation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingSyncStatus ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSyncStatus ? 'Diagnostic...' : 'Vérifier l’état'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSchemaModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Script SQL Supabase</span>
                  </button>
                </div>
              </div>

              {/* Live Status Card */}
              <div className={`p-5 rounded-2xl border mb-6 ${
                syncStatus?.isConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {syncStatus?.isConnected ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    )}
                    <div>
                      <span className="font-extrabold text-sm block">
                        {syncStatus?.isConnected
                          ? 'Synchronisation Supabase Cloud ACTIVE & OPÉRATIONNELLE'
                          : 'Mode Stockage LocalStorage (Hors-Ligne ou Supabase non joint)'}
                      </span>
                      <span className="text-xs opacity-80 block">
                        {syncStatus?.isConnected
                          ? `Projet Cloud connecté : ${syncStatus.url}`
                          : (syncStatus?.error || 'Les données sont sauvegardées dans votre navigateur.')}
                      </span>
                    </div>
                  </div>

                  {syncStatus?.lastSyncTime && (
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono opacity-70 block">Dernier contrôle</span>
                      <span className="text-xs font-bold font-mono">{syncStatus.lastSyncTime}</span>
                    </div>
                  )}
                </div>

                {/* Cloud data counters */}
                {syncStatus?.isConnected && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-200/60">
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">Menus Cloud</span>
                        <span className="text-xl font-black text-slate-900">{syncStatus.menusCount}</span>
                      </div>
                      <Utensils className="w-5 h-5 text-emerald-600 opacity-70" />
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">Usagers Whitelist</span>
                        <span className="text-xl font-black text-slate-900">{syncStatus.usersCount}</span>
                      </div>
                      <Users className="w-5 h-5 text-emerald-600 opacity-70" />
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">Réservations Cloud</span>
                        <span className="text-xl font-black text-slate-900">{syncStatus.reservationsCount}</span>
                      </div>
                      <Clock className="w-5 h-5 text-emerald-600 opacity-70" />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Centre de Contrôle de Synchronisation Manuelle */}
              <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl mb-6 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold tracking-tight">
                    Actions Immédiates de Synchronisation (One-Click Sync)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  En cas d’écart entre ce terminal et le serveur distant, utilisez ces commandes pour forcer une réplication complète.
                </p>

                {syncActionMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 mb-4 ${
                      syncActionMessage.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-700 text-rose-200'
                    }`}
                  >
                    {syncActionMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{syncActionMessage.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncingToSupabase || isSyncingFromSupabase}
                    className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-start gap-3 transition disabled:opacity-50 text-left border border-emerald-500/30"
                  >
                    <CloudUpload className={`w-5 h-5 mt-0.5 shrink-0 ${isSyncingToSupabase ? 'animate-bounce' : ''}`} />
                    <div>
                      <span className="block font-black">
                        {isSyncingToSupabase ? 'Synchronisation en cours...' : '1. Envoyer TOUT vers Supabase (Push Cloud)'}
                      </span>
                      <span className="text-[11px] text-emerald-100/80 font-normal block mt-0.5">
                        Exporte tous les menus, comptes usagers et réservations de ce navigateur vers Supabase.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncFromSupabase}
                    disabled={isSyncingToSupabase || isSyncingFromSupabase}
                    className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-start gap-3 transition disabled:opacity-50 text-left border border-slate-700"
                  >
                    <CloudDownload className={`w-5 h-5 mt-0.5 shrink-0 text-emerald-400 ${isSyncingFromSupabase ? 'animate-bounce' : ''}`} />
                    <div>
                      <span className="block font-black">
                        {isSyncingFromSupabase ? 'Importation en cours...' : '2. Importer TOUT depuis Supabase (Pull Cloud)'}
                      </span>
                      <span className="text-[11px] text-slate-300 font-normal block mt-0.5">
                        Récupère la totalité des données hébergées sur Supabase et met à jour ce navigateur.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Paramètres de Connexion Supabase */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Paramètres de Connexion au Projet Supabase
                </h4>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSupabaseBackend}
                      onChange={(e) => setUseSupabaseBackend(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        Activer le stockage distant Supabase Cloud
                      </span>
                      <span className="text-slate-500 text-xs block mt-0.5">
                        Permet la synchronisation partagée entre tous les appareils et tablettes du réfectoire.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      URL du projet Supabase (Project URL)
                    </label>
                    <input
                      type="url"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Clé publique anonyme (Anon / Public Key)
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="sb_publishable_... ou eyJhbGciOi..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                {supabaseTestResult && (
                  <div
                    className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                      supabaseTestResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {supabaseTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{supabaseTestResult.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer la configuration Supabase</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Test en cours...' : 'Tester la connexion'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Section 3: Réinitialisation données de démo */}
          {settingsSubTab === 'general' && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Réinitialisation des données de démonstration
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Rétablit le menu du chef, les réservations exemples et le mot de passe initial (<code className="font-mono">admin123</code>).
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition shrink-0"
            >
              Réinitialiser
            </button>
          </div>
          )}
        </div>
      )}

      {/* Modal pour le Script SQL Supabase */}
      <SupabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Modal pour la photo d'un plat */}
      <DishPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setPhotoModalDish(null);
        }}
        dish={photoModalDish}
        onSavePhoto={handleSaveDishPhoto}
      />

      {/* Modal pour la bannière / couverture du menu */}
      <DishPhotoModal
        isOpen={isMenuCoverModalOpen}
        onClose={() => setIsMenuCoverModalOpen(false)}
        isMenuCover={true}
        menuTitle={menuData.title}
        initialImageUrl={menuData.coverImageUrl}
        onSavePhoto={handleSaveDishPhoto}
      />

      {/* Modal Affiche QR Code Cantine (Comptoir) */}
      <CanteenCounterPosterModal
        isOpen={isCanteenPosterOpen}
        onClose={() => setIsCanteenPosterOpen(false)}
        settings={appSettings}
      />

      {/* Modal Nouvelle Réservation Manuelle (Petit-déj, Midi, Dîner) */}
      <AdminNewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        menu={menuData}
        todayDateStr={todayDateStr}
        authorizedUsers={authorizedUsersList}
        onReservationCreated={async (newRes) => {
          setReservations((prev) => [newRes, ...prev]);
          await onRefreshData();
        }}
      />
    </div>
  );
};
