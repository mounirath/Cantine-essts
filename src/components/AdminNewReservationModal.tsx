import React, { useState } from 'react';
import { DailyMenu, AuthorizedUser, Reservation, MealType, MEAL_TYPES_CONFIG } from '../types';
import {
  X,
  Plus,
  Utensils,
  Sun,
  Moon,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminNewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: DailyMenu;
  todayDateStr: string;
  authorizedUsers: AuthorizedUser[];
  onReservationCreated: (reservation: Reservation) => void;
}

const DEPARTMENTS = [
  'Ressources Humaines',
  'Pôle Technique & Informatique',
  'Service Médical & Soins',
  'Enseignement & Formation',
  'Administration & Finances',
  'Logistique & Services Généraux',
  'Direction Générale',
  'Autre service',
];

const BREAKFAST_SLOTS = [
  '07h00 - 07h30',
  '07h30 - 08h00',
  '08h00 - 08h30',
  '08h30 - 09h00',
];

const LUNCH_SLOTS = [
  '11h45 - 12h15',
  '12h15 - 12h45',
  '12h45 - 13h15',
  '13h15 - 13h45',
];

const DINNER_SLOTS = [
  '19h00 - 19h30',
  '19h30 - 20h00',
  '20h00 - 20h30',
  '20h30 - 21h00',
];

