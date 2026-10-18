import React, { useState, useRef } from 'react';
import { Utensils, QrCode, ShieldCheck, Ticket, Calendar, Clock, ScanLine, UserPlus, Camera, History, FileSpreadsheet } from 'lucide-react';
import { AppSettings, TimeCheckResult, MealType } from '../types';
import { AppLogo } from './AppLogo';
import { LanguageSelector } from './LanguageSelector';
import { NavigationDrawer } from './NavigationDrawer';
import { useLanguage } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';

interface NavbarProps {
  settings: AppSettings;
  timeStatus: TimeCheckResult;
  activeTab: 'staff' | 'ticket' | 'history' | 'admin';
  setActiveTab: (tab: 'staff' | 'ticket' | 'history' | 'admin') => void;
  onOpenQR: () => void;
  onOpenScanner: () => void;
  hasActiveTicket: boolean;
  todayDateStr: string;
  historyCount?: number;
  onOpenRegistration?: () => void;
  onOpenUserCanteenScanner?: () => void;
  onOpenCanteenPoster?: () => void;
  onExportWeeklyCSV?: () => void;
  categoryPage?: MealType | 'all';
  onSelectCategoryPage?: (page: MealType | 'all') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  timeStatus,
  activeTab,
  setActiveTab,
  onOpenQR,
  onOpenScanner,
  hasActiveTicket,
  todayDateStr,
  historyCount = 0,
  onOpenRegistration,
  onOpenUserCanteenScanner,
  onOpenCanteenPoster,
  onExportWeeklyCSV,
  categoryPage = 'lunch',
  onSelectCategoryPage,
}) => {
  const { t, formatDate, isRTL, language } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            {/* Hamburger button + Logo & Establishment info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-initial">
              {/* Hamburger Button: drawing three stacked lines */}
              <button
                ref={hamburgerButtonRef}
                type="button"
                aria-expanded={isDrawerOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={isDrawerOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs"
                title="Menu de navigation"
              >
                <span className="flex flex-col justify-center items-center w-5 h-5 gap-1.5" aria-hidden="true">
                  <span
                    className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-300 ease-in-out ${
                      isDrawerOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current rounded-full transition-opacity duration-200 ease-in-out ${
                      isDrawerOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-300 ease-in-out ${
                      isDrawerOpen ? '-rotate-45 -translate-y-2' : ''
                    }`}
                  />
                </span>
              </button>

              <div className="shrink-0">
                <AppLogo settings={settings} size="md" />
              </div>

              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base md:text-lg truncate">
                    {settings.establishmentName?.includes('ESSTS') ? (
                      language === 'ar' ? (
                        <>
                          ESSTS <span className="text-blue-600 font-bold text-xs sm:text-base">المطعم</span>
                        </>
                      ) : (
                        <>
                          ESSTS <span className="text-blue-600 font-bold text-xs sm:text-base">Cantine</span>
                        </>
                      )
                    ) : (
                      <>
                        Mensa<span className="text-emerald-600">Staff</span>
                      </>
                    )}
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md shrink-0">
                    {t('staffCatering')}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs font-medium">
                  {language === 'ar' && settings.establishmentName?.includes('ESSTS')
                    ? 'المدرسة العليا لعلوم الرياضة وتكنولوجياتها'
                    : settings.establishmentName}
                </p>
              </div>

              {/* Bouton Exporter CSV Semaine à côté du logo cantine étudiant */}
              {onExportWeeklyCSV && (
                <button
                  type="button"
                  onClick={onExportWeeklyCSV}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition shrink-0 border border-emerald-500/30 cursor-pointer"
                  title="Exporter les données de réservation de la semaine au format CSV (compatible Excel)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Exporter CSV Semaine</span>
                </button>
              )}
            </div>

            {/* Center Date & Status Pill (Desktop only) */}
            <div className="hidden lg:flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="capitalize">{formatDate(todayDateStr)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    timeStatus.isOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {timeStatus.isOpen
                      ? `${t('bookingsOpen')} (${t('bannerWindowLabel', { start: timeStatus.startTime, end: timeStatus.endTime })})`
                      : `${t('bookingsClosed')} (${timeStatus.startTime} - ${timeStatus.endTime})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation & actions: cleaned up to never overflow mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Responsive Language Switcher: compact on mobile, full pill on sm+ */}
              <LanguageSelector variant="responsive" />

              {/* Quick Ticket Pill (if user has active ticket) */}
              {hasActiveTicket && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveTab('ticket')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'ticket'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  }`}
                  title={t('myTicket')}
                >
                  <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="hidden xs:inline">{t('myTicket')}</span>
                </motion.button>
              )}

              {/* Desktop Only: Registration trigger */}
              {onOpenRegistration && (
                <button
                  onClick={onOpenRegistration}
                  className="hidden sm:flex px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                  title={t('registrationModalTitle')}
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{t('registerBtn')}</span>
                </button>
              )}

              {/* Desktop Category Page Switcher */}
              <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategoryPage?.('breakfast');
                    setActiveTab('staff');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'staff' && categoryPage === 'breakfast'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Page Petit-déjeuner du Matin"
                >
                  <span>🥐</span>
                  <span>Petit-déj</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCategoryPage?.('lunch');
                    setActiveTab('staff');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'staff' && categoryPage === 'lunch'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Page Menu du Déjeuner (Repas de midi)"
                >
                  <span>🍽️</span>
                  <span>Midi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCategoryPage?.('dinner');
                    setActiveTab('staff');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'staff' && categoryPage === 'dinner'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Page Menu du Soir (Dîner)"
                >
                  <span>🌙</span>
                  <span>Dîner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCategoryPage?.('all');
                    setActiveTab('staff');
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'staff' && categoryPage === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                  title="Tous les repas sur une seule vue"
                >
                  <span>Tous</span>
                </button>
              </div>

              {/* Desktop Only: Menu & Booking button (mobile uses hamburger drawer) */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveTab('staff')}
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition items-center gap-1.5 cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>{t('menuAndBooking')}</span>
              </motion.button>

              {/* Desktop Only: Historique des Réservations */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveTab('history')}
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={t('history')}
              >
                <History className="w-4 h-4" />
                <span>{t('historyShort')}</span>
                {historyCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'history' ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {historyCount}
                  </span>
                )}
              </motion.button>

              {/* Desktop Only: Meal Scanner Button for Serving Counter */}
              {onOpenUserCanteenScanner && (
                <button
                  onClick={onOpenUserCanteenScanner}
                  className="hidden sm:flex px-2 sm:px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs sm:text-sm items-center gap-1.5 shadow-xs"
                  title="Confirmer que vous avez pris votre repas en scannant le QR code affiché au comptoir cantine"
                >
                  <Camera className="w-4 h-4 text-emerald-200" />
                  <span>Scanner Cantine</span>
                </button>
              )}

              <button
                onClick={onOpenScanner}
                className="hidden lg:flex px-2 sm:px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 transition text-xs sm:text-sm font-bold items-center gap-1.5"
                title={t('scannerTitle')}
              >
                <ScanLine className="w-4 h-4 text-emerald-600" />
                <span>{t('scanMeal')}</span>
              </button>

              {/* Desktop Only: QR Code Poster trigger */}
              <button
                onClick={onOpenQR}
                className="hidden xl:flex p-2 sm:px-2.5 sm:py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-xs sm:text-sm font-medium items-center gap-1.5"
                title={t('posterTitle')}
              >
                <QrCode className="w-4 h-4 text-slate-600" />
                <span>{t('qrAccess')}</span>
              </button>

              {/* Desktop Only: QR Code Comptoir de la Cantine (Téléchargement / Impression) */}
              {onOpenCanteenPoster && (
                <button
                  onClick={onOpenCanteenPoster}
                  className="hidden xl:flex px-2 sm:px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 transition text-xs sm:text-sm font-bold items-center gap-1.5 shadow-2xs"
                  title="Télécharger ou imprimer le QR Code affiché sur le comptoir de la cantine"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QR Comptoir</span>
                </button>
              )}

              {/* Desktop Only: Admin button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveTab('admin')}
                className={`hidden md:flex px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t('admin')}</span>
              </motion.button>

              {/* Mobile Only: Active Admin Mode Indicator/Button */}
              {activeTab === 'admin' && (
                <button
                  onClick={() => setActiveTab('staff')}
                  className="md:hidden px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                  title="Mode Administration - Touchez pour revenir à la cantine"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Drawer triggered by Hamburger button */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        triggerRef={hamburgerButtonRef}
        settings={settings}
        timeStatus={timeStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQR={onOpenQR}
        onOpenScanner={onOpenScanner}
        hasActiveTicket={hasActiveTicket}
        todayDateStr={todayDateStr}
        historyCount={historyCount}
        onOpenRegistration={onOpenRegistration}
        onOpenUserCanteenScanner={onOpenUserCanteenScanner}
        onOpenCanteenPoster={onOpenCanteenPoster}
        onExportWeeklyCSV={onExportWeeklyCSV}
        categoryPage={categoryPage}
        onSelectCategoryPage={onSelectCategoryPage}
      />
    </>
  );
};
