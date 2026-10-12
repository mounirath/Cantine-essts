import React from 'react';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'minimal' | 'responsive';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage, isRTL } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 ${className}`} dir="ltr">
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`px-2 py-1 text-xs font-bold rounded-md transition ${
            language === 'fr'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Français"
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ar')}
          className={`px-2 py-1 text-xs font-bold rounded-md transition font-arabic ${
            language === 'ar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="اللغة العربية"
        >
          عربي
        </button>
      </div>
    );
  }

  if (variant === 'responsive') {
    return (
      <div
        className={`inline-flex items-center bg-slate-100/90 hover:bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/90 shadow-2xs transition ${className}`}
        dir="ltr"
      >
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 sm:gap-1.5 ${
            language === 'fr'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-pressed={language === 'fr'}
          title="Français"
        >
          <span className="text-xs sm:text-sm">🇫🇷</span>
          <span>FR</span>
        </button>

        <button
          type="button"
          onClick={() => setLanguage('ar')}
          className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 sm:gap-1.5 font-arabic ${
            language === 'ar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-pressed={language === 'ar'}
          title="اللغة العربية"
        >
          <span className="text-xs sm:text-sm">🇩🇿</span>
          <span className="hidden sm:inline font-semibold tracking-wide">العربية</span>
          <span className="sm:hidden font-semibold">عربي</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-slate-100/90 hover:bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs transition ${className}`}
      dir="ltr"
    >
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
          language === 'fr'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={language === 'fr'}
      >
        <span className="text-sm">🇫🇷</span>
        <span>FR</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
          language === 'ar'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={language === 'ar'}
      >
        <span className="text-sm">🇩🇿</span>
        <span className="font-semibold tracking-wide">العربية</span>
      </button>
    </div>
  );
};