export const AdminNewReservationModal: React.FC<AdminNewReservationModalProps> = ({
  isOpen,
  onClose,
  menu,
  todayDateStr,
  authorizedUsers,
  onReservationCreated,
}) => {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [staffName, setStaffName] = useState('');
  const [staffDepartment, setStaffDepartment] = useState(DEPARTMENTS[0]);
  const [staffEmail, setStaffEmail] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');

  // Repas de midi
  const [selectedEntreeId, setSelectedEntreeId] = useState(menu.entrees[0]?.id || '');
  const [selectedPlatId, setSelectedPlatId] = useState(menu.plats[0]?.id || '');
  const [selectedDessertId, setSelectedDessertId] = useState(menu.desserts[0]?.id || '');
  const [lunchSlot, setLunchSlot] = useState(LUNCH_SLOTS[1]);

  // Petit-déjeuner
  const breakfastItems = menu.breakfastItems && menu.breakfastItems.length > 0 ? menu.breakfastItems : [
    { id: 'bf-1', category: 'plat' as const, name: 'Formule Complète Énergie', description: 'Œufs brouillés, pain levain, yaourt, boisson chaude et jus.', allergens: [] },
    { id: 'bf-2', category: 'plat' as const, name: 'Formule Traditionnelle Continentale', description: 'Croissants, pain croustillant, confitures, café ou thé.', allergens: [] },
    { id: 'bf-3', category: 'plat' as const, name: 'Formule Légère & Vitamines Bio', description: 'Fromage blanc, fruits frais de saison, thé vert et pain de seigle.', allergens: [] },
  ];
  const [selectedBreakfastId, setSelectedBreakfastId] = useState(breakfastItems[0]?.id || 'bf-1');
  const [breakfastSlot, setBreakfastSlot] = useState(BREAKFAST_SLOTS[1]);

  // Dîner
  const dinnerPlats = menu.dinnerPlats && menu.dinnerPlats.length > 0 ? menu.dinnerPlats : menu.plats;
  const dinnerEntrees = menu.dinnerEntrees && menu.dinnerEntrees.length > 0 ? menu.dinnerEntrees : menu.entrees;
  const dinnerDesserts = menu.dinnerDesserts && menu.dinnerDesserts.length > 0 ? menu.dinnerDesserts : menu.desserts;
  const [selectedDinnerEntreeId, setSelectedDinnerEntreeId] = useState(dinnerEntrees[0]?.id || '');
  const [selectedDinnerPlatId, setSelectedDinnerPlatId] = useState(dinnerPlats[0]?.id || '');
  const [selectedDinnerDessertId, setSelectedDinnerDessertId] = useState(dinnerDesserts[0]?.id || '');
  const [dinnerSlot, setDinnerSlot] = useState(DINNER_SLOTS[1]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (u: AuthorizedUser) => {
    setStaffName(u.fullName);
    setStaffDepartment(u.department);
    if (u.email) setStaffEmail(u.email);
    if (u.dietaryNotes) setDietaryNotes(u.dietaryNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!staffName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de l’agent.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { dbService } = await import('../services/dbService');

      let created: Reservation;

      if (mealType === 'breakfast') {
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'breakfast',
          selectedPlatId: selectedBreakfastId,
          timeSlot: breakfastSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      } else if (mealType === 'dinner') {
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'dinner',
          selectedEntreeId: selectedDinnerEntreeId || undefined,
          selectedPlatId: selectedDinnerPlatId,
          selectedDessertId: selectedDinnerDessertId || undefined,
          timeSlot: dinnerSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      } else {
        created = await dbService.createReservation({
          date: todayDateStr,
          staffName: staffName.trim(),
          staffDepartment,
          staffEmail: staffEmail.trim() || undefined,
          mealType: 'lunch',
          selectedEntreeId: selectedEntreeId || undefined,
          selectedPlatId,
          selectedDessertId: selectedDessertId || undefined,
          timeSlot: lunchSlot,
          dietaryNotes: dietaryNotes.trim() || undefined,
        });
      }

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      onReservationCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création de la réservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Ajouter une Réservation Manuelle
              </h3>
              <p className="text-xs text-slate-500">
                Enregistrez une réservation pour le Petit-déjeuner, le Déjeuner ou le Dîner.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Choix du service / type de repas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              1. Type de repas / Service :
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMealType('breakfast')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  mealType === 'breakfast'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Petit-déjeuner</span>
              </button>

              <button
                type="button"
                onClick={() => setMealType('lunch')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  mealType === 'lunch'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Repas de midi</span>
              </button>

              <button
                type="button"
                onClick={() => setMealType('dinner')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  mealType === 'dinner'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dîner (Soir)</span>
              </button>
            </div>
          </div>

          {/* 2. Coordonnées agent */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nom &amp; Prénom de l'agent <span className="text-rose-500">*</span>
                </label>
                {authorizedUsers.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Saisie libre ou sélection rapide
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Ex: Claire Bernard ou Matricule AG-101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
              />

              {/* Raccourcis agents autorisés */}
              {authorizedUsers.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                    Agents :
                  </span>
                  {authorizedUsers.slice(0, 6).map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 shrink-0 transition"
                    >
                      {u.fullName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service / Pôle
                </label>
                <select
                  value={staffDepartment}
                  onChange={(e) => setStaffDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email professionnel (optionnel)
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="agent@essts.dz"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Choix des plats et créneau selon le service */}
          <div className="space-y-3 pt-2">
            {mealType === 'breakfast' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Formule Petit-déjeuner :
                  </label>
                  <select
                    value={selectedBreakfastId}
                    onChange={(e) => setSelectedBreakfastId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    {breakfastItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Créneau horaire (Matin) :
                  </label>
                  <select
                    value={breakfastSlot}
                    onChange={(e) => setBreakfastSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono font-bold"
                  >
                    {BREAKFAST_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {mealType === 'lunch' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entrée :
                    </label>
                    <select
                      value={selectedEntreeId}
                      onChange={(e) => setSelectedEntreeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      {menu.entrees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plat chaud :
                    </label>
                    <select
                      value={selectedPlatId}
                      onChange={(e) => setSelectedPlatId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                    >
                      {menu.plats.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isPlatDuJour ? '⭐' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dessert :
                    </label>
                    <select
                      value={selectedDessertId}
                      onChange={(e) => setSelectedDessertId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      {menu.desserts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Créneau horaire (Déjeuner) :
                  </label>
                  <select
                    value={lunchSlot}
                    onChange={(e) => setLunchSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono font-bold"
                  >
                    {LUNCH_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {mealType === 'dinner' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plat chaud du soir :
                    </label>
                    <select
                      value={selectedDinnerPlatId}
                      onChange={(e) => setSelectedDinnerPlatId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                    >
                      {dinnerPlats.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Créneau horaire (Dîner) :
                    </label>
                    <select
                      value={dinnerSlot}
                      onChange={(e) => setDinnerSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono font-bold"
                    >
                      {DINNER_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarques diététiques (optionnel)
              </label>
              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="Ex: Sans sel, allergie fruits de mer..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Création...' : 'Créer la réservation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
