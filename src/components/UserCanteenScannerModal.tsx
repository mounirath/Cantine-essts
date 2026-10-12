import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Utensils,
  QrCode,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Reservation, DailyMenu } from '../types';
import { dbService } from '../services/dbService';
import { isCanteenCounterCode, CANTEEN_COUNTER_PIN } from '../utils/canteenQR';
import confetti from 'canvas-confetti';
import { useLanguage } from '../i18n/LanguageContext';

interface UserCanteenScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userReservation: Reservation | null;
  menu: DailyMenu;
  onMealConfirmed: (reservation: Reservation) => void;
  todayReservations?: Reservation[];
  onOpenCanteenPoster?: () => void;
}

function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    osc2.frequency.setValueAtTime(739.99, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {}
}

export const UserCanteenScannerModal: React.FC<UserCanteenScannerModalProps> = ({
  isOpen,
  onClose,
  userReservation,
  menu,
  onMealConfirmed,
  todayReservations = [],
  onOpenCanteenPoster,
}) => {
  const { t } = useLanguage();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected reservation if userReservation was not passed directly
  const [selectedResId, setSelectedResId] = useState<string>(userReservation?.id || '');

  const [scanFeedback, setScanFeedback] = useState<{
    success: boolean;
    alreadyServed?: boolean;
    message: string;
    reservation?: Reservation;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isHandlingRef = useRef(false);

  const activeReservations = todayReservations.filter((r) => r.status !== 'cancelled');
  const targetReservation =
    userReservation || activeReservations.find((r) => r.id === selectedResId) || activeReservations[0];

  useEffect(() => {
    if (userReservation) {
      setSelectedResId(userReservation.id);
    } else if (activeReservations.length > 0 && !selectedResId) {
      setSelectedResId(activeReservations[0].id);
    }
  }, [userReservation, activeReservations, selectedResId]);

  const handleValidateMeal = async (scannedCode: string) => {
    if (isHandlingRef.current || !scannedCode.trim()) return;
    isHandlingRef.current = true;
    setIsProcessing(true);
    setScanFeedback(null);

    try {
      // Vérifier si le code scanné correspond au QR code de la cantine
      const isCounter = isCanteenCounterCode(scannedCode);

      if (!isCounter) {
        setScanFeedback({
          success: false,
          message: 'QR Code non reconnu. Veuillez scanner le QR Code officiel affiché au comptoir de la cantine.',
        });
        return;
      }

      if (!targetReservation) {
        setScanFeedback({
          success: false,
          message: 'Aucune réservation trouvée pour aujourd’hui. Veuillez d’abord réserver votre repas avant de le récupérer.',
        });
        return;
      }

      if (targetReservation.status === 'served') {
        const timeStr = targetReservation.servedAt
          ? new Date(targetReservation.servedAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        setScanFeedback({
          success: true,
          alreadyServed: true,
          reservation: targetReservation,
          message: `Votre repas a déjà été validé et émargé aujourd’hui à ${timeStr}. Bon appétit !`,
        });
        return;
      }

      // Valider le repas comme servi
      const res = await dbService.confirmMealServed(targetReservation.id);

      if (res.success && res.reservation) {
        playSuccessChime();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#38bdf8'],
          });
        } catch {}

        setScanFeedback({
          success: true,
          alreadyServed: false,
          reservation: res.reservation,
          message: `Repas validé avec succès au comptoir ! Votre plateau pour ${res.reservation.staffName} est émargé.`,
        });

        onMealConfirmed(res.reservation);
      } else {
        setScanFeedback({
          success: false,
          message: res.message || 'Impossible de valider le repas.',
        });
      }
    } catch (err: any) {
      setScanFeedback({
        success: false,
        message: err.message || 'Erreur technique lors de la validation.',
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isHandlingRef.current = false;
      }, 1500);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('user-canteen-qr-reader');
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleValidateMeal(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err) {
      console.warn('User scanner camera error:', err);
      setCameraError(
        'Accès caméra indisponible ou non autorisé. Vous pouvez utiliser le code de comptoir ci-dessous.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Stop user scanner camera error:', err);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanFeedback(null);
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const entreeItem = menu.entrees.find((e) => e.id === targetReservation?.selectedEntreeId);
  const platItem = menu.plats.find((p) => p.id === targetReservation?.selectedPlatId);
  const dessertItem = menu.desserts.find((d) => d.id === targetReservation?.selectedDessertId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Validation du Repas au Réfectoire
              </h3>
              <p className="text-xs text-slate-500">
                Scannez le QR Code affiché sur le comptoir de la cantine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Target Reservation Info */}
          {targetReservation ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Votre Réservation de Repas
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm block truncate">
                    {targetReservation.staffName}
                  </span>
                  <span className="text-slate-500 text-[11px] block truncate">
                    {targetReservation.staffDepartment} &bull; Ticket {targetReservation.ticketCode}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      targetReservation.status === 'served'
                        ? 'bg-teal-100 text-teal-800 border border-teal-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {targetReservation.status === 'served' ? '✓ Repas déjà pris' : 'En attente de prise'}
                  </span>
                </div>
              </div>

              {/* Si plusieurs réservations aujourd'hui, permettre de changer si ce n'est pas le bon agent */}
              {activeReservations.length > 1 && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">Changer d'agent :</span>
                  <select
                    value={targetReservation.id}
                    onChange={(e) => {
                      setSelectedResId(e.target.value);
                      setScanFeedback(null);
                    }}
                    className="flex-1 text-xs py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                  >
                    {activeReservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.staffName} ({r.ticketCode}) - {r.status === 'served' ? 'Déjà servi' : 'À servir'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Aucune réservation active détectée pour vous aujourd’hui. Veuillez d’abord réserver un repas sur la plateforme.
            </div>
          )}

          {/* Result Alert if scanned */}
          {scanFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-3 transition-all ${
                scanFeedback.success
                  ? scanFeedback.alreadyServed
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {scanFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">{scanFeedback.message}</span>
                {scanFeedback.success && scanFeedback.reservation && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 text-xs text-slate-700 space-y-0.5 font-normal">
                    <p>
                      <strong>Plat chaud :</strong> {platItem ? platItem.name : 'Plat du jour'}
                    </p>
                    {entreeItem && (
                      <p>
                        <strong>Entrée :</strong> {entreeItem.name}
                      </p>
                    )}
                    {dessertItem && (
                      <p>
                        <strong>Dessert :</strong> {dessertItem.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera Viewfinder */}
          {!scanFeedback?.success && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 aspect-square max-w-[280px] mx-auto flex items-center justify-center">
              <div id="user-canteen-qr-reader" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-300 bg-slate-900/90 z-10">
                  <CameraOff className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400 mb-3 max-w-xs">
                    {cameraError || 'La caméra est en pause ou en attente d’autorisation.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Activer la caméra</span>
                  </button>
                </div>
              )}

              {/* Viewfinder Target Guidelines */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400/50 m-6 rounded-2xl flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse shadow-xs" />
                </div>
              )}
            </div>
          )}

          {/* Quick Validation with Canteen Counter PIN */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Ou saisie rapide du code affiché au comptoir :
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateMeal(manualCode);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={`Ex: ${CANTEEN_COUNTER_PIN}`}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono uppercase"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition"
              >
                <span>Valider</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Code par défaut du réfectoire :</span>
              <button
                type="button"
                onClick={() => handleValidateMeal(CANTEEN_COUNTER_PIN)}
                className="text-emerald-600 hover:underline font-mono font-bold"
              >
                {CANTEEN_COUNTER_PIN}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 gap-2">
          {onOpenCanteenPoster ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCanteenPoster();
              }}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition"
              title="Télécharger l'affiche officielle et le QR Code à poser sur le comptoir"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Affiche / QR Code Comptoir</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
