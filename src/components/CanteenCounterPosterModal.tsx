import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  Printer,
  Utensils,
  Sparkles,
  Download,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppSettings } from '../types';
import { AppLogo } from './AppLogo';
import { CANTEEN_COUNTER_QR_VALUE, CANTEEN_COUNTER_PIN } from '../utils/canteenQR';
import {
  downloadQRCodePng,
  downloadCanteenPosterPdf,
  downloadCanteenPosterImage,
} from '../utils/canteenPosterDownload';

interface CanteenCounterPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const CanteenCounterPosterModal: React.FC<CanteenCounterPosterModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [activeMode, setActiveMode] = useState<'pickup' | 'booking'>('pickup');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Smart URL for counter pickup that opens the app with counter validation if scanned by standard mobile camera
  const pickupSmartUrl = `${currentOrigin}/?action=canteen_counter&code=${encodeURIComponent(CANTEEN_COUNTER_QR_VALUE)}`;
  // Smart booking URL for employees scanning at the counter
  const bookingSmartUrl = currentUrl.split('?')[0];

  const currentQrValue = activeMode === 'pickup' ? pickupSmartUrl : bookingSmartUrl;
  const currentDisplayedLink = activeMode === 'pickup' ? pickupSmartUrl : bookingSmartUrl;

  const triggerDownloadSuccess = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentDisplayedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(CANTEEN_COUNTER_PIN);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleDownloadQrPng = async () => {
    setIsDownloading('png-qr');
    try {
      const filename =
        activeMode === 'pickup'
          ? 'qr-code-retrait-comptoir-cantine.png'
          : 'qr-code-reservation-cantine.png';
      await downloadQRCodePng(currentQrValue, filename);
      triggerDownloadSuccess('QR Code PNG téléchargé avec succès !');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading('pdf');
    try {
      const filename =
        activeMode === 'pickup'
          ? 'affiche-comptoir-retrait-cantine-a4.pdf'
          : 'affiche-comptoir-reservation-cantine-a4.pdf';
      await downloadCanteenPosterPdf(
        {
          title: activeMode === 'pickup' ? 'Retrait du Repas' : 'Réservation du Repas',
          establishmentName: settings.establishmentName,
          qrValue: currentQrValue,
          type: activeMode,
          serviceHours: settings.serviceHours,
          bookingHours: `${settings.bookingWindowStart} - ${settings.bookingWindowEnd}`,
          pinCode: CANTEEN_COUNTER_PIN,
        },
        filename
      );
      triggerDownloadSuccess('Affiche officielle PDF (A4) téléchargée !');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPosterImage = async () => {
    setIsDownloading('image');
    try {
      const filename =
        activeMode === 'pickup'
          ? 'affiche-chevalet-comptoir-cantine.png'
          : 'affiche-chevalet-reservation-cantine.png';
      await downloadCanteenPosterImage(
        {
          title: activeMode === 'pickup' ? 'Retrait du Repas' : 'Réservation du Repas',
          establishmentName: settings.establishmentName,
          qrValue: currentQrValue,
          type: activeMode,
          serviceHours: settings.serviceHours,
          bookingHours: `${settings.bookingWindowStart} - ${settings.bookingWindowEnd}`,
          pinCode: CANTEEN_COUNTER_PIN,
        },
        filename
      );
      triggerDownloadSuccess('Affiche complète haute résolution (PNG) téléchargée !');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pr-6 pl-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-2 shadow-xs">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Affiche &amp; QR Code du Comptoir de la Cantine
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Téléchargez les fichiers numériques ou imprimez l'affiche prête à poser sur le comptoir ou le chevalet du réfectoire.
          </p>
        </div>

        {/* Success toast notification */}
        {downloadSuccessMessage && (
          <div className="no-print mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="no-print mt-4 grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveMode('pickup')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeMode === 'pickup'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>1. Retrait Plateau (Prise repas)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('booking')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeMode === 'booking'
                ? 'bg-white text-blue-800 shadow-xs border border-blue-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>2. Accès &amp; Commande en ligne</span>
          </button>
        </div>

        {/* Section Liens & Boutons de Téléchargement */}
        <div className="no-print mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Téléchargement direct des supports
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              HD &bull; Prêt à l'emploi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Télécharger QR Code PNG */}
            <button
              type="button"
              onClick={handleDownloadQrPng}
              disabled={isDownloading !== null}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300/80 text-emerald-950 text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-2xs group"
              title="Télécharger le QR Code seul en haute résolution (PNG transparent)"
            >
              <div className="flex items-center gap-1.5 text-emerald-700 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
                <span className="font-extrabold">QR Code Seul</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Image PNG (1024px)</span>
            </button>

            {/* 2. Télécharger Affiche PDF A4 */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading !== null}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs group"
              title="Télécharger l'affiche complète au format PDF pour impression A4"
            >
              <div className="flex items-center gap-1.5 text-white group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-emerald-200" />
                <span className="font-extrabold">Affiche PDF (A4)</span>
              </div>
              <span className="text-[10px] text-emerald-100 font-medium">Pour impression directe</span>
            </button>

            {/* 3. Télécharger Affiche Chevalet PNG */}
            <button
              type="button"
              onClick={handleDownloadPosterImage}
              disabled={isDownloading !== null}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs group"
              title="Télécharger l'affiche graphique complète en image PNG pour écrans ou imprimeries"
            >
              <div className="flex items-center gap-1.5 text-white group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold">Affiche Complète</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium">Image Poster HD (PNG)</span>
            </button>
          </div>

          {/* Lien direct à copier / partager */}
          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 shrink-0">Lien direct :</span>
            <input
              type="text"
              readOnly
              value={currentDisplayedLink}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              title="Copier le lien"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Printable Poster Preview Container */}
        <div className="mt-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 border-2 border-emerald-500/40 text-center shadow-md">
          {/* Top Logo & Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <AppLogo settings={settings} size="sm" />
            <span className="font-black text-xs uppercase tracking-wider text-slate-800">
              {settings.establishmentName}
            </span>
          </div>

          {/* Badge */}
          <div
            className={`inline-block px-3.5 py-1 text-white text-xs font-black rounded-full mb-3 shadow-xs ${
              activeMode === 'pickup' ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          >
            {activeMode === 'pickup'
              ? '🍽️ COMPTOIR CANTINE • RETRAIT DU PLATEAU'
              : '📱 COMMANDE & RÉSERVATION EN LIGNE'}
          </div>

          <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {activeMode === 'pickup'
              ? 'Scannez ce QR Code pour valider votre repas'
              : 'Scannez ce QR Code pour réserver votre repas'}
          </h4>

          <p className="text-xs text-slate-500 mt-1 mb-4">
            {activeMode === 'pickup' ? (
              <>
                Horaires de distribution au réfectoire :{' '}
                <strong className="text-slate-800">{settings.serviceHours}</strong>
              </>
            ) : (
              <>
                Créneau de commande en ligne :{' '}
                <strong className="text-slate-800">
                  {settings.bookingWindowStart} - {settings.bookingWindowEnd}
                </strong>
              </>
            )}
          </p>

          {/* Large Scannable QR Code */}
          <div className="inline-block p-4 sm:p-5 bg-white rounded-3xl shadow-xl border-2 border-emerald-500/30">
            <QRCodeSVG
              value={currentQrValue}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Instructions Box */}
          <div className="mt-4 p-3.5 bg-white rounded-2xl border border-slate-200 text-left space-y-1.5 text-xs text-slate-700 max-w-md mx-auto">
            <p className="font-extrabold text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comment faire ?</span>
            </p>
            {activeMode === 'pickup' ? (
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li>Ouvrez <strong>MensaStaff</strong> sur votre téléphone.</li>
                <li>Sur votre ticket, cliquez sur <strong>« Scanner QR Cantine »</strong>.</li>
                <li>Pointez votre appareil vers ce QR Code pour valider votre plateau.</li>
                <li>Récupérez votre repas chaud auprès de l'équipe de service.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li>Ouvrez l’appareil photo ou le scanner de votre smartphone.</li>
                <li>Pointez l’appareil vers ce QR Code pour ouvrir la cantine.</li>
                <li>Choisissez votre plat, entrée et dessert, puis validez.</li>
                <li>Votre ticket numérique avec QR Code individuel est généré.</li>
              </ol>
            )}
          </div>

          {/* Fallback PIN Code (for pickup) */}
          {activeMode === 'pickup' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <span>Code manuel de secours :</span>
              <strong className="font-mono font-black text-slate-900">{CANTEEN_COUNTER_PIN}</strong>
              <button
                type="button"
                onClick={handleCopyPin}
                className="ml-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                {copiedPin ? 'Copié !' : 'Copier'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimer cette affiche</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Télécharger l'Affiche (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
          >
            <span>Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
