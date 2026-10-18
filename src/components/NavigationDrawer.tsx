import React, { useEffect, useRef } from 'react';
import {
  Utensils,
  Ticket,
  ScanLine,
  QrCode,
  ShieldCheck,
  X,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChefHat,
  ChevronRight,
  Info,
  UserPlus,
  Camera,
  History,
  FileSpreadsheet,
  Sun,
  Moon,
  LayoutGrid,
} from 'lucide-react';
import { AppSettings, TimeCheckResult, MealType } from '../types';
import { AppLogo } from './AppLogo';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import { getAllMealSchedules } from '../utils/timeUtils';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  settings: AppSettings;
  timeStatus: TimeCheckResult;
  activeTab: 'staff' | 'ticket' | 'history' | 'admin';
  setActiveTab: (tab: 'staff' | 'ticket' | 'history' | 'admin') => void;
  onOpenQR: () => void;
  onOpenScanner: () => void;
  hasActiveTicket: boolean;
  todayDateStr: string;
  historyCount?: number;
  onOpenSimulator?: () => void;
  onOpenRegistration?: () => void;
  onOpenUserCanteenScanner?: () => void;
  onOpenCanteenPoster?: () => void;
  onExportWeeklyCSV?: () => void;
  categoryPage?: MealType | 'all';
  onSelectCategoryPage?: (page: MealType | 'all') => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  triggerRef,
  settings,
  timeStatus,
  activeTab,
  setActiveTab,
  onOpenQR,
  onOpenScanner,
  hasActiveTicket,
  todayDateStr,
  historyCount = 0,
  onOpenSimulator,
  onOpenRegistration,
  onOpenUserCanteenScanner,
  onOpenCanteenPoster,
  onExportWeeklyCSV,
  categoryPage = 'lunch',
  onSelectCategoryPage,
}) => {
  const { t, formatDate, isRTL, language } = useLanguage();
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const now = new Date();
  const mealSchedules = getAllMealSchedules(now, settings);

  // 1. Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. Close on Escape and return focus to trigger button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 3. Focus management when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Focus the close button or first interactive element inside drawer
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    // Return focus to the trigger button
    triggerRef.current?.focus();
  };

  const handleNavClick = (tab: 'staff' | 'ticket' | 'history' | 'admin') => {
    setActiveTab(tab);
    handleClose();
  };

  const handleActionClick = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <>
      {/* Scrim / Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Off-canvas Navigation Drawer Panel sliding in from the left (shadcn Sheet side="left") */}
      <nav
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="navigation"
        aria-label="Navigation principale"
        aria-hidden={!isOpen}
        tabIndex={-1}
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-96 max-w-[88vw] bg-white text-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <AppLogo settings={settings} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  {settings.establishmentName?.includes('ESSTS') ? (
                    language === 'ar' ? 'ESSTS المطعم' : 'ESSTS Cantine'
                  ) : (
                    'MensaStaff'
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {t('staffCatering')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                {language === 'ar' && settings.establishmentName?.includes('ESSTS')
                  ? 'المدرسة العليا لعلوم الرياضة وتكنولوجياتها'
                  : settings.establishmentName}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card inside drawer */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="capitalize">{formatDate(todayDateStr)}</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {settings.serviceHours}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              timeStatus.isOpen
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {timeStatus.isOpen ? t('bookingsOpen') : t('bookingsClosed')}
              </span>
            </div>
            <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white rounded border border-current/20">
              {timeStatus.startTime} - {timeStatus.endTime}
            </span>
          </div>
        </div>

        {/* Drawer Body / Nav items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation Links */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              Navigation
            </span>

            {/* Section Pages par Service */}
            <div className="space-y-1 mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
                Pages par Catégorie de Repas
              </span>

              {/* 1. Page Petit-déjeuner */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategoryPage?.('breakfast');
                  setActiveTab('staff');
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left rtl:text-right cursor-pointer ${
                  activeTab === 'staff' && categoryPage === 'breakfast'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-amber-50/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🥐</span>
                  <div>
                    <span className="block font-bold">1. Petit-déjeuner du Matin</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      Résa : {mealSchedules?.breakfast.bookingStart} - {mealSchedules?.breakfast.bookingEnd}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  mealSchedules?.breakfast.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {mealSchedules?.breakfast.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                </span>
              </button>

              {/* 2. Page Déjeuner */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategoryPage?.('lunch');
                  setActiveTab('staff');
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left rtl:text-right cursor-pointer ${
                  activeTab === 'staff' && categoryPage === 'lunch'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-emerald-50/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🍽️</span>
                  <div>
                    <span className="block font-bold">2. Menu du Déjeuner (Midi)</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      Résa : {mealSchedules?.lunch.bookingStart} - {mealSchedules?.lunch.bookingEnd}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  mealSchedules?.lunch.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {mealSchedules?.lunch.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                </span>
              </button>

              {/* 3. Page Dîner */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategoryPage?.('dinner');
                  setActiveTab('staff');
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left rtl:text-right cursor-pointer ${
                  activeTab === 'staff' && categoryPage === 'dinner'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-indigo-50/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🌙</span>
                  <div>
                    <span className="block font-bold">3. Menu du Soir (Dîner)</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      Résa : {mealSchedules?.dinner.bookingStart} - {mealSchedules?.dinner.bookingEnd}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  mealSchedules?.dinner.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {mealSchedules?.dinner.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
                </span>
              </button>

              {/* 4. Vue Complète */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategoryPage?.('all');
                  setActiveTab('staff');
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left rtl:text-right cursor-pointer ${
                  activeTab === 'staff' && categoryPage === 'all'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="block font-bold">4. Vue Complète (Tous les repas)</span>
                    <span className="text-[10px] opacity-75">
                      3 services séparés sur la même page
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            </div>

            {hasActiveTicket && (
              <button
                type="button"
                onClick={() => handleNavClick('ticket')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition text-left rtl:text-right ${
                  activeTab === 'ticket'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 bg-amber-50/60 border border-amber-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="block">{t('myTicket')}</span>
                    <span className="text-[11px] text-amber-700 font-normal">
                      Ticket actif pour aujourd'hui
                    </span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </button>
            )}

            {/* Historique des réservations (Local Storage) */}
            <button
              type="button"
              onClick={() => handleNavClick('history')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition text-left rtl:text-right ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className={`w-5 h-5 ${activeTab === 'history' ? 'text-white' : 'text-emerald-600'}`} />
                <div>
                  <span className="block">{t('history')}</span>
                  <span className={`text-[11px] font-normal ${activeTab === 'history' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Anciens tickets &amp; consommations
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {historyCount > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    activeTab === 'history' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {historyCount}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 rtl:rotate-180 opacity-60 ${activeTab === 'history' ? 'text-white' : 'text-slate-400'}`} />
              </div>
            </button>

            {onOpenRegistration && (
              <button
                type="button"
                onClick={() => handleActionClick(onOpenRegistration)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 transition text-left rtl:text-right"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block">{t('registrationModalTitle')}</span>
                    <span className="text-[11px] text-emerald-700 font-normal">
                      Demander l'accès & approbation
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-emerald-600" />
              </button>
            )}

            {onOpenUserCanteenScanner && (
              <button
                type="button"
                onClick={() => handleActionClick(onOpenUserCanteenScanner)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition text-left rtl:text-right shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block">Valider la prise de repas</span>
                    <span className="text-[11px] text-emerald-700 font-normal">
                      Scanner le QR Code affiché au comptoir cantine
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-emerald-600" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleActionClick(onOpenScanner)}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition text-left rtl:text-right"
            >
              <div className="flex items-center gap-3">
                <ScanLine className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="block">{t('scanMeal')}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Contrôle au réfectoire (Caméra)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 rtl:rotate-180 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleActionClick(onOpenQR)}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition text-left rtl:text-right"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-slate-600" />
                <div>
                  <span className="block">{t('qrAccess')}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Affiche pour affichage cantine
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 rtl:rotate-180 text-slate-400" />
            </button>

            {onOpenCanteenPoster && (
              <button
                type="button"
                onClick={() => handleActionClick(onOpenCanteenPoster)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-emerald-950 bg-gradient-to-r from-emerald-50 to-teal-50 hover:bg-emerald-100 border border-emerald-300 transition text-left rtl:text-right shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="block font-black">QR Code Comptoir Cantine</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.2 rounded-full">
                        Télécharger
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      Affiche &amp; QR Code affiché sur le comptoir
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-emerald-700" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition text-left rtl:text-right ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="block">{t('admin')}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Gestion des menus, émargement, réglages
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 rtl:rotate-180 text-slate-400" />
            </button>

            {onExportWeeklyCSV && (
              <button
                type="button"
                onClick={() => handleActionClick(onExportWeeklyCSV)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-emerald-950 bg-gradient-to-r from-emerald-50 to-teal-50 hover:bg-emerald-100 border border-emerald-300 transition text-left rtl:text-right shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="block font-black">Exporter CSV Semaine</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.2 rounded-full">
                        Excel
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      Réservations de la semaine écoulée
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 text-emerald-700" />
              </button>
            )}
          </div>

          {/* Preferences Section: Language & Testing */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
              Options & Langue
            </span>

            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                {t('languageName')}
              </span>
              <LanguageSelector variant="compact" />
            </div>

            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => handleActionClick(onOpenSimulator)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tester la règle 08:00 - 10:00 (Simulateur)</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            {settings.establishmentName}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Système officiel de réservation &bull; 08:00 - 10:00
          </p>
        </div>
      </nav>
    </>
  );
};
