import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface PosterOptions {
  title: string;
  establishmentName: string;
  qrValue: string;
  type: 'pickup' | 'booking';
  serviceHours?: string;
  bookingHours?: string;
  pinCode?: string;
}

/**
 * Génère une URL de téléchargement PNG pour le QR Code seul en haute définition
 */
export async function generateQRCodePngUrl(value: string, size = 1024): Promise<string> {
  return await QRCode.toDataURL(value, {
    width: size,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Télécharge directement le QR Code en image PNG
 */
export async function downloadQRCodePng(value: string, filename = 'qr-code-cantine.png'): Promise<void> {
  const dataUrl = await generateQRCodePngUrl(value, 1024);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Génère et télécharge une affiche officielle A4 en PDF prête à imprimer
 */
export async function downloadCanteenPosterPdf(options: PosterOptions, filename = 'affiche-comptoir-cantine.pdf'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm

  // Header band
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(options.establishmentName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RESTAURATION DES ÉTUDIANTS & SERVICES', pageWidth / 2, 21, { align: 'center' });

  // Border frame
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.8);
  doc.roundedRect(12, 32, pageWidth - 24, pageHeight - 44, 4, 4);

  // Badge
  const isPickup = options.type === 'pickup';
  doc.setFillColor(isPickup ? 16 : 37, isPickup ? 185 : 99, isPickup ? 129 : 235);
  doc.roundedRect(pageWidth / 2 - 50, 40, 100, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    isPickup ? 'COMPTOIR CANTINE - RETRAIT DU REPAS' : 'RESERVATION DU REPAS DU JOUR',
    pageWidth / 2,
    46.5,
    { align: 'center' }
  );

  // Big Title
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isPickup ? 'Scannez pour valider votre plateau' : 'Scannez pour réserver votre repas',
    pageWidth / 2,
    62,
    { align: 'center' }
  );

  // Subtitle / Hours
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (isPickup && options.serviceHours) {
    doc.text(`Horaires de distribution au comptoir : ${options.serviceHours}`, pageWidth / 2, 70, { align: 'center' });
  } else if (!isPickup && options.bookingHours) {
    doc.text(`Créneau de commande en ligne : ${options.bookingHours}`, pageWidth / 2, 70, { align: 'center' });
  }

  // Generate QR Code image
  const qrDataUrl = await generateQRCodePngUrl(options.qrValue, 800);
  const qrSize = 90; // mm
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 78;

  // White box with shadow for QR
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, 'FD');
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Instructions Box
  const instrY = qrY + qrSize + 12;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(24, instrY, pageWidth - 48, 48, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMENT FAIRE ?', 32, instrY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);

  if (isPickup) {
    doc.text('1. Ouvrez MensaStaff sur votre smartphone ou tablette.', 32, instrY + 19);
    doc.text('2. Sur votre ticket de réservation, touchez « Scanner le QR Code de la cantine ».', 32, instrY + 27);
    doc.text('3. Pointez la caméra vers ce QR Code pour valider votre plateau.', 32, instrY + 35);
    doc.text('4. Récupérez votre repas chaud auprès de l’équipe de cuisine.', 32, instrY + 43);
  } else {
    doc.text('1. Ouvrez l’appareil photo ou le scanner de votre smartphone.', 32, instrY + 19);
    doc.text('2. Scannez le QR Code ci-dessus pour ouvrir le menu du jour.', 32, instrY + 27);
    doc.text('3. Choisissez votre plat, entrée et dessert, puis validez.', 32, instrY + 35);
    doc.text('4. Votre ticket numérique avec QR Code individuel est immédiatement généré.', 32, instrY + 43);
  }

  // PIN de secours (if pickup)
  if (isPickup && options.pinCode) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth / 2 - 45, instrY + 54, 90, 11, 2, 2, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.text('Code de secours : ', pageWidth / 2 - 20, instrY + 61, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(options.pinCode, pageWidth / 2 - 18, instrY + 61);
  }

  // Footer note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Affiche officielle générée par MensaStaff • ${options.establishmentName}`,
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );

  doc.save(filename);
}

/**
 * Génère et télécharge une affiche haute résolution en image PNG (pratique pour l'impression ou l'affichage sur écran)
 */
export async function downloadCanteenPosterImage(options: PosterOptions, filename = 'affiche-comptoir-cantine.png'): Promise<void> {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1600;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#f0fdf4');
  bgGrad.addColorStop(0.3, '#ffffff');
  bgGrad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Top header bar
  ctx.fillStyle = '#059669';
  ctx.fillRect(32, 32, width - 64, 130);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(options.establishmentName.toUpperCase(), width / 2, 95);
  ctx.font = '24px sans-serif';
  ctx.fillText('RESTAURATION DES ÉTUDIANTS & SERVICES', width / 2, 135);

  const isPickup = options.type === 'pickup';

  // Badge
  ctx.fillStyle = isPickup ? '#047857' : '#2563eb';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 280, 210, 560, 60, 30);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(
    isPickup ? '🍽️ COMPTOIR CANTINE • RETRAIT DU REPAS' : '📱 RÉSERVATION DU REPAS DU JOUR',
    width / 2,
    250
  );

  // Main Call to action
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 52px sans-serif';
  ctx.fillText(
    isPickup ? 'Scannez pour valider votre repas' : 'Scannez pour réserver votre repas',
    width / 2,
    330
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '30px sans-serif';
  if (isPickup && options.serviceHours) {
    ctx.fillText(`Horaires de distribution au comptoir : ${options.serviceHours}`, width / 2, 380);
  } else if (!isPickup && options.bookingHours) {
    ctx.fillText(`Créneau de commande : ${options.bookingHours}`, width / 2, 380);
  }

  // Draw QR code
  const qrDataUrl = await generateQRCodePngUrl(options.qrValue, 800);
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 560;
  const qrX = (width - qrSize) / 2;
  const qrY = 440;

  // QR background card
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 32);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Instructions card
  const instrY = 1110;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(100, instrY, width - 200, 260, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('💡 COMMENT FAIRE ?', 140, instrY + 50);

  ctx.fillStyle = '#1e293b';
  ctx.font = '26px sans-serif';
  if (isPickup) {
    ctx.fillText('1. Ouvrez MensaStaff sur votre smartphone ou tablette.', 140, instrY + 105);
    ctx.fillText('2. Sur votre ticket, cliquez sur « Scanner le QR Code de la cantine ».', 140, instrY + 155);
    ctx.fillText('3. Pointez votre caméra vers ce QR code pour valider votre plateau.', 140, instrY + 205);
  } else {
    ctx.fillText('1. Ouvrez l’appareil photo ou le scanner de votre smartphone.', 140, instrY + 105);
    ctx.fillText('2. Scannez ce QR Code pour accéder directement à la cantine.', 140, instrY + 155);
    ctx.fillText('3. Choisissez votre menu et confirmez votre réservation en 1 clic.', 140, instrY + 205);
  }

  // Backup PIN
  if (isPickup && options.pinCode) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 250, 1400, 500, 55, 16);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Code manuel de secours : `, width / 2 - 80, 1438);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(options.pinCode, width / 2 + 130, 1438);
  }

  // Bottom footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px sans-serif';
  ctx.fillText(
    `Affiche comptoir officielle • MensaStaff • ${options.establishmentName}`,
    width / 2,
    1530
  );

  // Trigger download
  const imageUri = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
