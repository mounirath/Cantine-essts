import React, { useState } from 'react';
import { AuthorizedUser } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Building2,
  Mail,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getUserBookingUrl,
  downloadUserQrCodePNG,
  exportSingleUserBadgePDF,
} from '../utils/userPdfExport';

interface UserBadgeModalProps {
  user: AuthorizedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForBooking?: (user: AuthorizedUser) => void;
}

export const UserBadgeModal: React.FC<UserBadgeModalProps> = ({
  user,
  isOpen,
  onClose,
  onSelectForBooking,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  if (!isOpen || !user) return null;

  const bookingUrl = getUserBookingUrl(user);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      await downloadUserQrCodePNG(user);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportSingleUserBadgePDF(user);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Badge & QR Code de Réservation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Carte d’accès pour réservation instantanée sans saisie d’informations.
            </p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* VISUAL BADGE CARD PREVIEW (Screen & Print ready) */}
        {/* ==================================================== */}
        <div className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-5 shadow-sm relative overflow-hidden">
          {/* Top Banner */}
          <div className="bg-emerald-600 -mx-5 -mt-5 px-4 py-2.5 flex items-center justify-between text-white mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
              <span className="text-[11px] font-black tracking-wider uppercase">
                ESSTS CANTEEN • BADGE OFFICIEL
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {user.approvalStatus === 'approved' || user.active ? 'AUTORISÉ' : 'EN ATTENTE'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Left: QR Code Box */}
            <div className="flex flex-col items-center shrink-0 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="p-1.5 bg-white rounded-xl">
                <QRCodeSVG
                  value={bookingUrl}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 mt-2 uppercase tracking-wide">
                Scanner pour réserver
              </span>
              <span className="text-[9px] text-slate-400">Sans saisie manuelle</span>
            </div>

            {/* Right: User Information */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left rtl:sm:text-right w-full">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Agent Bénéficiaire
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {user.fullName}
                </h4>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{user.role || 'Personnel Officiel'}</span>
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-center sm:justify-start rtl:sm:justify-end gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.department}</span>
              </div>

              {user.email && (
                <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start rtl:sm:justify-end gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}

              {/* Matricule Box */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-2xs">
                  <span className="text-emerald-400 text-[10px] uppercase">Matricule :</span>
                  <span>{user.badgeNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Fenêtre de réservation officielle : 08h00 - 10h00</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              100% Automatique
            </span>
          </div>
        </div>

        {/* Copy Direct URL Box */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Lien de réservation directe de l'agent
            </span>
            <p className="text-xs font-mono text-slate-700 truncate">{bookingUrl}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloadingPng}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>{isDownloadingPng ? 'Génération...' : 'Télécharger QR (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Génération...' : 'Télécharger Badge (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimer la Carte</span>
          </button>

          {onSelectForBooking && (
            <button
              type="button"
              onClick={() => {
                onSelectForBooking(user);
                onClose();
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Tester la réservation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
