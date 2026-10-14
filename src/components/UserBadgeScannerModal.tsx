import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AuthorizedUser, TimeCheckResult } from '../types';
import { dbService } from '../services/dbService';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface UserBadgeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserIdentified: (user: AuthorizedUser) => void;
  authorizedUsers?: AuthorizedUser[];
  timeStatus?: TimeCheckResult;
}

export const UserBadgeScannerModal: React.FC<UserBadgeScannerModalProps> = ({
  isOpen,
  onClose,
  onUserIdentified,
  authorizedUsers = [],
  timeStatus,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [identifiedUser, setIdentifiedUser] = useState<AuthorizedUser | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isHandlingRef = useRef(false);

  // Parse raw scanned string into user match
  const resolveScannedCode = async (rawCode: string): Promise<AuthorizedUser | null> => {
    const trimmed = rawCode.trim();
    if (!trimmed) return null;

    let targetBadge = '';
    let targetName = '';

    // A. URL query param
    if (trimmed.includes('?') && (trimmed.includes('badge=') || trimmed.includes('userBadge='))) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://dummy.local/${trimmed}`);
        targetBadge = url.searchParams.get('badge') || url.searchParams.get('userBadge') || '';
        targetName = url.searchParams.get('name') || '';
      } catch {}
    }

    // B. JSON payload
    if (!targetBadge && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        targetBadge = parsed.badge || parsed.badgeNumber || '';
        targetName = parsed.name || parsed.fullName || '';
      } catch {}
    }

    // C. ESSTS-USER: prefix
    if (!targetBadge && trimmed.toUpperCase().startsWith('ESSTS-USER:')) {
      targetBadge = trimmed.split(':')[1]?.trim() || '';
    }

    // D. Direct string
    if (!targetBadge) {
      targetBadge = trimmed;
    }

    // Find in provided whitelist
    let list = authorizedUsers;
    if (list.length === 0) {
      try {
        list = await dbService.getAuthorizedUsers();
      } catch {}
    }

    const cleanBadge = targetBadge.trim().toUpperCase();
    const cleanName = (targetName || targetBadge).trim().toLowerCase();

    const matched = list.find(
      (u) =>
        (cleanBadge && u.badgeNumber.trim().toUpperCase() === cleanBadge) ||
        (cleanName && u.fullName.toLowerCase() === cleanName) ||
        (cleanName && u.lastName && u.lastName.toLowerCase() === cleanName)
    );

    if (matched) return matched;

    // Check with backend verifyUserAuthorized
    try {
      const check = await dbService.verifyUserAuthorized(cleanBadge || targetBadge);
      if (check.authorized && check.user) {
        return check.user;
      }
    } catch {}

    return null;
  };

  const handleProcessCode = async (scannedText: string) => {
    if (isHandlingRef.current || !scannedText.trim()) return;
    isHandlingRef.current = true;
    setIsProcessing(true);
    setCameraError(null);

    try {
      const user = await resolveScannedCode(scannedText);
      if (user) {
        setIdentifiedUser(user);
        // Play brief success chime
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.35);
        } catch {}

        setTimeout(() => {
          onUserIdentified(user);
          stopCamera();
          onClose();
        }, 900);
      } else {
        setCameraError(
          `QR Code non reconnu ou agent non inscrit sur la liste autorisée ("${scannedText.slice(0, 30)}...").`
        );
        isHandlingRef.current = false;
        setIsProcessing(false);
      }
    } catch {
      setCameraError('Erreur lors de la vérification du code.');
      isHandlingRef.current = false;
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('user-badge-qr-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {}
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setCameraError(null);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('user-badge-qr-reader');
      }
      const result = await scannerRef.current.scanFile(file, true);
      await handleProcessCode(result);
    } catch {
      setCameraError("Aucun QR Code valide détecté dans l'image sélectionnée.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      isHandlingRef.current = false;
      setIdentifiedUser(null);
      setCameraError(null);
      setManualCode('');
      // Auto-start camera after DOM renders
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Scanner mon Badge QR
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scannez pour remplir automatiquement vos coordonnées.
            </p>
          </div>
        </div>

        {/* Notice si réservations closes */}
        {timeStatus && !timeStatus.isOpen && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950">Réservations closes pour aujourd'hui</p>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                Le créneau horaire ({timeStatus.startTime} - {timeStatus.endTime}) est clôturé. Le scan permet de vous identifier et de consulter vos réservations du jour, mais la validation d'un nouveau repas reste bloquée.
              </p>
            </div>
          </div>
        )}

        {/* Success feedback */}
        {identifiedUser ? (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-emerald-950">
              Agent Reconnu avec Succès !
            </h4>
            <p className="text-sm font-bold text-slate-900">{identifiedUser.fullName}</p>
            <p className="text-xs font-mono text-emerald-700">
              Matricule : {identifiedUser.badgeNumber} • {identifiedUser.department}
            </p>
            <p className="text-[11px] text-emerald-600 pt-1">
              Remplissage instantané du formulaire en cours...
            </p>
          </div>
        ) : (
          <>
            {/* Camera Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center shadow-inner">
              <div id="user-badge-qr-reader" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-slate-900/90">
                  <Camera className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-300 mb-3">
                    Caméra désactivée ou en attente d'autorisation.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Activer la Caméra</span>
                  </button>
                </div>
              )}

              {/* Aiming Reticle */}
              {isCameraActive && !isProcessing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-emerald-400 rounded-3xl animate-pulse" />
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold">Vérification de l'agent...</span>
                </div>
              )}
            </div>

            {/* Error banner */}
            {cameraError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{cameraError}</span>
              </div>
            )}

            {/* Alternative: File Upload */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Importer une photo du QR Code</span>
              </button>
            </div>

            {/* Manual input fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessCode(manualCode);
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ou saisissez le matricule (ex: AG-101)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || isProcessing}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                Valider
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
