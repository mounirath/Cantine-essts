import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Printer, Smartphone, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { AppSettings } from '../types';
import { AppLogo } from './AppLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { downloadQRCodePng, downloadCanteenPosterPdf } from '../utils/canteenPosterDownload';

interface QRCodePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const QRCodePosterModal: React.FC<QRCodePosterModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQrPng = async () => {
    setIsDownloading('png');
    try {
      await downloadQRCodePng(currentUrl, 'qr-code-cantine-reservation.png');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading('pdf');
    try {
      await downloadCanteenPosterPdf(
        {
          title: 'Réservation Cantine',
          establishmentName: settings.establishmentName,
          qrValue: currentUrl,
          type: 'booking',
          bookingHours: `${settings.bookingWindowStart} - ${settings.bookingWindowEnd}`,
        },
        'affiche-cantine-reservation-a4.pdf'
      );
    } finally {
      setIsDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="no-print absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label={t('closeBtn')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('posterTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {t('posterInstructions')}
          </p>
        </div>

        {/* Printable Poster Preview */}
        <div className="mt-6 p-6 rounded-3xl bg-gradient-to-b from-slate-50 to-white border-2 border-emerald-500/30 text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AppLogo settings={settings} size="sm" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              {settings.establishmentName}
            </span>
          </div>

          <h4 className="text-lg font-black text-slate-900 tracking-tight">
            {t('formTitle')}
          </h4>
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full mt-1 mb-4 border border-amber-300">
            ⏰ {settings.bookingWindowStart} - {settings.bookingWindowEnd}
          </div>

          {/* QR Code */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200">
            <QRCodeSVG value={currentUrl} size={180} level="H" includeMargin={true} />
          </div>

          <div className="text-[11px] text-slate-600 mt-3 font-medium space-y-1">
            <p>{t('posterStep1')}</p>
            <p>{t('posterStep2')}</p>
            <p>{t('posterStep3')}</p>
          </div>
        </div>

        {/* Download links bar */}
        <div className="no-print mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadQrPng}
            disabled={isDownloading !== null}
            className="py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Télécharger QR Code (PNG)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading !== null}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Télécharger Affiche (PDF)</span>
          </button>
        </div>

        {/* Copy link bar */}
        <div className="no-print mt-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate select-all"
          />
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>OK</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="no-print mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{t('printPosterBtn')}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
          >
            <span>{t('closeBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
