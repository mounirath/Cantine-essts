import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Utensils,
  ChevronRight,
  Eye,
  Trash2,
  ArrowLeft,
  Sparkles,
  Download,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { Reservation, DailyMenu, AppSettings, TimeCheckResult } from '../types';
import { ReservationTicketCard } from './ReservationTicketCard';
import { useLanguage } from '../i18n/LanguageContext';

interface StaffReservationHistoryProps {
  historyTickets: Reservation[];
  currentMenu: DailyMenu;
  settings: AppSettings;
  timeStatus: TimeCheckResult;
  todayDateStr: string;
  onSelectTicket: (ticket: Reservation) => void;
  onClearHistory: () => void;
  onBackToMenu: () => void;
  onMealConfirmed?: (reservation: Reservation) => void;
  onCancelSuccess?: () => void;
}

export const StaffReservationHistory: React.FC<StaffReservationHistoryProps> = ({
  historyTickets,
  currentMenu,
  settings,
  timeStatus,
  todayDateStr,
  onSelectTicket,
  onClearHistory,
  onBackToMenu,
  onMealConfirmed,
  onCancelSuccess,
}) => {
  const { t, formatDate, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'served' | 'confirmed' | 'cancelled'>('all');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Reservation | null>(null);

  // Déduire l'identité de l'agent connecté depuis ses tickets enregistrés
  const latestTicket = historyTickets[0];
  const staffName = latestTicket?.staffName || 'Membre du personnel';
  const staffDepartment = latestTicket?.staffDepartment || 'Services Généraux';

  // Statistiques globales de l'agent
  const stats = useMemo(() => {
    const total = historyTickets.length;
    const served = historyTickets.filter((t) => t.status === 'served').length;
    const confirmed = historyTickets.filter((t) => t.status === 'confirmed').length;
    const cancelled = historyTickets.filter((t) => t.status === 'cancelled').length;
    const attendanceRate = total > 0 ? Math.round((served / (total - cancelled || 1)) * 100) : 0;
    return { total, served, confirmed, cancelled, attendanceRate };
  }, [historyTickets]);

  // Filtrage et recherche
  const filteredTickets = useMemo(() => {
    return historyTickets.filter((ticket) => {
      // Filtre statut
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false;
      }

      // Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = (ticket.ticketCode || '').toLowerCase().includes(q);
        const nameMatch = (ticket.staffName || '').toLowerCase().includes(q);
        const dateMatch = (ticket.date || '').toLowerCase().includes(q);
        const notesMatch = (ticket.dietaryNotes || '').toLowerCase().includes(q);

        // Recherche dans les noms de plats si présents
        const platMatch = currentMenu.plats.some(
          (p) => p.id === ticket.selectedPlatId && p.name.toLowerCase().includes(q)
        );
        const entreeMatch = currentMenu.entrees.some(
          (e) => e.id === ticket.selectedEntreeId && e.name.toLowerCase().includes(q)
        );
        const dessertMatch = currentMenu.desserts.some(
          (d) => d.id === ticket.selectedDessertId && d.name.toLowerCase().includes(q)
        );

        return codeMatch || nameMatch || dateMatch || notesMatch || platMatch || entreeMatch || dessertMatch;
      }

      return true;
    });
  }, [historyTickets, statusFilter, searchQuery, currentMenu]);

  // Résoudre les détails du plat pour un ticket
  const getDishDetails = (ticket: Reservation) => {
    const plat = currentMenu.plats.find((p) => p.id === ticket.selectedPlatId);
    const entree = currentMenu.entrees.find((e) => e.id === ticket.selectedEntreeId);
    const dessert = currentMenu.desserts.find((d) => d.id === ticket.selectedDessertId);
    return { plat, entree, dessert };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBackToMenu}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Retour au menu du jour"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Espace Personnel
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-semibold text-slate-500">
                Stockage local persistant
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-600" />
              <span>Historique de mes Réservations</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onBackToMenu}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-xs"
          >
            <Utensils className="w-4 h-4" />
            <span>Réserver un repas</span>
          </button>

          {historyTickets.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Voulez-vous réinitialiser l’historique local des tickets sur cet appareil ?')) {
                  onClearHistory();
                }
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Vider l'historique local sur ce navigateur"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profil de l'agent & Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Agent Profile Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-3">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Membre Connecté
            </span>
            <h3 className="text-base font-black text-white mt-1 leading-snug">
              {staffName}
            </h3>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{staffDepartment}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 text-[11px] text-slate-400">
            Tickets mémorisés dans votre navigateur pour consultation hors-ligne ou rapide.
          </div>
        </div>

        {/* KPI Cards */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Réservations
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats.total}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              tickets cumulés
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Repas Consommés
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {stats.served}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              validés au comptoir
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              En Attente
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {stats.confirmed}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              à retirer
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Taux d'Émargement
            </span>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-1">
              {stats.attendanceRate}%
            </div>
            <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
              présence effective
            </span>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par date, code ticket, plat..."
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('served')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'served'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Consommés ({stats.served})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'confirmed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            En attente ({stats.confirmed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Annulés ({stats.cancelled})
          </button>
        </div>
      </div>

      {/* Liste des Tickets Historiques */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Ticket className="w-8 h-8 opacity-60" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base sm:text-lg font-black text-slate-900">
              {historyTickets.length === 0
                ? 'Aucune réservation enregistrée sur cet appareil'
                : 'Aucun ticket ne correspond à vos filtres'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {historyTickets.length === 0
                ? 'Vos réservations de repas validées entre 08h00 et 10h00 sont automatiquement enregistrées dans le stockage local de votre navigateur pour vous permettre de retrouver vos anciens tickets à tout moment.'
                : 'Essayez de modifier votre terme de recherche ou sélectionnez le filtre « Tous ».'}
            </p>
          </div>
          {historyTickets.length === 0 && (
            <button
              type="button"
              onClick={onBackToMenu}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition shadow-xs"
            >
              <Utensils className="w-4 h-4" />
              <span>Réserver mon repas aujourd'hui</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTickets.map((ticket) => {
            const isToday = ticket.date === todayDateStr;
            const { plat, entree, dessert } = getDishDetails(ticket);

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isToday
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/15'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Info Date & Badge */}
                <div className="space-y-2 min-w-0 md:w-1/3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{formatDate(ticket.date || todayDateStr)}</span>
                    </span>

                    {isToday && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aujourd'hui
                      </span>
                    )}

                    {ticket.status === 'served' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>Repas Consommé</span>
                      </span>
                    ) : ticket.status === 'confirmed' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Confirmé (En attente)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Annulé</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {ticket.ticketCode || `#${ticket.id.slice(-6)}`}
                    </span>
                    <span>&bull;</span>
                    <span>Créneau : {ticket.timeSlot}</span>
                  </div>

                  {ticket.dietaryNotes && (
                    <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-flex items-center gap-1.5 max-w-full truncate">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{ticket.dietaryNotes}</span>
                    </div>
                  )}
                </div>

                {/* Composition du Plateau */}
                <div className="flex-1 space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-14 shrink-0">Plat :</span>
                    {plat?.imageUrl && (
                      <img
                        src={plat.imageUrl}
                        alt=""
                        className="w-5 h-5 rounded object-cover shrink-0 border border-slate-200"
                      />
                    )}
                    <span className="font-black text-slate-900 truncate">
                      {plat ? plat.name : 'Plat du jour'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-400 w-14 shrink-0">Entrée :</span>
                    {entree?.imageUrl && (
                      <img
                        src={entree.imageUrl}
                        alt=""
                        className="w-4 h-4 rounded object-cover shrink-0 border border-slate-200"
                      />
                    )}
                    <span className="truncate">{entree ? entree.name : '-'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-400 w-14 shrink-0">Dessert :</span>
                    {dessert?.imageUrl && (
                      <img
                        src={dessert.imageUrl}
                        alt=""
                        className="w-4 h-4 rounded object-cover shrink-0 border border-slate-200"
                      />
                    )}
                    <span className="truncate">{dessert ? dessert.name : '-'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketForModal(ticket)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                    title="Voir les détails complets du ticket avec QR Code"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Voir le ticket</span>
                  </button>

                  {isToday && ticket.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => onSelectTicket(ticket)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition"
                      title="Aller à l'écran du ticket actif du jour"
                    >
                      <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ticket actif</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'affichage du ticket individuel avec QR Code */}
      {selectedTicketForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Ticket de Réservation #{selectedTicketForModal.ticketCode || selectedTicketForModal.id.slice(-6)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <ReservationTicketCard
              reservation={selectedTicketForModal}
              menu={currentMenu}
              settings={settings}
              timeStatus={timeStatus}
              onCancelSuccess={() => {
                setSelectedTicketForModal(null);
                if (onCancelSuccess) onCancelSuccess();
              }}
              onNewReservation={() => {
                setSelectedTicketForModal(null);
                onBackToMenu();
              }}
              onMealConfirmed={(updated) => {
                setSelectedTicketForModal(updated);
                if (onMealConfirmed) onMealConfirmed(updated);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
