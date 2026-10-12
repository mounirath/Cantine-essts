import React, { useState, useEffect } from 'react';
import { DailyMenu, TimeCheckResult, Reservation, AuthorizedUser } from '../types';
import {
  Utensils,
  Lock,
  Check,
  User,
  Briefcase,
  Clock,
  MessageSquare,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  Star,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  QrCode,
  Camera,
  XCircle,
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
  initialBadgeProp?: string;
  restrictToAuthorizedUsers?: boolean;
  onOpenRegistration?: () => void;
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

const DEPARTMENTS_AR: Record<string, string> = {
  'Ressources Humaines': 'الموارد البشرية',
  'Pôle Technique & Informatique': 'القطب التقني والإعلام الآلي',
  'Service Médical & Soins': 'المصلحة الطبية والتمريض',
  'Enseignement & Formation': 'التعليم والتدريب الرياضي',
  'Administration & Finances': 'الإدارة والمالية',
  'Logistique & Services Généraux': 'الوسائل العامة واللوجستيات',
  'Direction Générale': 'المديرية العامة',
  'Autre service': 'مصلحة أخرى',
};

const TIME_SLOTS = [
  '11h45 - 12h15',
  '12h15 - 12h45',
  '12h45 - 13h15',
  '13h15 - 13h45',
];

export const ReservationForm: React.FC<ReservationFormProps> = ({
  menu,
  timeStatus,
  capacityTotal,
  currentReservationsCount,
  onReservationComplete,
  todayDateStr,
  selectedPlatIdProp,
  initialBadgeProp,
  restrictToAuthorizedUsers = true,
  onOpenRegistration,
}) => {
  const { t, language } = useLanguage();
  const [staffName, setStaffName] = useState('');
  const [staffDepartment, setStaffDepartment] = useState(DEPARTMENTS[0]);
  const [staffEmail, setStaffEmail] = useState('');
  const [selectedEntreeId, setSelectedEntreeId] = useState(menu.entrees[0]?.id || '');
  const [selectedPlatId, setSelectedPlatId] = useState(
    selectedPlatIdProp || menu.featuredPlatId || menu.plats[0]?.id || ''
  );
  const [selectedDessertId, setSelectedDessertId] = useState(menu.desserts[0]?.id || '');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authorized users list for fast selection and autocomplete
  const [authorizedUsersList, setAuthorizedUsersList] = useState<AuthorizedUser[]>([]);
  const [verifiedUser, setVerifiedUser] = useState<AuthorizedUser | null>(null);

  // QR Badge Scanner state
  const [isBadgeScannerOpen, setIsBadgeScannerOpen] = useState(false);
  const [identifiedByQr, setIdentifiedByQr] = useState(false);

  // Apply matched user to form fields (instant zero-typing filling)
  const applyUserToForm = (user: AuthorizedUser, fromQr = true) => {
    setVerifiedUser(user);
    setStaffName(user.fullName);
    setStaffDepartment(user.department);
    if (user.email) setStaffEmail(user.email);
    if (user.dietaryNotes) setDietaryNotes(user.dietaryNotes);
    if (fromQr) setIdentifiedByQr(true);
    setErrorMessage(null);
  };

  useEffect(() => {
    // Load whitelist
    const loadWhitelist = async () => {
      try {
        const { dbService } = await import('../services/dbService');
        const list = await dbService.getAuthorizedUsers();
        const activeList = list.filter((u) => u.active);
        setAuthorizedUsersList(activeList);

        // Check if QR code opened this URL with query parameter (e.g. ?badge=AG-101)
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
            } else {
              // Pre-fill from URL parameters if provided
              const nameParam = params.get('name');
              const deptParam = params.get('dept');
              if (nameParam) setStaffName(nameParam);
              if (deptParam && DEPARTMENTS.includes(deptParam)) setStaffDepartment(deptParam);
            }
          }
        }
      } catch {}
    };
    loadWhitelist();
  }, [initialBadgeProp]);

  // Update plat if prop changes (e.g. user clicked "Choisir le Plat du Jour" in header)
  useEffect(() => {
    if (selectedPlatIdProp) {
      setSelectedPlatId(selectedPlatIdProp);
    }
  }, [selectedPlatIdProp]);

  // When staff name changes manually, verify if it matches an authorized agent
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
  };


  const placesRemaining = Math.max(0, capacityTotal - currentReservationsCount);
  const isFull = placesRemaining <= 0;
  const isBookingAllowed = timeStatus.isOpen && !isFull;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Business rule validation: strictly 08h00 - 10h00
    if (!timeStatus.isOpen) {
      setErrorMessage(t('outsideHoursError'));
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

    if (!selectedPlatId) {
      setErrorMessage(t('missingPlatError'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { dbService } = await import('../services/dbService');

      // VERIFICATION UTILISATEUR AUTORISÉ (WHITELIST)
      if (restrictToAuthorizedUsers) {
        const authCheck = await dbService.verifyUserAuthorized(staffName);
        if (!authCheck.authorized) {
          setErrorMessage(
            authCheck.message || t('unauthorizedUserError')
          );
          setIsSubmitting(false);
          return;
        }
      }

      const created = await dbService.createReservation({
        date: todayDateStr,
        staffName: staffName.trim(),
        staffDepartment,
        staffEmail: staffEmail.trim() || undefined,
        selectedEntreeId: selectedEntreeId || undefined,
        selectedPlatId,
        selectedDessertId: selectedDessertId || undefined,
        timeSlot,
        dietaryNotes: dietaryNotes.trim() || undefined,
      });

      // Launch celebration confetti
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

  const platDuJourId = menu.featuredPlatId || menu.plats.find((p) => p.isPlatDuJour)?.id;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            {t('formTitle')}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('formTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('formSubtitle')}
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
              <div className="font-bold">{t('unauthorizedUserError')}</div>
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

      {/* 1. Coordonnées de l'agent & Validation Whitelist */}
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

        {/* ==================================================== */}
        {/* BANNIÈRE RÉSERVATION EXPRESS PAR QR CODE BADGE */}
        {/* ==================================================== */}
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
                    ? 'Vos coordonnées ont été complétées automatiquement via votre QR Code. Choisissez vos plats ci-dessous pour finaliser votre réservation.'
                    : 'Vos coordonnées sont vérifiées sur la liste autorisée. Vous pouvez finaliser votre réservation ci-dessous.'}
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
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shrink-0"
            >
              Changer d'agent
            </button>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    {t('scanBadgeToBook')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    Sans Saisie
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t('scanBadgeSubtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBadgeScannerOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              <span>Scanner mon Badge</span>
            </button>
          </div>
        )}


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('fullNameOrBadgeLabel')} <span className="text-rose-500">*</span>
              </label>
              {verifiedUser && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('authorizedAgentBadge')} ({verifiedUser.badgeNumber})</span>
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('fullNameOrBadgePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('departmentLabel')} <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={staffDepartment}
              onChange={(e) => setStaffDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-medium bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {language === 'ar' ? DEPARTMENTS_AR[dept] || dept : dept}
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
              placeholder={t('emailPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. Composition du plateau */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-emerald-600" />
          <span>{t('stepMenuSelection')}</span>
        </h4>

        {/* Choix de l'entrée */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-2">
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
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
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

        {/* Choix du plat chaud (AVEC MISE EN VALEUR DU PLAT DU JOUR) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700">
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
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
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
                        {plat.isVegetarian ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {t('vegetarianBadge')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500">
                            {plat.calories ? `~${plat.calories} ${t('caloriesLabel')}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Choix du dessert */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-2">
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
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
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
      </div>

      {/* 3. Créneau et remarques */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('timeSlotLabel')} :</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                    timeSlot === slot
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('dietaryNotesLabel')} :</span>
            </label>
            <input
              type="text"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder={t('dietaryNotesPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* SOUMISSION DU FORMULAIRE */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        {!timeStatus.isOpen && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-extrabold text-amber-950">
                {t('outsideHoursError')}
              </p>
              <p className="mt-1 text-amber-800">
                {t('bannerPendingSubtitle', { start: timeStatus.startTime, end: timeStatus.endTime })}
              </p>
            </div>
          </div>
        )}

        {isFull && timeStatus.isOpen && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-extrabold text-rose-950">{t('capacityFullError')}</p>
              <p className="mt-1 text-rose-800">
                {t('placesTotal', { total: capacityTotal })}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('presentAtCounterNotice')}</span>
          </div>

          <button
            type="submit"
            disabled={!isBookingAllowed || isSubmitting}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md ${
              isBookingAllowed && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 cursor-pointer hover:scale-[1.01]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50'
            }`}
          >
            {!timeStatus.isOpen ? (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>{t('bookingsClosed')} ({timeStatus.startTime} - {timeStatus.endTime})</span>
              </>
            ) : isFull ? (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>{t('capacityFullError')} ({capacityTotal}/{capacityTotal})</span>
              </>
            ) : isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('submittingBtn')}</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>{t('submitBookingBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Scanner de badge agent pour réservation 100% sans saisie */}
      <UserBadgeScannerModal
        isOpen={isBadgeScannerOpen}
        onClose={() => setIsBadgeScannerOpen(false)}
        onUserIdentified={(user) => applyUserToForm(user, true)}
        authorizedUsers={authorizedUsersList}
      />
    </form>
  );
};
