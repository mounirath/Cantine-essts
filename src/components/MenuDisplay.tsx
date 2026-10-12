import React from 'react';
import { DailyMenu, MenuItem } from '../types';
import { Utensils, Leaf, AlertCircle, Coffee, Star, Flame, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MenuDisplayProps {
  menu: DailyMenu;
  onSelectPlat?: (platId: string) => void;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menu, onSelectPlat }) => {
  const { t } = useLanguage();

  // Détermination du Plat du Jour vedette
  const platDuJour =
    menu.plats.find((p) => p.id === menu.featuredPlatId || p.isPlatDuJour) || menu.plats[0];

  const handleChoosePlatDuJour = (platId: string) => {
    if (onSelectPlat) {
      onSelectPlat(platId);
    }
    const formElem = document.getElementById('reservation-section');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderItemCard = (item: MenuItem, isStarred?: boolean) => (
    <div
      key={item.id}
      className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-white relative ${
        isStarred
          ? 'border-amber-400 shadow-lg ring-2 ring-amber-400/30'
          : 'border-slate-200/80 shadow-xs hover:border-slate-300'
      }`}
    >
      {isStarred && (
        <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 z-10 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <Star className="w-3 h-3 fill-slate-950" />
          <span>{t('featuredDishBadge')}</span>
        </div>
      )}

      {item.imageUrl && (
        <div className="h-36 sm:h-40 w-full overflow-hidden relative bg-slate-100">
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

        {item.allergens && item.allergens.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('allergensLabel')}</span>
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
      </div>
    </div>
  );

  return (
    <div id="menu-section" className="space-y-8">
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
              <span>{t('includedInFormula')} : 1 {t('entreesTitle')} + 1 {t('platsTitle')} + 1 {t('dessertsTitle')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. ENCART VEDETTE « PLAT DU JOUR » */}
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
                <span>{t('featuredDishBadge')}</span>
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
                  onClick={() => handleChoosePlatDuJour(platDuJour.id)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition transform hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{t('chooseThisDish')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Entrées */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-lg font-bold text-slate-900">{t('entreesTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">{t('entreesSubtitle')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.entrees.map((item) => renderItemCard(item))}
        </div>
      </div>

      {/* 4. Plats Chauds */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <h3 className="text-lg font-bold text-slate-900">{t('platsTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">{t('platsSubtitle')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.plats.map((item) =>
            renderItemCard(
              item,
              item.id === platDuJour?.id || item.isPlatDuJour || item.id === menu.featuredPlatId
            )
          )}
        </div>
      </div>

      {/* 5. Desserts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <h3 className="text-lg font-bold text-slate-900">{t('dessertsTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500">{t('dessertsSubtitle')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.desserts.map((item) => renderItemCard(item))}
        </div>
      </div>
    </div>
  );
};
