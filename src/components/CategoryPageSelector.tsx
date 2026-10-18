import React from 'react';
import { Sun, Utensils, Moon, LayoutGrid, Clock, Users, CheckCircle2, Lock } from 'lucide-react';
import { MealType, AppSettings } from '../types';
import { getAllMealSchedules } from '../utils/timeUtils';

export type CategoryPageType = MealType | 'all';

interface CategoryPageSelectorProps {
  activePage: CategoryPageType;
  onSelectPage: (page: CategoryPageType) => void;
  settings: AppSettings;
  effectiveTime?: Date;
  counts?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export const CategoryPageSelector: React.FC<CategoryPageSelectorProps> = ({
  activePage,
  onSelectPage,
  settings,
  effectiveTime,
  counts = { breakfast: 0, lunch: 0, dinner: 0 },
}) => {
  const now = effectiveTime || new Date();
  const mealSchedules = getAllMealSchedules(now, settings);

  return (
    <div className="no-print bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Navigation par Service &bull; Pages Séparées avec leurs Horaires</span>
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
            Choisissez votre Service de Restauration
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Chaque page affiche son propre menu, ses horaires de réservation et son statut
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Page Petit-déjeuner du Matin */}
        <button
          type="button"
          onClick={() => onSelectPage('breakfast')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
            activePage === 'breakfast'
              ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md ring-2 ring-amber-500/30'
              : 'border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/80 text-amber-950 hover:border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs ${
                activePage === 'breakfast'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Sun className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                activePage === 'breakfast'
                  ? mealSchedules.breakfast.timeStatus.isOpen
                    ? 'bg-slate-950/80 text-amber-200'
                    : 'bg-slate-950/80 text-rose-200'
                  : mealSchedules.breakfast.timeStatus.isOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {mealSchedules.breakfast.timeStatus.isOpen ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ouvert</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Clos</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <span
              className={`font-black text-sm sm:text-base block tracking-tight ${
                activePage === 'breakfast' ? 'text-white' : 'text-slate-900'
              }`}
            >
              1. Petit-déjeuner du Matin
            </span>
            <div
              className={`text-[11px] space-y-0.5 ${
                activePage === 'breakfast' ? 'text-amber-100' : 'text-amber-900/80'
              }`}
            >
              <p className="font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  Résa : {mealSchedules.breakfast.bookingStart} - {mealSchedules.breakfast.bookingEnd}
                </span>
              </p>
              <p>🍽️ Service : {mealSchedules.breakfast.serviceHours}</p>
              <p className="text-[10px] opacity-90 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <span>
                  Capacité : {counts.breakfast}/{mealSchedules.breakfast.capacity} réservés
                </span>
              </p>
            </div>
          </div>
        </button>

        {/* 2. Page Menu du Déjeuner (Repas de midi) */}
        <button
          type="button"
          onClick={() => onSelectPage('lunch')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
            activePage === 'lunch'
              ? 'border-emerald-600 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-600/30'
              : 'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/80 text-emerald-950 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs ${
                activePage === 'lunch'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <Utensils className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                activePage === 'lunch'
                  ? mealSchedules.lunch.timeStatus.isOpen
                    ? 'bg-slate-950/80 text-emerald-200'
                    : 'bg-slate-950/80 text-rose-200'
                  : mealSchedules.lunch.timeStatus.isOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {mealSchedules.lunch.timeStatus.isOpen ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ouvert</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Clos</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <span
              className={`font-black text-sm sm:text-base block tracking-tight ${
                activePage === 'lunch' ? 'text-white' : 'text-slate-900'
              }`}
            >
              2. Menu du Déjeuner (Midi)
            </span>
            <div
              className={`text-[11px] space-y-0.5 ${
                activePage === 'lunch' ? 'text-emerald-100' : 'text-emerald-900/80'
              }`}
            >
              <p className="font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  Résa : {mealSchedules.lunch.bookingStart} - {mealSchedules.lunch.bookingEnd}
                </span>
              </p>
              <p>🍽️ Service : {mealSchedules.lunch.serviceHours}</p>
              <p className="text-[10px] opacity-90 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <span>
                  Capacité : {counts.lunch}/{mealSchedules.lunch.capacity} réservés
                </span>
              </p>
            </div>
          </div>
        </button>

        {/* 3. Page Menu du Soir (Dîner) */}
        <button
          type="button"
          onClick={() => onSelectPage('dinner')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
            activePage === 'dinner'
              ? 'border-indigo-600 bg-gradient-to-br from-indigo-600 to-slate-800 text-white shadow-md ring-2 ring-indigo-600/30'
              : 'border-indigo-200/80 bg-indigo-50/40 hover:bg-indigo-50/80 text-indigo-950 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs ${
                activePage === 'dinner'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              <Moon className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                activePage === 'dinner'
                  ? mealSchedules.dinner.timeStatus.isOpen
                    ? 'bg-slate-950/80 text-indigo-200'
                    : 'bg-slate-950/80 text-rose-200'
                  : mealSchedules.dinner.timeStatus.isOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {mealSchedules.dinner.timeStatus.isOpen ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ouvert</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Clos</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <span
              className={`font-black text-sm sm:text-base block tracking-tight ${
                activePage === 'dinner' ? 'text-white' : 'text-slate-900'
              }`}
            >
              3. Menu du Soir (Dîner)
            </span>
            <div
              className={`text-[11px] space-y-0.5 ${
                activePage === 'dinner' ? 'text-indigo-100' : 'text-indigo-900/80'
              }`}
            >
              <p className="font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  Résa : {mealSchedules.dinner.bookingStart} - {mealSchedules.dinner.bookingEnd}
                </span>
              </p>
              <p>🍽️ Service : {mealSchedules.dinner.serviceHours}</p>
              <p className="text-[10px] opacity-90 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <span>
                  Capacité : {counts.dinner}/{mealSchedules.dinner.capacity} réservés
                </span>
              </p>
            </div>
          </div>
        </button>

        {/* 4. Page Vue Complète (Toutes les catégories) */}
        <button
          type="button"
          onClick={() => onSelectPage('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
            activePage === 'all'
              ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30'
              : 'border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs ${
                activePage === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activePage === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              3 en 1
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <span
              className={`font-black text-sm sm:text-base block tracking-tight ${
                activePage === 'all' ? 'text-white' : 'text-slate-900'
              }`}
            >
              4. Vue Complète
            </span>
            <div
              className={`text-[11px] space-y-0.5 ${
                activePage === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              <p className="font-bold">Afficher les 3 repas séparés</p>
              <p>Petit-déj + Déjeuner + Dîner</p>
              <p className="text-[10px] opacity-90">Visualisation générale de la journée</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
