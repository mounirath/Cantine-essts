import React, { useState } from 'react';
import { Reservation, DailyMenu, AppSettings, TimeCheckResult } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Camera,
  Utensils,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { UserCanteenScannerModal } from './UserCanteenScannerModal';
import { CanteenCounterPosterModal } from './CanteenCounterPosterModal';
import { useLanguage } from '../i18n/LanguageContext';

interface ReservationTicketCardProps {
  reservation: Reservation;
  menu: DailyMenu;
  settings: AppSettings;
  timeStatus: TimeCheckResult;
  onCancelSuccess: () => void;
  onNewReservation: () => void;
  onMealConfirmed?: (reservation: Reservation) => void;
}

export const ReservationTicketCard: React.FC<ReservationTicketCardProps> = ({
  reservation,
  menu,
  settings,
  timeStatus,
  onCancelSuccess,
  onNewReservation,
  onMealConfirmed,
}) => {
  const { t, formatDate } = useLanguage();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCanteenScannerOpen, setIsCanteenScannerOpen] = useState(false);
  const [isCounterPosterOpen, setIsCounterPosterOpen] = useState(false);

  const entreeItem = menu.entrees.find((e) => e.id === reservation.selectedEntreeId);
  const platItem = menu.plats.find((p) => p.id === reservation.selectedPlatId);
  const dessertItem = menu.desserts.find((d) => d.id === reservation.selectedDessertId);

  const canCancel =
    reservation.status === 'confirmed' &&
    settings.allowCancellation &&
    timeStatus.isOpen; // Cancellation also constrained to booking window for kitchen predictability

  const handleCancel = async () => {
    if (!window.confirm(t('confirmCancelPrompt'))) {
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      const { dbService } = await import('../services/dbService');
      const success = await dbService.cancelReservation(reservation.id);
      if (success) {
        onCancelSuccess();
      } else {
        setCancelError(t('ticketNotFoundOrCancelled'));
      }
    } catch {
      setCancelError(t('ticketNotFoundOrCancelled'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Visual ticket presentation */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-2xl overflow-hidden relative print:border-none print:shadow-none">
        {/* Top ticket header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-7 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AppLogo settings={settings} size="md" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{t('officialTicketValidated')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {settings.establishmentName}
                </h2>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">
                  {t('staffCatering')} &bull; {formatDate(reservation.date)}
                </p>
              </div>
            </div>

            {/* Ticket code badge */}
            <div className="bg-white text-slate-900 rounded-2xl p-3 shadow-md text-center shrink-0 border border-emerald-200">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
                {t('pickupNumberLabel')}
              </span>
              <span className="text-xl font-black font-mono text-slate-900 block mt-0.5">
                {reservation.ticketCode}
              </span>
            </div>
          </div>
        </div>

        {/* Notched perforated separator */}
        <div className="relative flex items-center justify-between px-2 bg-slate-50 py-2 border-y border-dashed border-slate-300">
          <div className="w-5 h-5 bg-slate-100 rounded-full -ml-4 rtl:-ml-0 rtl:-mr-4 border-r rtl:border-r-0 rtl:border-l border-slate-300" />
          <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-widest text-center flex-1">
            {t('presentAtCounterNotice')}
          </div>
          <div className="w-5 h-5 bg-slate-100 rounded-full -mr-4 rtl:-mr-0 rtl:-ml-4 border-l rtl:border-l-0 rtl:border-r border-slate-300" />
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Identity & slot */}
          <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('beneficiaryLabel')}
              </span>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg block mt-0.5">
                {reservation.staffName}
              </span>
              <span className="text-xs font-medium text-slate-500 block">
                {reservation.staffDepartment}
              </span>
            </div>

            <div className="text-right rtl:text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('timeSlotTicketLabel')}
              </span>
              <span className="font-extrabold text-emerald-700 text-base sm:text-lg block mt-0.5 flex items-center justify-end rtl:justify-start gap-1">
                <Clock className="w-4 h-4" />
                <span>{reservation.timeSlot}</span>
              </span>
              <span className="text-xs text-slate-500 block">
                {reservation.status === 'served'
                  ? t('statusServed')
                  : reservation.status === 'cancelled'
                  ? t('statusCancelled')
                  : t('statusConfirmed')}
              </span>
            </div>
          </div>

          {/* Meal Details */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              {t('mealCompositionLabel')}
            </span>
            <div className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="font-bold text-slate-500 shrink-0 w-20">{t('entreeTicket')} :</span>
                {entreeItem?.imageUrl && (
                  <img src={entreeItem.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs" />
                )}
                <span className="font-semibold text-slate-900 truncate">
                  {entreeItem ? entreeItem.name : '-'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="font-bold text-emerald-600 shrink-0 w-20">{t('mainDishTicket')} :</span>
                {platItem?.imageUrl && (
                  <img src={platItem.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs" />
                )}
                <span className="font-black text-slate-900 truncate">
                  {platItem ? platItem.name : '-'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="font-bold text-slate-500 shrink-0 w-20">{t('dessertTicket')} :</span>
                {dessertItem?.imageUrl && (
                  <img src={dessertItem.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs" />
                )}
                <span className="font-semibold text-slate-900 truncate">
                  {dessertItem ? dessertItem.name : '-'}
                </span>
              </div>
              {reservation.dietaryNotes && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-start gap-2 text-xs text-amber-900 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t('specialNotesTicket')} : {reservation.dietaryNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Retrait de repas : Scanner le QR Code de la cantine */}
          <div className="no-print">
            {reservation.status === 'confirmed' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-200" />
                    <span className="font-black text-sm">
                      Retrait de votre plateau au réfectoire
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                    Borne Cantine
                  </span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Pour confirmer que vous avez pris votre repas, scannez le QR code affiché au comptoir de la cantine avec votre téléphone.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCanteenScannerOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Scanner le QR Code de la cantine</span>
                </button>
                <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-100">
                  <span>Affiché sur le chevalet du comptoir</span>
                  <button
                    type="button"
                    onClick={() => setIsCounterPosterOpen(true)}
                    className="underline text-white font-bold hover:text-emerald-200 transition"
                  >
                    Voir / Télécharger l'affiche
                  </button>
                </div>
              </div>
            ) : reservation.status === 'served' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-sm font-black text-emerald-900">
                    Repas validé et récupéré !
                  </strong>
                  <span className="text-slate-600 block mt-0.5">
                    Votre plateau a bien été validé au comptoir de la cantine{' '}
                    {reservation.servedAt
                      ? `à ${new Date(reservation.servedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'aujourd’hui'}
                    . Bon appétit !
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* QR Code section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-center sm:text-left rtl:sm:text-right">
              <span className="text-xs font-extrabold text-slate-800 block">
                {t('ticketTitle')} (N° {reservation.ticketCode})
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {t('presentAtCounterNotice')}
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              <QRCodeSVG
                value={`MensaStaff-Ticket:${reservation.ticketCode}:${reservation.id}:${reservation.staffName}`}
                size={96}
                level="M"
              />
            </div>
          </div>

          {cancelError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {cancelError}
            </div>
          )}

          {/* Action buttons (hidden when printing) */}
          <div className="no-print pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('printTicketBtn')}</span>
            </button>

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{isCancelling ? '...' : t('cancelBookingBtn')}</span>
              </button>
            )}

            <button
              onClick={onNewReservation}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('newBookingBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Scanner de la Cantine pour l'agent */}
      <UserCanteenScannerModal
        isOpen={isCanteenScannerOpen}
        onClose={() => setIsCanteenScannerOpen(false)}
        userReservation={reservation}
        menu={menu}
        onMealConfirmed={(updated) => {
          if (onMealConfirmed) onMealConfirmed(updated);
        }}
      />

      {/* Modal Affiche / QR Code du comptoir cantine */}
      <CanteenCounterPosterModal
        isOpen={isCounterPosterOpen}
        onClose={() => setIsCounterPosterOpen(false)}
        settings={settings}
      />
    </div>
  );
};
