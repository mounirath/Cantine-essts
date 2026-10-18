import React, { useState, useEffect, useMemo } from 'react';
import { DailyMenu, TimeCheckResult, Reservation, AuthorizedUser, MealType, MEAL_TYPES_CONFIG, AppSettings } from '../types';
import { getAllMealSchedules } from '../utils/timeUtils';
import {
  Utensils,
  Check,
  User,
  Briefcase,
  Clock,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  Star,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  QrCode,
  Camera,
  Sun,
  Moon,
  Coffee,
  CheckCheck,
  Layers,
  ChevronRight,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../i18n/LanguageContext';
import { UserBadgeScannerModal } from './UserBadgeScannerModal';

interface ReservationFormProps {
  menu: DailyMenu;
  timeStatus: TimeCheckResult;
  capacityTotal: number;
  currentReservationsCount: number;
  onReservationComplete: (reservation: Reservation) => void;
  todayDateStr: string;
  selectedPlatIdProp?: string;
  selectedMealTypeProp?: MealType;
  initialBadgeProp?: string;
  restrictToAuthorizedUsers?: boolean;
  enableQrExpressBooking?: boolean;
  settings?: AppSettings;
  effectiveTime?: Date;
  onOpenRegistration?: () => void;
  onSetSimulation?: (time: Date | null) => void;
}

const DEPARTMENTS = [
  'Ressources Humaines',
  'Pôle Technique & Informatique',
  'Service Médical & Soins',
  'Enseignement & Formation',
  'Administration & Finances',
  'Logistique & Services Généraux',
  'Direction Générale',
  'Autre service',
];

const BREAKFAST_TIME_SLOTS = [
  '07h00 - 07h30',
  '07h30 - 08h00',
  '08h00 - 08h30',
  '08h30 - 09h00',
];

const LUNCH_TIME_SLOTS = [
  '11h45 - 12h15',
  '12h15 - 12h45',
  '12h45 - 13h15',
  '13h15 - 13h45',
];

const DINNER_TIME_SLOTS = [
  '19h00 - 19h30',
  '19h30 - 20h00',
  '20h00 - 20h30',
  '20h30 - 21h00',
];

export const ReservationForm: React.FC<ReservationFormProps> = ({
  menu,
  timeStatus,
  capacityTotal,
  currentReservationsCount,
  onReservationComplete,
  todayDateStr,
  selectedPlatIdProp,
  selectedMealTypeProp = 'lunch',
  initialBadgeProp,
  restrictToAuthorizedUsers = true,
  enableQrExpressBooking = true,
  settings,
  effectiveTime,
  onOpenRegistration,
  onSetSimulation,
}) => {
  const { t } = useLanguage();

  // Mode de réservation : repas unique ou pack journée complète (3 repas)
  const [bookingMode, setBookingMode] = useState<'single' | 'all-day'>('single');
  const [activeMealType, setActiveMealType] = useState<MealType>(selectedMealTypeProp);

  // Horaires début et fin configurés pour chacun des 3 repas
  const now = effectiveTime || new Date();
  const mealSchedules = useMemo(() => {
    return getAllMealSchedules(now, settings || {});
  }, [now, settings]);

  const activeMealSchedule = mealSchedules[activeMealType];
  const activeMealIsOpen = activeMealSchedule.timeStatus.isOpen;

  // Coordonnées agent
  const [staffName, setStaffName] = useState('');
  const [staffDepartment, setStaffDepartment] = useState(DEPARTMENTS[0]);
  const [staffEmail, setStaffEmail] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');

  // 1. Choix pour Repas de Midi (Lunch)
  const [selectedEntreeId, setSelectedEntreeId] = useState(menu.entrees[0]?.id || '');
  const [selectedPlatId, setSelectedPlatId] = useState(
    selectedPlatIdProp || menu.featuredPlatId || menu.plats[0]?.id || ''
  );
  const [selectedDessertId, setSelectedDessertId] = useState(menu.desserts[0]?.id || '');
  const [lunchTimeSlot, setLunchTimeSlot] = useState(LUNCH_TIME_SLOTS[1]);

  // 2. Choix pour Petit-déjeuner (Breakfast)
  const defaultBreakfastId = (menu.breakfastItems && menu.breakfastItems[0]?.id) || 'bf-1';
  const [selectedBreakfastId, setSelectedBreakfastId] = useState(defaultBreakfastId);
  const [breakfastTimeSlot, setBreakfastTimeSlot] = useState(BREAKFAST_TIME_SLOTS[1]);

  // 3. Choix pour Dîner (Dinner)
  const defaultDinnerPlatId = (menu.dinnerPlats && menu.dinnerPlats[0]?.id) || menu.plats[0]?.id || 'din-plat-1';
  const defaultDinnerEntreeId = (menu.dinnerEntrees && menu.dinnerEntrees[0]?.id) || '';
  const defaultDinnerDessertId = (menu.dinnerDesserts && menu.dinnerDesserts[0]?.id) || '';
  const [selectedDinnerEntreeId, setSelectedDinnerEntreeId] = useState(defaultDinnerEntreeId);
  const [selectedDinnerPlatId, setSelectedDinnerPlatId] = useState(defaultDinnerPlatId);
  const [selectedDinnerDessertId, setSelectedDinnerDessertId] = useState(defaultDinnerDessertId);
  const [dinnerTimeSlot, setDinnerTimeSlot] = useState(DINNER_TIME_SLOTS[1]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Whitelist & Réservations existantes pour cet agent aujourd'hui
  const [authorizedUsersList, setAuthorizedUsersList] = useState<AuthorizedUser[]>([]);
  const [verifiedUser, setVerifiedUser] = useState<AuthorizedUser | null>(null);
  const [existingUserBookings, setExistingUserBookings] = useState<Reservation[]>([]);

  // QR Badge Scanner state
  const [isBadgeScannerOpen, setIsBadgeScannerOpen] = useState(false);
  const [identifiedByQr, setIdentifiedByQr] = useState(false);

  // Charger les réservations déjà enregistrées pour le nom sélectionné
  const checkExistingBookings = async (name: string) => {
    if (!name.trim()) {
      setExistingUserBookings([]);
      return;
    }
    try {
      const { dbService } = await import('../services/dbService');
      const todayReservations = await dbService.getReservations(todayDateStr);
      const clean = name.trim().toLowerCase();
      const matched = todayReservations.filter(
        (r) => r.status !== 'cancelled' && r.staffName.trim().toLowerCase() === clean
      );
      setExistingUserBookings(matched);
    } catch {
      setExistingUserBookings([]);
    }
  };

  // Remplissage instantané depuis QR Badge ou Whitelist
  const applyUserToForm = (user: AuthorizedUser, fromQr = true, targetMeal?: MealType) => {
    setVerifiedUser(user);
    setStaffName(user.fullName);
    setStaffDepartment(user.department);
    if (user.email) setStaffEmail(user.email);
    if (user.dietaryNotes) setDietaryNotes(user.dietaryNotes);
    if (fromQr) setIdentifiedByQr(true);
    if (targetMeal) {
      setActiveMealType(targetMeal);
    }
    setErrorMessage(null);
    checkExistingBookings(user.fullName);
  };

  useEffect(() => {
    const loadWhitelist = async () => {
      try {
        const { dbService } = await import('../services/dbService');
        const list = await dbService.getAuthorizedUsers();
        const activeList = list.filter((u) => u.active);
        setAuthorizedUsersList(activeList);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const targetBadge =
            initialBadgeProp ||
            params.get('badge') ||
            params.get('userBadge') ||
            params.get('matricule');

          if (targetBadge) {
            const cleanTarget = targetBadge.trim().toLowerCase();
            const matched = activeList.find(
              (u) =>
                u.badgeNumber.trim().toLowerCase() === cleanTarget ||
                u.fullName.toLowerCase() === cleanTarget
            );
            if (matched) {
              applyUserToForm(matched, true);
            }
          }
        }
      } catch {}
    };
    loadWhitelist();
  }, [initialBadgeProp]);

  // Si un plat ou un type de repas est passé en prop
  useEffect(() => {
    if (selectedPlatIdProp) {
      if (selectedMealTypeProp === 'breakfast') {
        setSelectedBreakfastId(selectedPlatIdProp);
        setActiveMealType('breakfast');
      } else if (selectedMealTypeProp === 'dinner') {
        setSelectedDinnerPlatId(selectedPlatIdProp);
        setActiveMealType('dinner');
      } else {
        setSelectedPlatId(selectedPlatIdProp);
        setActiveMealType('lunch');
      }
    }
  }, [selectedPlatIdProp, selectedMealTypeProp]);

  const handleNameChange = (val: string) => {
    setStaffName(val);
    setIdentifiedByQr(false);
    const clean = val.trim().toLowerCase();
    const match = authorizedUsersList.find(
      (u) =>
        u.fullName.toLowerCase() === clean ||
        u.badgeNumber.toLowerCase() === clean ||
        (u.lastName && u.lastName.toLowerCase() === clean) ||
        (u.firstName && u.firstName.toLowerCase() === clean)
    );
    if (match) {
      setVerifiedUser(match);
      setStaffDepartment(match.department);
      if (match.email && !staffEmail) setStaffEmail(match.email);
      if (match.dietaryNotes && !dietaryNotes) setDietaryNotes(match.dietaryNotes);
    } else {
      setVerifiedUser(null);
    }
    checkExistingBookings(val);
  };

  const placesRemaining = Math.max(0, capacityTotal - currentReservationsCount);
  const isFull = placesRemaining <= 0;

  // Repas déjà réservés par l'agent
  const alreadyBookedMeals = useMemo(() => {
    return {
      breakfast: existingUserBookings.find((r) => r.mealType === 'breakfast'),
      lunch: existingUserBookings.find((r) => (r.mealType || 'lunch') === 'lunch'),
      dinner: existingUserBookings.find((r) => r.mealType === 'dinner'),
    };
  }, [existingUserBookings]);

  // Items du menu
  const breakfastItems = menu.breakfastItems && menu.breakfastItems.length > 0 ? menu.breakfastItems : [
    {
      id: 'bf-1',
      category: 'plat' as const,
      name: 'Formule Complète Énergie (Sportif & Cadre)',
      description: 'Œufs brouillés aux fines herbes, pain grillé, beurre AOP, yaourt grec, boisson chaude et pur jus pressé.',
      allergens: ['Œufs', 'Lait', 'Gluten'],
      isVegetarian: true,
      calories: 460,
    },
    {
      id: 'bf-2',
      category: 'plat' as const,
      name: 'Formule Traditionnelle Continentale',
      description: 'Croissant pur beurre & pain au chocolat dorés, demi-baguette croustillante, confitures artisanales, café ou thé.',
      allergens: ['Gluten', 'Lait'],
      isVegetarian: true,
      calories: 380,
    },
    {
      id: 'bf-3',
      category: 'plat' as const,
      name: 'Formule Légère & Vitamines Bio',
      description: 'Fromage blanc fermier, graines de chia et flocons d’avoine, fruits frais de saison, thé vert et pain de seigle toasté.',
      allergens: ['Lait', 'Gluten'],
      isVegetarian: true,
      calories: 290,
    },
  ];

  const dinnerEntrees = menu.dinnerEntrees && menu.dinnerEntrees.length > 0 ? menu.dinnerEntrees : menu.entrees;
  const dinnerPlats = menu.dinnerPlats && menu.dinnerPlats.length > 0 ? menu.dinnerPlats : menu.plats;
  const dinnerDesserts = menu.dinnerDesserts && menu.dinnerDesserts.length > 0 ? menu.dinnerDesserts : menu.desserts;

  const platDuJourId = menu.featuredPlatId || menu.plats.find((p) => p.isPlatDuJour)?.id;

  // SOUMISSION DU FORMULAIRE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (bookingMode === 'single' && !activeMealIsOpen) {
      setErrorMessage(
        activeMealSchedule.timeStatus.message ||
        `Les réservations pour le ${activeMealSchedule.label} sont actuellement closes (${activeMealSchedule.bookingStart} - ${activeMealSchedule.bookingEnd}).`
      );
      return;
    }

    if (bookingMode === 'all-day' && !Object.values(mealSchedules).some((m) => m.timeStatus.isOpen)) {
      setErrorMessage('Toutes les réservations de repas sont actuellement closes pour la journée.');
      return;
    }

    if (isFull) {
      setErrorMessage(t('capacityFullError'));
      return;
    }

    if (!staffName.trim()) {
      setErrorMessage(t('missingNameError'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { dbService } = await import('../services/dbService');

      // Vérification Whitelist
      if (restrictToAuthorizedUsers) {
        const authCheck = await dbService.verifyUserAuthorized(staffName);
        if (!authCheck.authorized) {
          setErrorMessage(authCheck.message || t('unauthorizedUserError'));
          setIsSubmitting(false);
          return;
        }
      }

      // ====================================================
      // CAS A : FORMULE TOUTE LA JOURNÉE (3 REPAS)
      // ====================================================
      if (bookingMode === 'all-day') {
        const createdList: Reservation[] = [];
        const errorsList: string[] = [];

        // 1. Petit-déjeuner
        if (!alreadyBookedMeals.breakfast) {
          try {
            const bRes = await dbService.createReservation({
              date: todayDateStr,
              staffName: staffName.trim(),
              staffDepartment,
              staffEmail: staffEmail.trim() || undefined,
              mealType: 'breakfast',
              selectedPlatId: selectedBreakfastId || breakfastItems[0]?.id || 'bf-1',
              timeSlot: breakfastTimeSlot,
              dietaryNotes: dietaryNotes.trim() || undefined,
            });
            createdList.push(bRes);
          } catch (err: any) {
            errorsList.push(`Petit-déjeuner : ${err.message || 'Déjà réservé'}`);
          }
        }

        // 2. Repas de midi
        if (!alreadyBookedMeals.lunch) {
          try {
            const lRes = await dbService.createReservation({
              date: todayDateStr,
              staffName: staffName.trim(),
              staffDepartment,
              staffEmail: staffEmail.trim() || undefined,
              mealType: 'lunch',
              selectedEntreeId: selectedEntreeId || undefined,
              selectedPlatId: selectedPlatId || menu.plats[0]?.id,
              selectedDessertId: selectedDessertId || undefined,
              timeSlot: lunchTimeSlot,
              dietaryNotes: dietaryNotes.trim() || undefined,
            });
            createdList.push(lRes);
          } catch (err: any) {
            errorsList.push(`Midi : ${err.message || 'Déjà réservé'}`);
          }
        }

        // 3. Dîner
        if (!alreadyBookedMeals.dinner) {
          try {
            const dRes = await dbService.createReservation({
              date: todayDateStr,
              staffName: staffName.trim(),
              staffDepartment,
              staffEmail: staffEmail.trim() || undefined,
              mealType: 'dinner',
              selectedEntreeId: selectedDinnerEntreeId || undefined,
              selectedPlatId: selectedDinnerPlatId || dinnerPlats[0]?.id,
              selectedDessertId: selectedDinnerDessertId || undefined,
              timeSlot: dinnerTimeSlot,
              dietaryNotes: dietaryNotes.trim() || undefined,
            });
            createdList.push(dRes);
          } catch (err: any) {
            errorsList.push(`Dîner : ${err.message || 'Déjà réservé'}`);
          }
        }

        if (createdList.length > 0) {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#059669', '#f59e0b', '#6366f1', '#10b981'],
            });
          } catch {}

          // Retourne le premier ticket créé pour affichage
          onReservationComplete(createdList[0]);
        } else if (errorsList.length > 0) {
          setErrorMessage(errorsList.join(' | '));
        }

        return;
      }

      // ====================================================
      // CAS B : RÉSERVATION SIMPLE PAR REPAS CHOISI
      // ====================================================
      let created: Reservation;

      if (activeMealType === 'breakfast') {
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'breakfast',
          selectedPlatId: selectedBreakfastId || breakfastItems[0]?.id || 'bf-1',
          timeSlot: breakfastTimeSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      } else if (activeMealType === 'dinner') {
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'dinner',
          selectedEntreeId: selectedDinnerEntreeId || undefined,
          selectedPlatId: selectedDinnerPlatId || dinnerPlats[0]?.id,
          selectedDessertId: selectedDinnerDessertId || undefined,
          timeSlot: dinnerTimeSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      } else {
        // Repas de midi
        if (!selectedPlatId) {
          setErrorMessage(t('missingPlatError'));
          setIsSubmitting(false);
          return;
        }
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'lunch',
          selectedEntreeId: selectedEntreeId || undefined,
          selectedPlatId: selectedPlatId,
          selectedDessertId: selectedDessertId || undefined,
          timeSlot: lunchTimeSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}

      onReservationComplete(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('alreadyBookedError');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8"
    >
      {/* Header section with capacity gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            <span>Réservations de Repas &bull; Restauration Collective</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Réserver Petit-déjeuner, Repas de midi ou Dîner
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Choisissez votre service, composez vos plats et obtenez immédiatement votre ticket de retrait avec QR Code.
          </p>
        </div>

        {/* Capacity badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shrink-0 sm:text-right rtl:sm:text-left">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{t('remainingCapacity')}</div>
          <div className="flex items-center sm:justify-end rtl:sm:justify-start gap-2 mt-0.5">
            <span
              className={`text-lg font-black ${
                placesRemaining > 15
                  ? 'text-emerald-600'
                  : placesRemaining > 0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {placesRemaining} / {capacityTotal}
            </span>
            <span className="text-xs text-slate-500">{t('placesTotal', { total: capacityTotal })}</span>
          </div>
          <div className="w-36 sm:w-44 bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full transition-all duration-500 ${
                placesRemaining > 15
                  ? 'bg-emerald-500'
                  : placesRemaining > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, Math.round((currentReservationsCount / capacityTotal) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Information de réservation</div>
              <div className="text-xs sm:text-sm mt-0.5">{errorMessage}</div>
            </div>
          </div>
          {onOpenRegistration && (
            <button
              type="button"
              onClick={onOpenRegistration}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>S'enregistrer maintenant</span>
            </button>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. COORDONNÉES DE L'AGENT & VALIDATION WHITELIST */}
      {/* ==================================================== */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>{t('stepIdentity')}</span>
          </h4>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenRegistration && (
              <button
                type="button"
                onClick={onOpenRegistration}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nouvel agent ? S'inscrire</span>
              </button>
            )}

            {restrictToAuthorizedUsers && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('authorizedAgentBadge')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bannière Agent Identifié ou Scanner Badge */}
        {verifiedUser ? (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    Agent Identifié avec Succès
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {verifiedUser.badgeNumber}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Bienvenue, {verifiedUser.fullName} !
                </p>
                <p className="text-xs text-slate-600">
                  {identifiedByQr
                    ? 'Coordonnées auto-remplies via votre QR Code. Choisissez vos repas ci-dessous.'
                    : 'Coordonnées vérifiées sur le registre officiel. Prêt pour réservation.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVerifiedUser(null);
                setStaffName('');
                setStaffEmail('');
                setDietaryNotes('');
                setIdentifiedByQr(false);
                setExistingUserBookings([]);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shrink-0"
            >
              Changer d'agent
            </button>
          </div>
        ) : enableQrExpressBooking ? (
          <div
            className={`mb-5 p-4 sm:p-5 rounded-2xl border transition-all ${
              !activeMealIsOpen
                ? 'bg-slate-900 border-slate-800 text-slate-300 shadow-xs'
                : isFull
                ? 'bg-slate-900 border-slate-800 text-slate-300 shadow-xs'
                : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-800 shadow-sm'
            }`}
          >
            {/* Header du bloc Scanner express */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    !activeMealIsOpen || isFull
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-emerald-500 text-slate-950 font-bold'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        !activeMealIsOpen || isFull ? 'text-slate-400' : 'text-emerald-400'
                      }`}
                    >
                      Scanner mon Badge QR (Réservation express)
                    </span>
                    {!activeMealIsOpen ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Réservations Closes pour ce service</span>
                      </span>
                    ) : isFull ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        Capacité Atteinte
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        {activeMealSchedule.timeStatus.timeRemaining || 'Ouvert'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sélectionnez votre repas puis scannez votre badge ou QR code pour réserver sans saisie.
                  </p>
                </div>
              </div>

              {/* Bouton Scanner mon Badge */}
              <button
                type="button"
                disabled={!activeMealIsOpen || isFull}
                onClick={() => {
                  if (activeMealIsOpen && !isFull) {
                    setIsBadgeScannerOpen(true);
                  }
                }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shrink-0 ${
                  !activeMealIsOpen || isFull
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80 shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm cursor-pointer'
                }`}
                title={
                  !activeMealIsOpen
                    ? `Réservations closes pour ${activeMealSchedule.label} (${activeMealSchedule.bookingStart} - ${activeMealSchedule.bookingEnd})`
                    : isFull
                    ? 'Capacité maximale atteinte'
                    : `Scanner votre badge pour ${activeMealSchedule.label}`
                }
              >
                {!activeMealIsOpen ? (
                  <>
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Désactivé (Réservations Closes)</span>
                  </>
                ) : isFull ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Désactivé (Complet)</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Scanner mon Badge ({activeMealSchedule.shortLabel})</span>
                  </>
                )}
              </button>
            </div>

            {/* Sélecteur des 3 Repas & Horaires Début - Fin */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Services disponibles &bull; Horaires début &amp; fin de réservation :
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cliquez pour basculer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Petit-déjeuner */}
                <button
                  type="button"
                  onClick={() => setActiveMealType('breakfast')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeMealType === 'breakfast'
                      ? 'border-amber-400/80 bg-amber-500/15 text-white ring-2 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥐</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Petit-déj</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            mealSchedules.breakfast.timeStatus.isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mealSchedules.breakfast.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        Résa : {mealSchedules.breakfast.bookingStart} - {mealSchedules.breakfast.bookingEnd}
                      </span>
                    </div>
                  </div>
                  {alreadyBookedMeals.breakfast && (
                    <span className="text-[10px] text-amber-300 font-bold">✓ Réservé</span>
                  )}
                </button>

                {/* 2. Menu du Déjeuner */}
                <button
                  type="button"
                  onClick={() => setActiveMealType('lunch')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeMealType === 'lunch'
                      ? 'border-emerald-400/80 bg-emerald-500/15 text-white ring-2 ring-emerald-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍽️</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Déjeuner (Midi)</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            mealSchedules.lunch.timeStatus.isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mealSchedules.lunch.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        Résa : {mealSchedules.lunch.bookingStart} - {mealSchedules.lunch.bookingEnd}
                      </span>
                    </div>
                  </div>
                  {alreadyBookedMeals.lunch && (
                    <span className="text-[10px] text-emerald-300 font-bold">✓ Réservé</span>
                  )}
                </button>

                {/* 3. Menu du Soir (Dîner) */}
                <button
                  type="button"
                  onClick={() => setActiveMealType('dinner')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeMealType === 'dinner'
                      ? 'border-indigo-400/80 bg-indigo-500/15 text-white ring-2 ring-indigo-400/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Dîner (Soir)</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            mealSchedules.dinner.timeStatus.isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mealSchedules.dinner.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        Résa : {mealSchedules.dinner.bookingStart} - {mealSchedules.dinner.bookingEnd}
                      </span>
                    </div>
                  </div>
                  {alreadyBookedMeals.dinner && (
                    <span className="text-[10px] text-indigo-300 font-bold">✓ Réservé</span>
                  )}
                </button>
              </div>

              {/* Message descriptif et simulation si fermé */}
              {!activeMealIsOpen && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                  <p>
                    <span className="font-bold text-rose-300">RÉSERVATIONS CLOSES POUR CE REPAS : </span>
                    Le {activeMealSchedule.label} est réservable uniquement entre{' '}
                    <strong className="text-white font-mono">{activeMealSchedule.bookingStart}</strong> et{' '}
                    <strong className="text-white font-mono">{activeMealSchedule.bookingEnd}</strong>. Le bouton « Scanner mon Badge » reste désactivé pour ce service jusqu'à la prochaine ouverture.
                  </p>
                  {onSetSimulation && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Tester par simulation :
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setHours(7, 30, 0, 0);
                          onSetSimulation(d);
                          setActiveMealType('breakfast');
                        }}
                        className="px-2 py-0.5 rounded bg-amber-900/40 hover:bg-amber-900/60 border border-amber-600/50 text-[11px] text-amber-200 transition font-medium"
                      >
                        07h30 (Petit-déj)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setHours(8, 45, 0, 0);
                          onSetSimulation(d);
                          setActiveMealType('lunch');
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-600/50 text-[11px] text-emerald-200 transition font-medium"
                      >
                        08h45 (Déjeuner)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setHours(15, 30, 0, 0);
                          onSetSimulation(d);
                          setActiveMealType('dinner');
                        }}
                        className="px-2 py-0.5 rounded bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-600/50 text-[11px] text-indigo-200 transition font-medium"
                      >
                        15h30 (Dîner)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* RÉSERVATIONS DÉJÀ EFFECTUÉES PAR CET AGENT AUJOURD'HUI */}
        {existingUserBookings.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                Vos réservations enregistrées pour aujourd'hui ({existingUserBookings.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {alreadyBookedMeals.breakfast && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 border border-amber-300 font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🥐 Petit-déjeuner réservé</span>
                  <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.5 rounded">
                    {alreadyBookedMeals.breakfast.ticketCode}
                  </span>
                </span>
              )}
              {alreadyBookedMeals.lunch && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 font-bold text-emerald-900 flex items-center gap-1.5">
                  <span>🍽️ Repas de midi réservé</span>
                  <span className="font-mono text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">
                    {alreadyBookedMeals.lunch.ticketCode}
                  </span>
                </span>
              )}
              {alreadyBookedMeals.dinner && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100/80 border border-indigo-300 font-bold text-indigo-900 flex items-center gap-1.5">
                  <span>🌙 Dîner du soir réservé</span>
                  <span className="font-mono text-[10px] bg-indigo-200 px-1.5 py-0.5 rounded">
                    {alreadyBookedMeals.dinner.ticketCode}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-800">
              💡 Vous pouvez cumuler vos réservations pour les autres services de la journée (ex: ajouter le petit-déjeuner ou le dîner).
            </p>
          </div>
        )}

        {/* Inputs agent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('fullNameOrBadgeLabel')} <span className="text-rose-500">*</span>
              </label>
              {verifiedUser && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Validé</span>
                </span>
              )}
            </div>

            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Claire Bernard ou AG-101"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition ${
                verifiedUser
                  ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                  : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('departmentLabel')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={staffDepartment}
              onChange={(e) => setStaffDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="agent@etablissement.fr"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300"
            />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. CHOIX DU SERVICE / TYPE DE REPAS */}
      {/* ==================================================== */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>2. Quel repas souhaitez-vous réserver ?</span>
          </h4>

          {/* Switcher Formule Simple vs Pack 3 Repas */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBookingMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                bookingMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repas par Repas
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('all-day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                bookingMode === 'all-day'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Pack 3 Repas (Journée)</span>
            </button>
          </div>
        </div>

        {bookingMode === 'single' ? (
          /* Sélecteur de repas en 3 tuiles */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Petit-déjeuner */}
            <button
              type="button"
              onClick={() => setActiveMealType('breakfast')}
              className={`p-4 rounded-2xl border text-left rtl:text-right transition relative flex flex-col justify-between cursor-pointer ${
                activeMealType === 'breakfast'
                  ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/30 text-amber-950 shadow-xs'
                  : 'border-slate-200 hover:border-amber-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mealSchedules.breakfast.timeStatus.isOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {mealSchedules.breakfast.timeStatus.isOpen ? '🟢 Ouvert' : '🔴 Clôturé'}
                  </span>
                  {activeMealType === 'breakfast' ? (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <span className="font-black text-sm block text-slate-900">
                  1. Petit-déjeuner du Matin
                </span>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-mono font-medium text-amber-900">
                    🕒 Résa : <strong>{mealSchedules.breakfast.bookingStart}</strong> - <strong>{mealSchedules.breakfast.bookingEnd}</strong>
                  </p>
                  <p className="text-slate-500">
                    🍽️ Service : {mealSchedules.breakfast.serviceHours}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Capacité max : {mealSchedules.breakfast.capacity} couverts
                  </p>
                </div>

                {alreadyBookedMeals.breakfast && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    ✓ Déjà réservé pour ce matin
                  </span>
                )}
              </div>
            </button>

            {/* 2. Repas de midi */}
            <button
              type="button"
              onClick={() => setActiveMealType('lunch')}
              className={`p-4 rounded-2xl border text-left rtl:text-right transition relative flex flex-col justify-between cursor-pointer ${
                activeMealType === 'lunch'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30 text-emerald-950 shadow-xs'
                  : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mealSchedules.lunch.timeStatus.isOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {mealSchedules.lunch.timeStatus.isOpen ? '🟢 Ouvert' : '🔴 Clôturé'}
                  </span>
                  {activeMealType === 'lunch' ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <span className="font-black text-sm block text-slate-900">
                  2. Menu du Déjeuner (Midi)
                </span>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-mono font-medium text-emerald-900">
                    🕒 Résa : <strong>{mealSchedules.lunch.bookingStart}</strong> - <strong>{mealSchedules.lunch.bookingEnd}</strong>
                  </p>
                  <p className="text-slate-500">
                    🍽️ Service : {mealSchedules.lunch.serviceHours}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Capacité max : {mealSchedules.lunch.capacity} couverts
                  </p>
                </div>

                {alreadyBookedMeals.lunch && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    ✓ Déjà réservé pour ce midi
                  </span>
                )}
              </div>
            </button>

            {/* 3. Dîner */}
            <button
              type="button"
              onClick={() => setActiveMealType('dinner')}
              className={`p-4 rounded-2xl border text-left rtl:text-right transition relative flex flex-col justify-between cursor-pointer ${
                activeMealType === 'dinner'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30 text-indigo-950 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  <Moon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      mealSchedules.dinner.timeStatus.isOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {mealSchedules.dinner.timeStatus.isOpen ? '🟢 Ouvert' : '🔴 Clôturé'}
                  </span>
                  {activeMealType === 'dinner' ? (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <span className="font-black text-sm block text-slate-900">
                  3. Menu du Soir (Dîner)
                </span>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-mono font-medium text-indigo-900">
                    🕒 Résa : <strong>{mealSchedules.dinner.bookingStart}</strong> - <strong>{mealSchedules.dinner.bookingEnd}</strong>
                  </p>
                  <p className="text-slate-500">
                    🍽️ Service : {mealSchedules.dinner.serviceHours}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Capacité max : {mealSchedules.dinner.capacity} couverts
                  </p>
                </div>

                {alreadyBookedMeals.dinner && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900">
                    ✓ Déjà réservé pour ce soir
                  </span>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-700">
              <strong className="block text-sm font-black text-slate-900">
                Mode « Pack Journée Complète (3 repas) » Activé
              </strong>
              Configurez vos choix pour le petit-déjeuner, le repas de midi et le dîner. Un simple clic créera vos 3 réservations.
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 3. COMPOSITION DES PLATS SELON LE REPAS CHOISI */}
      {/* ==================================================== */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        {/* A. SI MODE PETIT-DÉJEUNER SEUL */}
        {bookingMode === 'single' && activeMealType === 'breakfast' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>3. Choisissez votre Formule Petit-déjeuner :</span>
              </label>
              <span className="text-xs text-slate-500">Boisson chaude &amp; jus inclus</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {breakfastItems.map((item) => {
                const isSelected = selectedBreakfastId === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedBreakfastId(item.id)}
                    className={`p-4 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30 text-amber-950'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      {item.imageUrl && (
                        <div className="h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm">{item.name}</span>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      {item.calories ? `~${item.calories} kcal` : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Créneau horaire du petit-déjeuner */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Créneau de passage au réfectoire pour le petit-déjeuner :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BREAKFAST_TIME_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setBreakfastTimeSlot(slot)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      breakfastTimeSlot === slot
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* B. SI MODE REPAS DE MIDI SEUL */}
        {bookingMode === 'single' && activeMealType === 'lunch' && (
          <div className="space-y-6">
            {/* 1. Choix entrée */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                {t('chooseEntreeLabel')} :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {menu.entrees.map((entree) => {
                  const isSelected = selectedEntreeId === entree.id;
                  return (
                    <button
                      type="button"
                      key={entree.id}
                      onClick={() => setSelectedEntreeId(entree.id)}
                      className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/30 text-emerald-950'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {entree.imageUrl && (
                          <img
                            src={entree.imageUrl}
                            alt={entree.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm">{entree.name}</span>
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          {entree.isVegetarian && (
                            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                              &bull; {t('vegetarianBadge')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Choix plat chaud avec mise en valeur du plat du jour */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {t('chooseMainDishLabel')} :
                </label>
                <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{t('featuredDishBadge')}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {menu.plats.map((plat) => {
                  const isSelected = selectedPlatId === plat.id;
                  const isStarDish = plat.id === platDuJourId || plat.isPlatDuJour;

                  return (
                    <button
                      type="button"
                      key={plat.id}
                      onClick={() => setSelectedPlatId(plat.id)}
                      className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 text-emerald-950'
                          : isStarDish
                          ? 'border-amber-400/80 bg-amber-50/30 hover:border-amber-400 text-slate-800'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      {isStarDish && (
                        <div className="mb-2 inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md self-start">
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>{t('featuredDishBadge')}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        {plat.imageUrl && (
                          <img
                            src={plat.imageUrl}
                            alt={plat.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm leading-snug">{plat.name}</span>
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {plat.isVegetarian && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                🌱 Végétarien
                              </span>
                            )}
                            {plat.calories && (
                              <span className="text-[10px] text-slate-500">~{plat.calories} kcal</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Choix dessert */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                {t('chooseDessertLabel')} :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {menu.desserts.map((dessert) => {
                  const isSelected = selectedDessertId === dessert.id;
                  return (
                    <button
                      type="button"
                      key={dessert.id}
                      onClick={() => setSelectedDessertId(dessert.id)}
                      className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/30 text-emerald-950'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {dessert.imageUrl && (
                          <img
                            src={dessert.imageUrl}
                            alt={dessert.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm">{dessert.name}</span>
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Créneau horaire du midi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Créneau de passage au réfectoire pour le déjeuner :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LUNCH_TIME_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setLunchTimeSlot(slot)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      lunchTimeSlot === slot
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* C. SI MODE DÎNER (SOIR) SEUL */}
        {bookingMode === 'single' && activeMealType === 'dinner' && (
          <div className="space-y-6">
            {/* Entrées du soir */}
            {dinnerEntrees.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Entrée ou Potage léger du soir :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {dinnerEntrees.map((entree) => {
                    const isSelected = selectedDinnerEntreeId === entree.id;
                    return (
                      <button
                        type="button"
                        key={entree.id}
                        onClick={() => setSelectedDinnerEntreeId(entree.id)}
                        className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-950'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm">{entree.name}</span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Plats du soir */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Plat chaud du dîner :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {dinnerPlats.map((plat) => {
                  const isSelected = selectedDinnerPlatId === plat.id;
                  return (
                    <button
                      type="button"
                      key={plat.id}
                      onClick={() => setSelectedDinnerPlatId(plat.id)}
                      className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/30 text-indigo-950'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm">{plat.name}</span>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plat.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desserts du soir */}
            {dinnerDesserts.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Dessert ou Fruit du soir :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {dinnerDesserts.map((dessert) => {
                    const isSelected = selectedDinnerDessertId === dessert.id;
                    return (
                      <button
                        type="button"
                        key={dessert.id}
                        onClick={() => setSelectedDinnerDessertId(dessert.id)}
                        className={`p-3 rounded-2xl text-left rtl:text-right border transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-950'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm">{dessert.name}</span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Créneau horaire du soir */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Créneau de passage au réfectoire pour le dîner :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DINNER_TIME_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setDinnerTimeSlot(slot)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      dinnerTimeSlot === slot
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* D. SI MODE PACK 3 REPAS (TOUTE LA JOURNÉE) */}
        {bookingMode === 'all-day' && (
          <div className="space-y-6">
            {/* 1. Bloc Petit-déjeuner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-amber-950 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>1. Petit-déjeuner (07h00 - 09h00)</span>
                </span>
                {alreadyBookedMeals.breakfast && (
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Déjà réservé
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {breakfastItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    disabled={!!alreadyBookedMeals.breakfast}
                    onClick={() => setSelectedBreakfastId(item.id)}
                    className={`p-3 rounded-xl text-left border text-xs font-bold transition ${
                      selectedBreakfastId === item.id
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Bloc Déjeuner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-emerald-950 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>2. Déjeuner (Repas de midi : 11h45 - 13h45)</span>
                </span>
                {alreadyBookedMeals.lunch && (
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Déjà réservé
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {menu.plats.map((plat) => (
                  <button
                    type="button"
                    key={plat.id}
                    disabled={!!alreadyBookedMeals.lunch}
                    onClick={() => setSelectedPlatId(plat.id)}
                    className={`p-3 rounded-xl text-left border text-xs font-bold transition ${
                      selectedPlatId === plat.id
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {plat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Bloc Dîner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-indigo-950 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>3. Dîner (Repas du soir : 19h00 - 21h00)</span>
                </span>
                {alreadyBookedMeals.dinner && (
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                    Déjà réservé
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {dinnerPlats.map((plat) => (
                  <button
                    type="button"
                    key={plat.id}
                    disabled={!!alreadyBookedMeals.dinner}
                    onClick={() => setSelectedDinnerPlatId(plat.id)}
                    className={`p-3 rounded-xl text-left border text-xs font-bold transition ${
                      selectedDinnerPlatId === plat.id
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    {plat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 4. REMARQUES DIÉTÉTIQUES & VALIDATION */}
      {/* ==================================================== */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {t('dietaryNotesLabel')} (Optionnel)
        </label>
        <input
          type="text"
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          placeholder="Ex: Sans sel ajouté, allergies, intolérance au gluten..."
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300"
        />

        {/* Bouton de confirmation */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {bookingMode === 'all-day'
              ? '✨ Valide jusqu’à 3 réservations (Petit-déjeuner + Midi + Dîner) avec génération de tickets respectifs.'
              : `Génération immédiate d’un ticket avec QR Code pour votre ${
                  activeMealType === 'breakfast'
                    ? 'petit-déjeuner'
                    : activeMealType === 'dinner'
                    ? 'dîner'
                    : 'repas de midi'
                }.`}
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (bookingMode === 'single'
                ? !activeMealIsOpen
                : !Object.values(mealSchedules).some((m) => m.timeStatus.isOpen)) ||
              isFull
            }
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] ${
              (bookingMode === 'single'
                ? !activeMealIsOpen
                : !Object.values(mealSchedules).some((m) => m.timeStatus.isOpen)) || isFull
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : bookingMode === 'all-day'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-emerald-500/25'
                : activeMealType === 'breakfast'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                : activeMealType === 'dinner'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
            }`}
          >
            {bookingMode === 'single' && !activeMealIsOpen ? (
              <Lock className="w-4 h-4 text-slate-500" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Validation en cours...'
                : bookingMode === 'single' && !activeMealIsOpen
                ? `Réservations Closes (${activeMealSchedule.bookingStart} - ${activeMealSchedule.bookingEnd})`
                : bookingMode === 'all-day'
                ? 'Valider mes 3 Repas de la Journée'
                : activeMealType === 'breakfast'
                ? 'Valider mon Petit-déjeuner'
                : activeMealType === 'dinner'
                ? 'Valider mon Dîner'
                : 'Valider mon Repas de midi'}
            </span>
          </button>
        </div>
      </div>

      {/* Modal Scanner de badge */}
      {isBadgeScannerOpen && (
        <UserBadgeScannerModal
          isOpen={isBadgeScannerOpen}
          onClose={() => setIsBadgeScannerOpen(false)}
          onUserIdentified={(user: AuthorizedUser, targetMeal?: MealType) => {
            applyUserToForm(user, true, targetMeal || activeMealType);
            setIsBadgeScannerOpen(false);
          }}
          authorizedUsers={authorizedUsersList}
          timeStatus={timeStatus}
          settings={settings}
          selectedMealType={activeMealType}
          effectiveTime={effectiveTime}
        />
      )}
    </form>
  );
};
