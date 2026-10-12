/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { dbService, DEFAULT_ADMIN_PASSWORD_PLAIN } from './services/dbService';
import { DailyMenu, Reservation, AppSettings } from './types';
import {
  evaluateBookingWindow,
  getTodayDateString,
  formatFrenchDate,
} from './utils/timeUtils';
import { TimeSimulatorBar } from './components/TimeSimulatorBar';
import { Navbar } from './components/Navbar';
import { TimeWindowBanner } from './components/TimeWindowBanner';
import { MenuDisplay } from './components/MenuDisplay';
import { ReservationForm } from './components/ReservationForm';
import { ReservationTicketCard } from './components/ReservationTicketCard';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { QRCodePosterModal } from './components/QRCodePosterModal';
import { CanteenCounterPosterModal } from './components/CanteenCounterPosterModal';
import { MealScannerModal } from './components/MealScannerModal';
import { UserRegistrationModal } from './components/UserRegistrationModal';
import { UserCanteenScannerModal } from './components/UserCanteenScannerModal';
import { StaffReservationHistory } from './components/StaffReservationHistory';
import {
  getPersistedTicketHistory,
  persistTicket,
  updatePersistedTicketStatus,
  syncPersistedHistory,
  clearPersistedHistory,
} from './utils/ticketHistory';
import { AppLogo } from './components/AppLogo';
import { Utensils, Shield, QrCode, Clock, ScanLine, Ticket, UserPlus, Camera, History } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t, isRTL, language } = useLanguage();
  const [realTime, setRealTime] = useState<Date>(new Date());
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);

  const [todayDateStr, setTodayDateStr] = useState<string>(getTodayDateString());
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [selectedPlatIdForForm, setSelectedPlatIdForForm] = useState<string | undefined>(undefined);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [activeTab, setActiveTab] = useState<'staff' | 'ticket' | 'history' | 'admin'>('staff');
  const [activeTicket, setActiveTicket] = useState<Reservation | null>(null);
  const [historyTickets, setHistoryTickets] = useState<Reservation[]>(() => getPersistedTicketHistory());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isCanteenPosterOpen, setIsCanteenPosterOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isUserCanteenScannerOpen, setIsUserCanteenScannerOpen] = useState<boolean>(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [urlBadgeParam, setUrlBadgeParam] = useState<string | null>(null);

  // Check URL query parameters for direct QR badge link (e.g. ?badge=AG-101) or counter action
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const b = params.get('badge') || params.get('userBadge') || params.get('matricule');
      if (b) {
        setUrlBadgeParam(b);
        setActiveTab('staff');
      }

      const act = params.get('action') || params.get('mode');
      if (act === 'canteen_counter' || act === 'counter_qr' || params.get('canteen_counter')) {
        setIsUserCanteenScannerOpen(true);
      }
    }
  }, []);

  // Real-time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from agnostic dbService
  const loadData = useCallback(async () => {
    try {
      const today = getTodayDateString();
      setTodayDateStr(today);

      const [loadedSettings, loadedMenu, loadedReservations] = await Promise.all([
        dbService.getSettings(),
        dbService.getDailyMenu(today),
        dbService.getReservations(today),
      ]);

      setSettings(loadedSettings);
      setMenu(loadedMenu);
      if (loadedMenu) {
        setSelectedPlatIdForForm((prev) => {
          if (prev && loadedMenu.plats.some((p) => p.id === prev)) return prev;
          return loadedMenu.featuredPlatId || loadedMenu.plats[0]?.id;
        });
      }
      setReservations(loadedReservations);

      // Synchroniser l'historique local avec les données distantes
      const syncedHistory = syncPersistedHistory(loadedReservations);
      setHistoryTickets(syncedHistory);

      // Check if user has an existing active ticket in local storage or synced history
      const lastTicketId = localStorage.getItem('mensa_last_ticket_id');
      if (lastTicketId) {
        const found = loadedReservations.find(
          (r) => r.id === lastTicketId && r.status !== 'cancelled'
        ) || syncedHistory.find(
          (r) => r.id === lastTicketId && r.status !== 'cancelled' && r.date === today
        );
        if (found) {
          setActiveTicket(found);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribeToChanges(() => {
      loadData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadData]);

  // Current effective time (simulated or real)
  const effectiveTime = simulatedTime || realTime;

  // Evaluate the critical business rule (08h00 - 10h00)
  const timeStatus = evaluateBookingWindow(
    effectiveTime,
    settings?.bookingWindowStart || '08:00',
    settings?.bookingWindowEnd || '10:00'
  );

  const handleReservationComplete = (newReservation: Reservation) => {
    setActiveTicket(newReservation);
    persistTicket(newReservation);
    setHistoryTickets(getPersistedTicketHistory());
    setReservations((prev) => [newReservation, ...prev]);
    setActiveTab('ticket');
  };

  const handleCancelTicketSuccess = async () => {
    if (activeTicket) {
      updatePersistedTicketStatus(activeTicket.id, 'cancelled');
      setHistoryTickets(getPersistedTicketHistory());
      setActiveTicket(null);
      localStorage.removeItem('mensa_last_ticket_id');
      await loadData();
      setActiveTab('staff');
    }
  };

  const handleMealConfirmed = (servedRes: Reservation) => {
    updatePersistedTicketStatus(servedRes.id, servedRes.status, servedRes.servedAt);
    setHistoryTickets(getPersistedTicketHistory());
    setReservations((prev) =>
      prev.map((r) => (r.id === servedRes.id ? servedRes : r))
    );
    if (activeTicket?.id === servedRes.id) {
      setActiveTicket(servedRes);
    }
  };

  if (isLoading || !settings || !menu) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg animate-bounce">
          <Utensils className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mt-4">
          {t('loading')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{t('connectingDb')}</p>
      </div>
    );
  }

  const confirmedCount = reservations.filter((r) => r.status !== 'cancelled').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans w-full max-w-full overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Simulator top bar for testing the 08:00 - 10:00 rule */}
      <TimeSimulatorBar
        isSimulated={simulatedTime !== null}
        simulatedTime={simulatedTime}
        onSetSimulation={setSimulatedTime}
        realTime={realTime}
      />

      {/* 2. Main Navbar with customized AppLogo and quick scanner action */}
      <Navbar
        settings={settings}
        timeStatus={timeStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenCanteenPoster={() => setIsCanteenPosterOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenUserCanteenScanner={() => setIsUserCanteenScannerOpen(true)}
        onOpenRegistration={() => setIsRegistrationModalOpen(true)}
        hasActiveTicket={!!activeTicket}
        todayDateStr={todayDateStr}
        historyCount={historyTickets.length}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* A. STAFF VIEW: MENU & RESERVATION */}
        {activeTab === 'staff' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Active Ticket Quick Notification */}
            {activeTicket && (
              <div className="no-print bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        {t('activeTicketNotice')}
                      </span>
                      <span className="text-xs font-bold text-amber-800">
                        {activeTicket.ticketCode || `N° #${activeTicket.id.slice(-4)}`}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {activeTicket.staffName} &bull; {menu?.plats.find((p) => p.id === activeTicket.selectedPlatId)?.name || 'Plat réservé'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0 self-stretch sm:self-auto justify-end">
                  {activeTicket.status === 'confirmed' ? (
                    <button
                      onClick={() => setIsUserCanteenScannerOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial"
                      title="Scanner le QR Code affiché au comptoir pour confirmer que vous avez pris votre repas"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scanner QR Cantine (Prise repas)</span>
                    </button>
                  ) : (
                    <span className="px-3 py-2 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5">
                      ✓ Repas déjà validé au comptoir
                    </span>
                  )}

                  <button
                    onClick={() => setActiveTab('ticket')}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{t('viewMyTicketBtn')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial"
                    title="Consulter l'historique complet de vos tickets de repas"
                  >
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Mon historique ({historyTickets.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Critical Business Rule Banner */}
            <TimeWindowBanner
              timeStatus={timeStatus}
              onSetSimulation={setSimulatedTime}
              serviceHours={settings.serviceHours}
            />

            {/* Real-time Capacity Bar & Quick Nav */}
            <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('capacityProgress', { count: confirmedCount, total: settings.capacityPerDay })}</span>
                  </span>
                  <span className="font-semibold text-slate-500">
                    {Math.max(0, settings.capacityPerDay - confirmedCount) > 0
                      ? t('placesRemainingCount', { count: settings.capacityPerDay - confirmedCount })
                      : t('fullCapacityNotice')}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      confirmedCount >= settings.capacityPerDay
                        ? 'bg-rose-500'
                        : confirmedCount / settings.capacityPerDay > 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (confirmedCount / settings.capacityPerDay) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
                <a
                  href="#menu-section"
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('menuShort')}</span>
                </a>
                <a
                  href="#reservation-section"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>{t('scrollToForm')}</span>
                </a>
              </div>
            </div>

            {/* Menu of the day section */}
            <MenuDisplay
              menu={menu}
              onSelectPlat={(platId) => setSelectedPlatIdForForm(platId)}
            />

            {/* Reservation form section */}
            <div id="reservation-section" className="pt-4">
              <ReservationForm
                menu={menu}
                timeStatus={timeStatus}
                capacityTotal={settings.capacityPerDay}
                currentReservationsCount={confirmedCount}
                onReservationComplete={handleReservationComplete}
                todayDateStr={todayDateStr}
                selectedPlatIdProp={selectedPlatIdForForm}
                initialBadgeProp={urlBadgeParam || undefined}
                restrictToAuthorizedUsers={settings.restrictToAuthorizedUsers}
                onOpenRegistration={() => setIsRegistrationModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* B. ACTIVE TICKET VIEW */}
        {activeTab === 'ticket' && activeTicket && (
          <div className="space-y-6">
            <div className="no-print text-center max-w-lg mx-auto">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {t('officialTicketValidated')}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                {t('ticketTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t('ticketSubtitle')}
              </p>
            </div>

            <ReservationTicketCard
              reservation={activeTicket}
              menu={menu}
              settings={settings}
              timeStatus={timeStatus}
              onCancelSuccess={handleCancelTicketSuccess}
              onNewReservation={() => setActiveTab('staff')}
              onMealConfirmed={handleMealConfirmed}
            />
          </div>
        )}

        {/* B2. STAFF RESERVATION HISTORY VIEW (LOCAL STORAGE PERSISTED) */}
        {activeTab === 'history' && (
          <StaffReservationHistory
            historyTickets={historyTickets}
            currentMenu={menu}
            settings={settings}
            timeStatus={timeStatus}
            todayDateStr={todayDateStr}
            onSelectTicket={(selected) => {
              setActiveTicket(selected);
              setActiveTab('ticket');
            }}
            onClearHistory={() => {
              clearPersistedHistory();
              setHistoryTickets([]);
            }}
            onBackToMenu={() => setActiveTab('staff')}
            onMealConfirmed={handleMealConfirmed}
            onCancelSuccess={handleCancelTicketSuccess}
          />
        )}

        {/* C. ADMIN VIEW */}
        {activeTab === 'admin' && (
          <div>
            {!isAdminLoggedIn ? (
              <AdminLogin
                onLoginSuccess={() => setIsAdminLoggedIn(true)}
                onCancel={() => setActiveTab('staff')}
              />
            ) : (
              <AdminDashboard
                initialMenu={menu}
                initialReservations={reservations}
                settings={settings}
                onLogout={() => {
                  setIsAdminLoggedIn(false);
                  setActiveTab('staff');
                }}
                onRefreshData={loadData}
                onOpenScanner={() => setIsScannerOpen(true)}
                todayDateStr={todayDateStr}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <AppLogo settings={settings} size="sm" />
            <span className="font-semibold text-slate-700">
              {settings.establishmentName} &bull; {t('staffCatering')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {settings.bookingWindowStart} - {settings.bookingWindowEnd}
              </span>
            </span>
            <span>&bull;</span>
            <button
              onClick={() => setIsUserCanteenScannerOpen(true)}
              className="hover:text-emerald-700 flex items-center gap-1 font-bold text-emerald-700 transition"
              title="Scanner le QR Code affiché au comptoir cantine pour confirmer que vous avez pris votre repas"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scanner QR Cantine</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="hover:text-emerald-700 flex items-center gap-1 font-semibold text-emerald-700 transition"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>{t('scanMeal')}</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="hover:text-emerald-700 flex items-center gap-1 font-medium transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('qrAccess')}</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsCanteenPosterOpen(true)}
              className="hover:text-emerald-700 flex items-center gap-1 font-bold text-emerald-800 transition"
              title="Télécharger le QR Code ou l'affiche à poser sur le comptoir de la cantine"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>QR Comptoir (Télécharger)</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-emerald-700 flex items-center gap-1 font-medium transition"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t('admin')}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 5. QR Code Poster Modal */}
      <QRCodePosterModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        settings={settings}
      />

      {/* 5b. Canteen Counter Poster Modal with download links */}
      <CanteenCounterPosterModal
        isOpen={isCanteenPosterOpen}
        onClose={() => setIsCanteenPosterOpen(false)}
        settings={settings}
      />

      {/* 6. Live Camera QR Code Meal Scanner Modal (Staff / Service) */}
      <MealScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        menu={menu}
        onMealConfirmed={handleMealConfirmed}
        recentReservations={reservations}
      />

      {/* 7. Self-Registration Modal for Staff */}
      <UserRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegisteredSuccess={loadData}
      />

      {/* 8. User Canteen QR Code Meal Scanner Modal (Prise de repas par l'usager) */}
      <UserCanteenScannerModal
        isOpen={isUserCanteenScannerOpen}
        onClose={() => setIsUserCanteenScannerOpen(false)}
        userReservation={activeTicket}
        menu={menu}
        onMealConfirmed={handleMealConfirmed}
        todayReservations={reservations}
        onOpenCanteenPoster={() => setIsCanteenPosterOpen(true)}
      />
    </div>
  );
}
