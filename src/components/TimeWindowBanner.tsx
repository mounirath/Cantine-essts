import React from 'react';
import { Clock, CheckCircle2, Lock, Sparkles, Sun, Utensils, Moon } from 'lucide-react';
import { TimeCheckResult, AppSettings, MealType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getAllMealSchedules } from '../utils/timeUtils';

interface TimeWindowBannerProps {
  timeStatus: TimeCheckResult;
  onSetSimulation?: (time: Date | null) => void;
  serviceHours: string;
  settings?: AppSettings;
  effectiveTime?: Date;
  categoryPage?: MealType | 'all';
  onSelectCategoryPage?: (page: MealType | 'all') => void;
}

export const TimeWindowBanner: React.FC<TimeWindowBannerProps> = ({
  timeStatus,
  onSetSimulation,
  serviceHours,
  settings,
  effectiveTime,
  categoryPage = 'lunch',
  onSelectCategoryPage,
}) => {
  const { t } = useLanguage();
  const now = effectiveTime || new Date();
  const mealSchedules = settings ? getAllMealSchedules(now, settings) : null;

  // Si une page de catégorie spécifique est active, on utilise les horaires propres à ce repas
  const activeSchedule =
    categoryPage !== 'all' && mealSchedules
      ? mealSchedules[categoryPage]
      : null;

  const currentStatus = activeSchedule ? activeSchedule.timeStatus : timeStatus;
  const currentServiceHours = activeSchedule ? activeSchedule.serviceHours : serviceHours;
  const currentCategoryLabel = activeSchedule
    ? activeSchedule.label
    : 'Restauration Collective';

  const { isOpen, state, startTime, endTime, timeRemaining, currentDisplayTime } = currentStatus;

  const getThemeClasses = () => {
    if (categoryPage === 'breakfast') {
      return {
        openBg: 'from-amber-600 to-orange-600',
        openBorder: 'border-amber-400/30',
        badgeBg: 'bg-amber-400/25 border-amber-300/40 text-amber-100',
        icon: <Sun className="w-6 h-6 text-amber-100" />,
        accentColor: 'text-amber-300',
      };
    }
    if (categoryPage === 'dinner') {
      return {
        openBg: 'from-indigo-600 to-slate-800',
        openBorder: 'border-indigo-400/30',
        badgeBg: 'bg-indigo-400/25 border-indigo-300/40 text-indigo-100',
        icon: <Moon className="w-6 h-6 text-indigo-100" />,
        accentColor: 'text-indigo-300',
      };
    }
    return {
      openBg: 'from-emerald-600 to-teal-700',
      openBorder: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-400/25 border-emerald-300/40 text-emerald-100',
      icon: <Utensils className="w-6 h-6 text-emerald-100" />,
      accentColor: 'text-emerald-300',
    };
  };

  const theme = getThemeClasses();

  return (
    <div className="no-print mb-6 space-y-2">
      {isOpen ? (
        <div
          className={`bg-gradient-to-r ${theme.openBg} text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border ${theme.openBorder}`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  Réservations Ouvertes &bull; {currentCategoryLabel}
                </span>
                <span className={`border text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${theme.badgeBg}`}>
                  {startTime} - {endTime}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                Service en réfectoire prévu de <strong className="font-semibold underline">{currentServiceHours}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end border-t md:border-t-0 border-white/20 pt-3 md:pt-0">
            <div className="bg-black/25 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/15 text-right rtl:text-left">
              <div className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                {t('bannerTimeRemaining')}
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-white flex items-center justify-end rtl:justify-start gap-1.5">
                <Clock className={`w-4 h-4 ${theme.accentColor} animate-pulse`} />
                <span>{timeRemaining}</span>
              </div>
            </div>
          </div>
        </div>
      ) : state === 'BEFORE_WINDOW' ? (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400/40">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  Ouverture Prochaine &bull; {currentCategoryLabel}
                </span>
                <span className="bg-amber-300/25 border border-amber-200/40 text-amber-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {t('bannerCurrentTime', { time: currentDisplayTime })}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-50/95 mt-0.5">
                Ouverture des réservations à <strong className="font-mono">{startTime}</strong> (Clôture à <strong className="font-mono">{endTime}</strong>). Service : {currentServiceHours}.
              </p>
            </div>
          </div>

          {onSetSimulation && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => {
                  const [h, m] = startTime.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h, m + 15, 0, 0);
                  onSetSimulation(d);
                }}
                className="px-3.5 py-2 bg-white text-amber-800 hover:bg-amber-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Simuler ouverture ({startTime})</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-rose-400">
                  Réservations Closes &bull; {currentCategoryLabel}
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono">
                  Clôture : {endTime} ({currentDisplayTime})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                La commande a été transmise en cuisine. Pour ce service ({currentCategoryLabel}), le réfectoire sert de <strong className="text-white">{currentServiceHours}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {onSetSimulation && (
              <button
                onClick={() => {
                  const [h, m] = startTime.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h, m + 15, 0, 0);
                  onSetSimulation(d);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simuler créneau ({startTime})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barre récapitulative des 3 Services avec clic pour changer de page */}
      {mealSchedules && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Horaires de réservation Début &bull; Fin :</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Petit-déjeuner */}
            <button
              type="button"
              onClick={() => onSelectCategoryPage?.('breakfast')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition cursor-pointer ${
                categoryPage === 'breakfast'
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>🥐 Petit-déj :</span>
              <strong className="font-mono text-[11px]">
                {mealSchedules.breakfast.bookingStart} - {mealSchedules.breakfast.bookingEnd}
              </strong>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  mealSchedules.breakfast.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {mealSchedules.breakfast.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </button>

            {/* Déjeuner */}
            <button
              type="button"
              onClick={() => onSelectCategoryPage?.('lunch')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition cursor-pointer ${
                categoryPage === 'lunch'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>🍽️ Déjeuner :</span>
              <strong className="font-mono text-[11px]">
                {mealSchedules.lunch.bookingStart} - {mealSchedules.lunch.bookingEnd}
              </strong>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  mealSchedules.lunch.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {mealSchedules.lunch.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </button>

            {/* Dîner */}
            <button
              type="button"
              onClick={() => onSelectCategoryPage?.('dinner')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition cursor-pointer ${
                categoryPage === 'dinner'
                  ? 'bg-indigo-100 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>🌙 Dîner :</span>
              <strong className="font-mono text-[11px]">
                {mealSchedules.dinner.bookingStart} - {mealSchedules.dinner.bookingEnd}
              </strong>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  mealSchedules.dinner.timeStatus.isOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {mealSchedules.dinner.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

