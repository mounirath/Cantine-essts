import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  QrCode,
  Sparkles,
  Utensils,
  User,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Reservation, DailyMenu } from '../types';
import { dbService } from '../services/dbService';
import confetti from 'canvas-confetti';
import { useLanguage } from '../i18n/LanguageContext';

interface MealScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: DailyMenu;
  onMealConfirmed: (reservation: Reservation) => void;
  recentReservations: Reservation[];
}

// Synthesizer Web Audio API pour carillon de confirmation (sans besoin de fichier audio externe)
function playFeedbackSound(type: 'success' | 'warning' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Carillon harmonique ascendant (validation cantine)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.frequency.setValueAtTime(739.99, ctx.currentTime + 0.05); // F#5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.05);
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } else if (type === 'warning') {
      // Double bip avertissement (déjà servi)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Silence si audio non supporté
  }
}

export const MealScannerModal: React.FC<MealScannerModalProps> = ({
  isOpen,
  onClose,
  menu,
  onMealConfirmed,
  recentReservations,
}) => {
  const { t } = useLanguage();
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    alreadyServed?: boolean;
    reservation?: Reservation;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Traiter un code (scanné ou saisi)
  const processTicketCode = async (rawCode: string) => {
    if (!rawCode.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const res = await dbService.confirmMealServedByCode(rawCode);
      setScanResult(res);

      if (res.success && res.reservation) {
        if (res.alreadyServed) {
          if (soundEnabled) playFeedbackSound('warning');
        } else {
          if (soundEnabled) playFeedbackSound('success');
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#059669', '#10b981', '#34d399'],
            });
          } catch {}
          onMealConfirmed(res.reservation);
        }
      } else {
        if (soundEnabled) playFeedbackSound('warning');
      }
    } catch {
      setScanResult({
        success: false,
        message: 'Erreur lors du traitement de la validation.',
      });
    } finally {
      setManualCode('');
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1200);
    }
  };

  // Démarrer la caméra
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-container');
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processTicketCode(decodedText);
        },
        () => {
          // Frame scan error / ignore
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Impossible d’accéder à la caméra (vérifiez les autorisations de votre navigateur ou utilisez la saisie rapide).'
      );
      setIsCameraActive(false);
    }
  };

  // Arrêter la caméra
  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-start camera if supported
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processTicketCode(manualCode);
    }
  };

  const getDishNames = (r: Reservation) => {
    const plat = menu.plats.find((p) => p.id === r.selectedPlatId)?.name || 'Plat chaud';
    const entree = menu.entrees.find((e) => e.id === r.selectedEntreeId)?.name;
    const dessert = menu.desserts.find((d) => d.id === r.selectedDessertId)?.name;
    return { plat, entree, dessert };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {t('scannerTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('scannerSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* CAMERA VIEWFINDER CONTAINER */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video sm:aspect-[4/3] flex items-center justify-center border-2 border-slate-800">
            <div id="qr-reader-container" className="w-full h-full" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white">
                <CameraOff className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs text-slate-300 max-w-xs">
                  {cameraError || t('cameraActiveNotice')}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t('startCamera')}</span>
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/90 bg-black/50 backdrop-blur-xs px-3 py-1 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{t('cameraActiveNotice')}</span>
                </span>
                <button
                  onClick={stopCamera}
                  className="text-slate-300 hover:text-white underline font-semibold"
                >
                  {t('stopCamera')}
                </button>
              </div>
            )}
          </div>

          {/* SCAN RESULT BANNER */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                scanResult.success && !scanResult.alreadyServed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-md'
                  : scanResult.alreadyServed
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.success && !scanResult.alreadyServed ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      scanResult.alreadyServed
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-sm sm:text-base">
                      {scanResult.alreadyServed
                        ? t('alreadyServedWarning')
                        : scanResult.success
                        ? t('mealConfirmedSuccess')
                        : t('ticketNotFoundOrCancelled')}
                    </h4>
                    {scanResult.reservation && (
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-black/10">
                        {scanResult.reservation.ticketCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 font-medium">{scanResult.message}</p>

                  {/* Beneficiary and menu preview */}
                  {scanResult.reservation && (
                    <div className="mt-3 pt-3 border-t border-black/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{scanResult.reservation.staffName}</span>
                        </span>
                        <span className="text-slate-600 font-medium">
                          {scanResult.reservation.staffDepartment}
                        </span>
                      </div>

                      {(() => {
                        const { plat, entree, dessert } = getDishNames(scanResult.reservation);
                        return (
                          <div className="bg-white/80 rounded-xl p-2.5 space-y-1 mt-1 border border-black/5 text-[11px]">
                            <div className="font-black text-emerald-800">
                              {t('mainDishTicket')} : {plat}
                            </div>
                            {entree && <div>{t('entreeTicket')} : {entree}</div>}
                            {dessert && <div>{t('dessertTicket')} : {dessert}</div>}
                            {scanResult.reservation.dietaryNotes && (
                              <div className="text-amber-800 font-bold">
                                {t('specialNotesTicket')} : {scanResult.reservation.dietaryNotes}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MANUAL CODE INPUT FALLBACK */}
          <form onSubmit={handleManualSubmit} className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('manualEntryTitle')} :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('manualEntryPlaceholder')}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                {t('validateManualBtn')}
              </button>
            </div>
          </form>

          {/* QUICK DEMO TICKETS CLICKER */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t('counterRecentServed')} :
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recentReservations.slice(0, 4).map((r) => {
                const isServed = r.status === 'served';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => processTicketCode(r.ticketCode)}
                    className={`p-2 rounded-xl border text-left rtl:text-right transition flex flex-col justify-between text-xs ${
                      isServed
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                        : 'border-slate-200 hover:border-emerald-500 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span>{r.ticketCode}</span>
                      {isServed && <span className="text-emerald-600 font-bold">✓</span>}
                    </div>
                    <span className="font-semibold truncate text-[11px] mt-0.5">
                      {r.staffName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {recentReservations.filter((r) => r.status === 'served').length} {t('statMealsServed')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
