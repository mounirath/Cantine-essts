import { Reservation } from '../types';

const STORAGE_KEY = 'mensa_staff_reservations_history';
const LAST_TICKET_KEY = 'mensa_last_ticket_id';

/**
 * Récupère l'historique complet des tickets de réservation persistés en local storage
 */
export function getPersistedTicketHistory(): Reservation[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    
    // Trier par date puis heure décroissante (plus récent en premier)
    return list.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const timeA = a.createdAt || '';
      const timeB = b.createdAt || '';
      return timeB.localeCompare(timeA);
    });
  } catch (err) {
    console.warn('Erreur lecture historique tickets localStorage:', err);
    return [];
  }
}

/**
 * Sauvegarde la liste complète dans le stockage local
 */
export function savePersistedTicketHistory(tickets: Reservation[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Erreur écriture historique tickets localStorage:', err);
  }
}

/**
 * Ajoute ou met à jour une réservation dans l'historique local
 */
export function persistTicket(ticket: Reservation): void {
  if (!ticket || !ticket.id) return;
  const current = getPersistedTicketHistory();
  const existingIdx = current.findIndex((t) => t.id === ticket.id);

  let updated: Reservation[];
  if (existingIdx >= 0) {
    // Mise à jour de l'existant
    updated = current.map((t, idx) => (idx === existingIdx ? { ...t, ...ticket } : t));
  } else {
    // Ajout en tête
    updated = [ticket, ...current];
  }

  savePersistedTicketHistory(updated);
  // Maintenir également la référence du dernier ticket
  try {
    localStorage.setItem(LAST_TICKET_KEY, ticket.id);
  } catch {}
}

/**
 * Met à jour le statut d'un ticket spécifique dans l'historique
 */
export function updatePersistedTicketStatus(
  ticketId: string,
  status: Reservation['status'],
  servedAt?: string
): void {
  const current = getPersistedTicketHistory();
  const updated = current.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status,
          servedAt: servedAt || t.servedAt || (status === 'served' ? new Date().toISOString() : undefined),
        }
      : t
  );
  savePersistedTicketHistory(updated);
}

/**
 * Supprime un ticket de l'historique
 */
export function removePersistedTicket(ticketId: string): void {
  const current = getPersistedTicketHistory();
  const filtered = current.filter((t) => t.id !== ticketId);
  savePersistedTicketHistory(filtered);
}

/**
 * Synchronise les tickets locaux avec les réservations distantes reçues du serveur
 */
export function syncPersistedHistory(remoteReservations: Reservation[]): Reservation[] {
  const current = getPersistedTicketHistory();
  let changed = false;

  const merged = current.map((local) => {
    const remote = remoteReservations.find((r) => r.id === local.id);
    if (remote && (remote.status !== local.status || remote.servedAt !== local.servedAt)) {
      changed = true;
      return { ...local, status: remote.status, servedAt: remote.servedAt || local.servedAt };
    }
    return local;
  });

  if (changed) {
    savePersistedTicketHistory(merged);
  }
  return merged;
}

/**
 * Vide l'historique local
 */
export function clearPersistedHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(STORAGE_KEY);
}
