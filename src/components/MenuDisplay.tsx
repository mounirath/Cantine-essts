import React, { useState } from 'react';
import { DailyMenu, MenuItem, MealType, AppSettings } from '../types';
import {
  Utensils,
  Leaf,
  AlertCircle,
  Coffee,
  Star,
  Flame,
  Sparkles,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getAllMealSchedules } from '../utils/timeUtils';

interface MenuDisplayProps {
  menu: DailyMenu;
  onSelectPlat?: (platId: string, mealType?: MealType) => void;
  selectedMealTypeTab?: MealType | 'all';
  onChangeMealView?: (view: MealType | 'all') => void;
  settings?: AppSettings;
  effectiveTime?: Date;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({
  menu,
  onSelectPlat,
  selectedMealTypeTab = 'all',
  onChangeMealView,
  settings,
  effectiveTime,
}) => {
  const { t } = useLanguage();
  const [activeMealView, setActiveMealView] = useState<MealType | 'all'>(selectedMealTypeTab);

  React.useEffect(() => {
    if (selectedMealTypeTab) {
      setActiveMealView(selectedMealTypeTab);
    }
  }, [selectedMealTypeTab]);

  const handleSwitchTab = (view: MealType | 'all') => {
    setActiveMealView(view);
    onChangeMealView?.(view);
  };

  const now = effectiveTime || new Date();
  const mealSchedules = getAllMealSchedules(now, settings || {});

  // Détermination du Plat du Jour vedette
  const platDuJour =
    menu.plats.find((p) => p.id === menu.featuredPlatId || p.isPlatDuJour) || menu.plats[0];

  const handleChooseDish = (dishId: string, mealType: MealType) => {
    if (onSelectPlat) {
      onSelectPlat(dishId, mealType);
    }
    const formElem = document.getElementById('reservation-section');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderItemCard = (
    item: MenuItem,
    isStarred?: boolean,
    mealType: MealType = 'lunch',
    actionLabel?: string
  ) => {
    const isMealOpen = mealSchedules[mealType]?.timeStatus.isOpen ?? true;

    return (
      <div
        key={item.id}
        className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-white relative ${
          isStarred
            ? 'border-amber-400 shadow-lg ring-2 ring-amber-400/30'
            : 'border-slate-200/90 shadow-xs hover:border-slate-300'
        }`}
      >
        {isStarred && (
          <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 z-10 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Star className="w-3 h-3 fill-slate-950" />
            <span>{t('featuredDishBadge')}</span>
          </div>
        )}

        {item.imageUrl && (
          <div className="h-36 sm:h-44 w-full overflow-hidden relative bg-slate-100">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            {item.isVegetarian && (
              <span className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-emerald-700/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Leaf className="w-3 h-3 text-emerald-200" />
                <span>{t('vegetarianBadge')}</span>
              </span>
            )}
            {item.calories && (
              <span className="absolute bottom-2 left-2 rtl:left-auto rtl:right-2 bg-black/60 backdrop-blur-xs text-slate-100 text-[10px] font-medium px-2 py-0.5 rounded-md">
                ~{item.calories} {t('caloriesLabel')}
              </span>
            )}
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
              {item.name}
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          <div>
            {item.allergens && item.allergens.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {t('allergensLabel')}
                </span>
                {item.allergens.map((alg) => (
                  <span
                    key={alg}
                    className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Select Button on Card */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {mealType === 'breakfast'
                  ? '🥐 Petit-déj'
                  : mealType === 'dinner'
                  ? '🌙 Dîner'
                  : '🍽️ Midi'}
              </span>
              <button
                type="button"
                onClick={() => handleChooseDish(item.id, mealType)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  mealType === 'breakfast'
                    ? 'text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300'
                    : mealType === 'dinner'
                    ? 'text-indigo-900 bg-indigo-100/90 hover:bg-indigo-200 border border-indigo-300'
                    : 'text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{actionLabel || 'Réserver'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const breakfastList = menu.breakfastItems || [];
  const dinnerEntreesList = menu.dinnerEntrees || [];
  const dinnerPlatsList = menu.dinnerPlats || [];
  const dinnerDessertsList = menu.dinnerDesserts || [];

  return (
    <div id="menu-section" className="space-y-6">
      {/* 1. Menu Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {menu.coverImageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={menu.coverImageUrl}
              alt={menu.title}
              className="w-full h-full object-cover opacity-25 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/60" />
          </div>
        )}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <Utensils className="w-3.5 h-3.5" />
            <span>{t('dailyMenuTitle')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {menu.title}
          </h2>
          {menu.chefNote && (
            <p className="text-sm text-slate-300 mt-2.5 font-normal leading-relaxed italic border-l-2 rtl:border-l-0 rtl:border-r-2 border-emerald-500 pl-3 rtl:pl-0 rtl:pr-3">
              « {menu.chefNote} »
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
              <Coffee className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('freshBreadOption')} &amp; {t('waterBottleOption')}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>3 Services autonomes : Petit-déjeuner, Repas de midi &amp; Dîner</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SÉLECTEUR DE CATÉGORIES AVEC LEURS HORAIRES */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Navigation par Catégorie de Repas &amp; Horaires :</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Cliquez pour filtrer ou voir toutes les catégories séparées
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Bouton Toutes les catégories */}
          <button
            type="button"
            onClick={() => handleSwitchTab('all')}
            className={`p-3 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeMealView === 'all'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">Toutes les catégories</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeMealView === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3 services
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Vue complète détaillée
            </span>
          </button>

          {/* 1. Petit-déjeuner du Matin */}
          <button
            type="button"
            onClick={() => handleSwitchTab('breakfast')}
            className={`p-3 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeMealView === 'breakfast'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-500/30 font-bold'
                : 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 border border-amber-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Petit-déjeuner</span>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  mealSchedules.breakfast.timeStatus.isOpen
                    ? activeMealView === 'breakfast'
                      ? 'bg-slate-950 text-white'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {mealSchedules.breakfast.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </div>
            <div className="text-[10px] mt-1 space-y-0.5">
              <span className="block font-mono">
                Résa : {mealSchedules.breakfast.bookingStart} - {mealSchedules.breakfast.bookingEnd}
              </span>
              <span className="block opacity-80">
                Service : {mealSchedules.breakfast.serviceHours}
              </span>
            </div>
          </button>

          {/* 2. Menu du Déjeuner (Repas de midi) */}
          <button
            type="button"
            onClick={() => handleSwitchTab('lunch')}
            className={`p-3 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeMealView === 'lunch'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30 font-bold'
                : 'bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950 border border-emerald-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Déjeuner (Midi)</span>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  mealSchedules.lunch.timeStatus.isOpen
                    ? activeMealView === 'lunch'
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {mealSchedules.lunch.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </div>
            <div className="text-[10px] mt-1 space-y-0.5">
              <span className="block font-mono">
                Résa : {mealSchedules.lunch.bookingStart} - {mealSchedules.lunch.bookingEnd}
              </span>
              <span className="block opacity-80">
                Service : {mealSchedules.lunch.serviceHours}
              </span>
            </div>
          </button>

          {/* 3. Menu du Soir (Dîner) */}
          <button
            type="button"
            onClick={() => handleSwitchTab('dinner')}
            className={`p-3 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeMealView === 'dinner'
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/30 font-bold'
                : 'bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-950 border border-indigo-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Dîner (Soir)</span>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  mealSchedules.dinner.timeStatus.isOpen
                    ? activeMealView === 'dinner'
                      ? 'bg-white text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {mealSchedules.dinner.timeStatus.isOpen ? 'Ouvert' : 'Clos'}
              </span>
            </div>
            <div className="text-[10px] mt-1 space-y-0.5">
              <span className="block font-mono">
                Résa : {mealSchedules.dinner.bookingStart} - {mealSchedules.dinner.bookingEnd}
              </span>
              <span className="block opacity-80">
                Service : {mealSchedules.dinner.serviceHours}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. CATÉGORIE SÉPARÉE : PETIT-DÉJEUNER DU MATIN */}
      {/* ==================================================== */}
      {(activeMealView === 'breakfast' || activeMealView === 'all') && (
        <div className="space-y-4 pt-2">
          {/* Header de la Catégorie Petit-déjeuner */}
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  <Sun className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      Service Matin &bull; 1er Service du jour
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        mealSchedules.breakfast.timeStatus.isOpen
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {mealSchedules.breakfast.timeStatus.isOpen ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Réservations Ouvertes</span>
                        </>
                      ) : (
                        <span>Réservations Closes</span>
                      )}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Petit-déjeuner du Matin
                  </h3>
                  <p className="text-xs text-amber-950/80 mt-0.5">
                    Formules complètes équilibrées avec boisson chaude, viennoiserie ou pain frais, beurre, confiture et jus.
                  </p>
                </div>
              </div>

              {/* Horaires et Capacité Spécifiques */}
              <div className="flex items-center gap-2 flex-wrap md:justify-end bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-amber-200">
                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Réservation
                  </span>
                  <span className="font-mono text-xs font-black text-amber-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {mealSchedules.breakfast.bookingStart} &bull; {mealSchedules.breakfast.bookingEnd}
                    </span>
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Service
                  </span>
                  <span className="font-medium text-xs text-slate-800">
                    {mealSchedules.breakfast.serviceHours}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Capacité
                  </span>
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>{mealSchedules.breakfast.capacity} couverts</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grille des Formules Petit-déjeuner */}
          {breakfastList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {breakfastList.map((item) =>
                renderItemCard(item, false, 'breakfast', 'Réserver mon Petit-déj')
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Formules petit-déjeuner complètes servies avec boisson chaude, viennoiserie ou pain frais et jus de fruits.
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. CATÉGORIE SÉPARÉE : MENU DU DÉJEUNER (REPAS DE MIDI) */}
      {/* ==================================================== */}
      {(activeMealView === 'lunch' || activeMealView === 'all') && (
        <div className="space-y-4 pt-4">
          {/* Header de la Catégorie Repas de midi */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                      Service Midi &bull; 2ème Service du jour
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        mealSchedules.lunch.timeStatus.isOpen
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {mealSchedules.lunch.timeStatus.isOpen ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Réservations Ouvertes</span>
                        </>
                      ) : (
                        <span>Réservations Closes</span>
                      )}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Menu du Déjeuner (Repas de midi)
                  </h3>
                  <p className="text-xs text-emerald-950/80 mt-0.5">
                    Repas complet de midi avec entrées fraîches au choix, plat du jour cuisiné sur place et desserts gourmands.
                  </p>
                </div>
              </div>

              {/* Horaires et Capacité Spécifiques */}
              <div className="flex items-center gap-2 flex-wrap md:justify-end bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-200">
                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Réservation
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {mealSchedules.lunch.bookingStart} &bull; {mealSchedules.lunch.bookingEnd}
                    </span>
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Service
                  </span>
                  <span className="font-medium text-xs text-slate-800">
                    {mealSchedules.lunch.serviceHours}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Capacité
                  </span>
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{mealSchedules.lunch.capacity} couverts</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Encart Vedette Plat du Jour */}
          {platDuJour && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-400/60 rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {platDuJour.imageUrl && (
                  <div className="w-full md:w-56 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 shadow-md relative">
                    <img
                      src={platDuJour.imageUrl}
                      alt={platDuJour.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-amber-500 text-slate-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{t('featuredDishBadge')}</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 text-center md:text-left rtl:md:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
                    <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Plat du Jour Vedette (Déjeuner)</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {platDuJour.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {platDuJour.description}
                  </p>

                  <div className="mt-3 flex items-center justify-center md:justify-start rtl:md:justify-start gap-2 flex-wrap">
                    {platDuJour.isVegetarian && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>{t('vegetarianBadge')}</span>
                      </span>
                    )}
                    {platDuJour.calories && (
                      <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        ~{platDuJour.calories} {t('caloriesLabel')}
                      </span>
                    )}
                    {platDuJour.allergens && platDuJour.allergens.length > 0 && (
                      <span className="text-xs text-amber-800 font-medium">
                        {t('allergensLabel')} {platDuJour.allergens.join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-300/40 flex items-center justify-center md:justify-start rtl:md:justify-start">
                    <button
                      type="button"
                      onClick={() => handleChooseDish(platDuJour.id, 'lunch')}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition transform hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>{t('chooseThisDish')} (Midi)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sous-catégorie 1 : Entrées du midi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h4 className="text-base font-bold text-slate-900">{t('entreesTitle')} (Midi)</h4>
              </div>
              <span className="text-xs text-slate-500">{t('entreesSubtitle')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.entrees.map((item) =>
                renderItemCard(item, false, 'lunch', 'Choisir cette entrée')
              )}
            </div>
          </div>

          {/* Sous-catégorie 2 : Plats du midi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <h4 className="text-base font-bold text-slate-900">{t('platsTitle')} (Midi)</h4>
              </div>
              <span className="text-xs text-slate-500">{t('platsSubtitle')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.plats.map((item) =>
                renderItemCard(
                  item,
                  item.id === platDuJour?.id || item.isPlatDuJour || item.id === menu.featuredPlatId,
                  'lunch',
                  'Choisir ce plat de midi'
                )
              )}
            </div>
          </div>

          {/* Sous-catégorie 3 : Desserts du midi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h4 className="text-base font-bold text-slate-900">{t('dessertsTitle')} (Midi)</h4>
              </div>
              <span className="text-xs text-slate-500">{t('dessertsSubtitle')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.desserts.map((item) =>
                renderItemCard(item, false, 'lunch', 'Choisir ce dessert')
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CATÉGORIE SÉPARÉE : MENU DU SOIR (DÎNER) */}
      {/* ==================================================== */}
      {(activeMealView === 'dinner' || activeMealView === 'all') && (
        <div className="space-y-4 pt-4">
          {/* Header de la Catégorie Dîner du Soir */}
          <div className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-900 bg-indigo-200/80 px-2 py-0.5 rounded-full">
                      Service Soir &bull; 3ème Service du jour
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        mealSchedules.dinner.timeStatus.isOpen
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {mealSchedules.dinner.timeStatus.isOpen ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Réservations Ouvertes</span>
                        </>
                      ) : (
                        <span>Réservations Closes</span>
                      )}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Menu du Soir (Dîner)
                  </h3>
                  <p className="text-xs text-indigo-950/80 mt-0.5">
                    Repas équilibré du soir pour les internes, agents d'astreinte et sportifs en entraînement nocturne.
                  </p>
                </div>
              </div>

              {/* Horaires et Capacité Spécifiques */}
              <div className="flex items-center gap-2 flex-wrap md:justify-end bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-200">
                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Réservation
                  </span>
                  <span className="font-mono text-xs font-black text-indigo-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {mealSchedules.dinner.bookingStart} &bull; {mealSchedules.dinner.bookingEnd}
                    </span>
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Horaires Service
                  </span>
                  <span className="font-medium text-xs text-slate-800">
                    {mealSchedules.dinner.serviceHours}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="px-2.5 py-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Capacité
                  </span>
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{mealSchedules.dinner.capacity} couverts</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu Dîner */}
          {dinnerPlatsList.length > 0 ? (
            <div className="space-y-6">
              {dinnerEntreesList.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Entrées &amp; Potages du soir</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dinnerEntreesList.map((item) =>
                      renderItemCard(item, false, 'dinner', 'Choisir cette entrée du soir')
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Plats chauds légers du soir</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dinnerPlatsList.map((item) =>
                    renderItemCard(item, false, 'dinner', 'Choisir ce plat du soir')
                  )}
                </div>
              </div>

              {dinnerDessertsList.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span>Desserts &amp; Fruits frais du soir</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dinnerDessertsList.map((item) =>
                      renderItemCard(item, false, 'dinner', 'Choisir ce dessert du soir')
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.plats.map((item) =>
                renderItemCard(item, false, 'dinner', 'Choisir pour le dîner')
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

