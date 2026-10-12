import * as XLSX from 'xlsx';
import { Reservation, DailyMenu, AppSettings } from '../types';
import { formatFrenchDate } from './timeUtils';

export function exportReservationsToExcel(
  reservations: Reservation[],
  menu: DailyMenu,
  settings: AppSettings,
  dateStr: string
) {
  // 1. Feuille principale : Liste détaillée des inscrits
  const confirmedList = reservations.filter((r) => r.status !== 'cancelled');

  const rowsData = reservations.map((r) => {
    const plat = menu.plats.find((p) => p.id === r.selectedPlatId);
    const entree = menu.entrees.find((e) => e.id === r.selectedEntreeId);
    const dessert = menu.desserts.find((d) => d.id === r.selectedDessertId);

    const servedTimeStr = r.servedAt
      ? new Date(r.servedAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return {
      'N° Retrait': r.ticketCode,
      'Nom et Prénom': r.staffName,
      'Service / Pôle': r.staffDepartment,
      'Email professionnel': r.staffEmail || '',
      'Plat principal': plat ? plat.name : 'Plat du jour',
      'Option Végétarienne': plat?.isVegetarian ? 'OUI' : 'NON',
      'Entrée': entree ? entree.name : '-',
      'Dessert': dessert ? dessert.name : '-',
      'Créneau horaire': r.timeSlot,
      'Précisions diététiques': r.dietaryNotes || 'Aucune',
      'Statut du repas':
        r.status === 'served' ? 'SERVI' : r.status === 'cancelled' ? 'ANNULÉ' : 'CONFIRMÉ',
      'Heure de passage / émargement': servedTimeStr,
      'Horodatage réservation': new Date(r.createdAt).toLocaleString('fr-FR'),
    };
  });

  const wsInscrits = XLSX.utils.json_to_sheet(rowsData);

  // Largeurs de colonnes optimisées
  wsInscrits['!cols'] = [
    { wch: 12 }, // N° Retrait
    { wch: 22 }, // Nom
    { wch: 26 }, // Service
    { wch: 26 }, // Email
    { wch: 35 }, // Plat
    { wch: 18 }, // Option Végé
    { wch: 30 }, // Entrée
    { wch: 28 }, // Dessert
    { wch: 16 }, // Créneau
    { wch: 26 }, // Remarques
    { wch: 14 }, // Statut
    { wch: 24 }, // Heure service
    { wch: 22 }, // Horodatage
  ];

  // 2. Feuille Synthèse Cuisine & Statistiques
  const dishesCounts: Record<string, { name: string; isVeg: string; count: number }> = {};
  menu.plats.forEach((p) => {
    dishesCounts[p.id] = { name: p.name, isVeg: p.isVegetarian ? 'OUI' : 'NON', count: 0 };
  });

  confirmedList.forEach((r) => {
    if (dishesCounts[r.selectedPlatId]) {
      dishesCounts[r.selectedPlatId].count += 1;
    }
  });

  const deptCounts: Record<string, number> = {};
  confirmedList.forEach((r) => {
    deptCounts[r.staffDepartment] = (deptCounts[r.staffDepartment] || 0) + 1;
  });

  const summaryData = [
    { 'Métrique': 'Établissement', 'Valeur': settings.establishmentName },
    { 'Métrique': 'Date du service', 'Valeur': formatFrenchDate(dateStr) },
    { 'Métrique': 'Plage horaire cantine', 'Valeur': settings.serviceHours },
    { 'Métrique': 'Plage de réservation', 'Valeur': `${settings.bookingWindowStart} - ${settings.bookingWindowEnd}` },
    { 'Métrique': 'Capacité maximale (couverts)', 'Valeur': settings.capacityPerDay },
    { 'Métrique': 'Total réservations actives', 'Valeur': confirmedList.length },
    { 'Métrique': 'Repas déjà servis / émargés', 'Valeur': confirmedList.filter((r) => r.status === 'served').length },
    { 'Métrique': 'Repas restants à servir', 'Valeur': confirmedList.filter((r) => r.status !== 'served').length },
    { 'Métrique': 'Places restantes libres', 'Valeur': Math.max(0, settings.capacityPerDay - confirmedList.length) },
    { 'Métrique': 'Taux d’occupation', 'Valeur': `${Math.round((confirmedList.length / settings.capacityPerDay) * 100)} %` },
    { 'Métrique': '', 'Valeur': '' },
    { 'Métrique': '--- RÉPARTITION PAR PLAT CHAUD ---', 'Valeur': '--- PORTIONS À PRODUIRE ---' },
    ...Object.values(dishesCounts).map((item) => ({
      'Métrique': `${item.name} (${item.isVeg === 'OUI' ? 'Végétarien' : 'Classique'})`,
      'Valeur': item.count,
    })),
    { 'Métrique': '', 'Valeur': '' },
    { 'Métrique': '--- RÉPARTITION PAR SERVICE / PÔLE ---', 'Valeur': '--- EFFECTIFS ---' },
    ...Object.entries(deptCounts).map(([dept, cnt]) => ({
      'Métrique': dept,
      'Valeur': cnt,
    })),
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 30 }];

  // 3. Construction du classeur Excel (.xlsx)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInscrits, 'Inscrits du Jour');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse Cuisine & Stats');

  // 4. Téléchargement direct
  const filename = `repas_personnel_${settings.establishmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
