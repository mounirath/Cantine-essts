/**
 * Constantes et utilitaires pour le QR Code de distribution de la Cantine
 */
export const CANTEEN_COUNTER_QR_VALUE = 'CANTEEN-COUNTER:ESSTS-RESTAURATION:DISTRIBUTION';
export const CANTEEN_COUNTER_PIN = 'CANTINE-ESSTS-2026';

/**
 * Vérifie si le texte scanné ou saisi correspond au QR Code de la cantine
 */
export function isCanteenCounterCode(scannedText: string): boolean {
  if (!scannedText) return false;
  const clean = scannedText.trim();
  return (
    clean === CANTEEN_COUNTER_QR_VALUE ||
    clean === CANTEEN_COUNTER_PIN ||
    clean.toUpperCase().includes('CANTEEN-COUNTER') ||
    clean.toUpperCase().includes('CANTINE-ESSTS') ||
    clean.toUpperCase().includes('ESSTS-RESTAURATION')
  );
}
