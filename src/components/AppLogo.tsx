import React from 'react';
import {
  Utensils,
  GraduationCap,
  HeartPulse,
  Building2,
  ChefHat,
  Coffee,
} from 'lucide-react';
import { AppSettings } from '../types';
import { EsstsLogo } from './EsstsLogo';
import { useLanguage } from '../i18n/LanguageContext';

interface AppLogoProps {
  settings?: AppSettings;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  settings,
  size = 'md',
  className = '',
  showText = false,
}) => {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-base',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-2xl',
  };

  const esstsSize = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
    xl: 'xl' as const,
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  const isEssts =
    settings?.logoIcon === 'essts' ||
    settings?.logoUrl === '/logo.svg' ||
    settings?.logoUrl === './logo.svg' ||
    (!settings?.logoUrl && settings?.logoIcon !== 'hospital' && settings?.logoIcon !== 'school' && settings?.logoIcon !== 'chef' && settings?.logoIcon !== 'building' && settings?.logoIcon !== 'coffee');

  // Si c'est le logo ESSTS officiel (par défaut ou sélectionné)
  if (isEssts && (!settings?.logoUrl || settings.logoUrl.includes('logo'))) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className={`${sizeClasses[size]} bg-white border border-blue-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1`}
          title="ESSTS - École Supérieure des Sciences et Technologies du Sport"
        >
          <EsstsLogo size={esstsSize[size]} />
        </div>
        {showText && (
          <div className="min-w-0">
            <span className="font-extrabold text-blue-950 tracking-tight text-base sm:text-lg block truncate">
              {settings?.establishmentName || 'ESSTS'}
            </span>
            <span className="text-xs text-blue-700/90 font-semibold block">
              المدرسة العليا لعلوم الرياضة وتكنولوجياتها
            </span>
          </div>
        )}
      </div>
    );
  }

  // Si un logo personnalisé (URL externe ou Image importée en base64) est défini
  if (settings?.logoUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className={`${sizeClasses[size]} bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1`}
        >
          <img
            src={settings.logoUrl}
            alt={settings.establishmentName || 'Logo'}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        {showText && (
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg block truncate">
              {settings.establishmentName}
            </span>
            <span className="text-xs text-slate-500 font-medium block">
              {t('staffCatering')}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Si une icône thématique prédéfinie est choisie
  const renderIcon = () => {
    const s = iconSizes[size];
    switch (settings?.logoIcon) {
      case 'hospital':
        return <HeartPulse className={s} />;
      case 'school':
        return <GraduationCap className={s} />;
      case 'chef':
        return <ChefHat className={s} />;
      case 'building':
        return <Building2 className={s} />;
      case 'coffee':
        return <Coffee className={s} />;
      case 'utensils':
      default:
        return <Utensils className={s} />;
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-700/20 shrink-0`}
      >
        {renderIcon()}
      </div>
      {showText && (
        <div className="min-w-0">
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg block truncate">
            {settings?.establishmentName || 'ESSTS'}
          </span>
          <span className="text-xs text-slate-500 font-medium block">
            {t('staffCatering')}
          </span>
        </div>
      )}
    </div>
  );
};
