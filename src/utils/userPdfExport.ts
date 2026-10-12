import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { AuthorizedUser } from '../types';

/**
 * Builds the direct booking URL embedded inside the QR Code.
 * When scanned by any smartphone camera, this link opens the app and pre-fills
 * the reservation form instantly without typing any information.
 */
export const getUserBookingUrl = (user: AuthorizedUser): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanOrigin = origin.replace(/\/+$/, '');
    const cleanPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
    const params = new URLSearchParams({
      badge: user.badgeNumber,
      name: user.fullName,
      dept: user.department,
    });
    return `${cleanOrigin}${cleanPath}?${params.toString()}`;
  }
  return `?badge=${encodeURIComponent(user.badgeNumber)}`;
};

/**
 * Generates a base64 PNG data URL for a user's QR code.
 */
export const generateUserQrDataUrl = async (
  user: AuthorizedUser,
  size: number = 300
): Promise<string> => {
  const payload = getUserBookingUrl(user);
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a', // Deep slate for high contrast scanning
      light: '#ffffff',
    },
  });
};

/**
 * Downloads a standalone PNG file of the user's QR code, formatted with badge & name label.
 */
export const downloadUserQrCodePNG = async (user: AuthorizedUser) => {
  const qrDataUrl = await generateUserQrDataUrl(user, 600);

  // Render on a clean branded card canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cardWidth = 600;
  const cardHeight = 740;
  canvas.width = cardWidth;
  canvas.height = cardHeight;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Top header banner
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, 0, cardWidth, 80);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESSTS CANTEEN • BADGE RESTAURATION', cardWidth / 2, 48);

  // Load and draw QR code
  const img = new Image();
  img.src = qrDataUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const qrSize = 440;
  const qrX = (cardWidth - qrSize) / 2;
  const qrY = 100;
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  // User info banner below QR
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(user.fullName, cardWidth / 2, 580);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(user.role || 'Personnel Officiel', cardWidth / 2, 612);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`${user.department}  •  Matricule: ${user.badgeNumber}`, cardWidth / 2, 642);

  // Instruction footer
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('⚡ Scannez pour réserver sans saisir vos informations', cardWidth / 2, 695);

  // Trigger download
  const link = document.createElement('a');
  link.download = `QR_Badge_${user.badgeNumber}_${user.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports a printable A4 PDF containing an elegant grid of employee badge cards (6 per page)
 * Each badge has:
 * - Institutional header (ESSTS Canteen)
 * - Agent Name, Role, Department, Matricule
 * - High-definition individual QR code for zero-typing reservations
 * - Cut guides for printing, laminating, and distributing
 */
export const exportUsersBadgesGridPDF = async (
  users: AuthorizedUser[],
  options: {
    institutionName?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
) => {
  if (!users || users.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const marginTop = 26;

  const cardWidth = 89;
  const cardHeight = 76;
  const gapX = 8;
  const gapY = 8;
  const cardsPerPage = 6; // 2 columns x 3 rows

  const totalPages = Math.ceil(users.length / cardsPerPage);
  const institution = options.institutionName || 'ÉCOLE SUPÉRIEURE EN SCIENCES ET TECHNOLOGIES DU SPORT (ESSTS)';
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Pre-generate QR codes
  const qrMap = new Map<string, string>();
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (options.onProgress) {
      options.onProgress(i + 1, users.length);
    }
    const qr = await generateUserQrDataUrl(u, 280);
    qrMap.set(u.id || u.badgeNumber, qr);
  }

  for (let i = 0; i < users.length; i++) {
    const pageIndex = Math.floor(i / cardsPerPage);
    const cardIndexOnPage = i % cardsPerPage;

    if (i > 0 && cardIndexOnPage === 0) {
      doc.addPage();
    }

    // Page Header
    if (cardIndexOnPage === 0) {
      // Top Emerald Line
      doc.setFillColor(5, 150, 105); // #059669
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', pageWidth / 2, 10, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105);
      doc.text(institution, pageWidth / 2, 15, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `RESTAURANT ADMINISTRATIF • CARTES & BADGES AVEC QR CODE DE RÉSERVATION • ${dateStr}`,
        pageWidth / 2,
        19.5,
        { align: 'center' }
      );

      // Thin separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 22, pageWidth - marginX, 22);

      // Page Footer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Scannez le QR Code avec un smartphone ou à la borne cantine pour réserver instantanément sans saisie.',
        marginX,
        pageHeight - 8
      );
      doc.text(`Page ${pageIndex + 1} / ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
        align: 'right',
      });
    }

    // Coordinates for this card
    const col = cardIndexOnPage % 2;
    const row = Math.floor(cardIndexOnPage / 2);
    const x = marginX + col * (cardWidth + gapX);
    const y = marginTop + row * (cardHeight + gapY);

    const user = users[i];
    const qrDataUrl = qrMap.get(user.id || user.badgeNumber);

    // Card background & rounded border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // #cbd5e1
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

    // Card top mini banner
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(x, y, cardWidth, 8, 3, 3, 'F');
    // Square bottom of banner
    doc.rect(x, y + 5, cardWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('ESSTS CANTEEN • BADGE OFFICIEL', x + cardWidth / 2, y + 5.5, { align: 'center' });

    // LEFT SECTION: Text details
    const textLeft = x + 3.5;
    const textWidth = cardWidth - 36; // leave room for 30mm QR code

    // Full Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const displayName = user.fullName || `${user.lastName || ''} ${user.firstName || ''}`.trim();
    const truncatedName = doc.splitTextToSize(displayName, textWidth)[0] || displayName;
    doc.text(truncatedName, textLeft, y + 15);

    // Role
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235); // #2563eb
    const roleText = user.role || 'Personnel';
    const truncatedRole = doc.splitTextToSize(roleText, textWidth)[0] || roleText;
    doc.text(truncatedRole, textLeft, y + 20);

    // Department
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105); // #475569
    const deptLines = doc.splitTextToSize(user.department || 'Service Général', textWidth);
    doc.text(deptLines.slice(0, 2), textLeft, y + 24.5);

    // Matricule / Badge pill
    const badgeY = y + 34;
    doc.setFillColor(241, 245, 249); // #f1f5f9
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(textLeft, badgeY, textWidth - 2, 7.5, 1.5, 1.5, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`MATRICULE: ${user.badgeNumber}`, textLeft + 2, badgeY + 5);

    // Email if present
    if (user.email) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      const emailLine = doc.splitTextToSize(user.email, textWidth)[0];
      doc.text(emailLine, textLeft, badgeY + 11.5);
    }

    // Status pill
    const statusY = y + 50;
    doc.setFillColor(236, 253, 245); // #ecfdf5
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(textLeft, statusY, 26, 5, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('● ACCÈS AUTORISÉ', textLeft + 2, statusY + 3.6);

    // Prompt instructions under text
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Réservation 08h-10h • Sans saisie', textLeft, y + 71);

    // RIGHT SECTION: QR Code
    if (qrDataUrl) {
      const qrSize = 30;
      const qrX = x + cardWidth - qrSize - 3.5;
      const qrY = y + 13;

      // QR container box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1.5, 1.5, 'FD');

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Scan instruction below QR code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(5, 150, 105);
      doc.text('SCANNER LE QR', qrX + qrSize / 2, qrY + qrSize + 4.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(100, 116, 139);
      doc.text('POUR RÉSERVER', qrX + qrSize / 2, qrY + qrSize + 7.5, { align: 'center' });
    }

    // Outer cut guideline marker (dashed corner)
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 2], 0);
    doc.rect(x - 1, y - 1, cardWidth + 2, cardHeight + 2);
    doc.setLineDashPattern([], 0); // reset
  }

  const filename = `Badges_Personnel_ESSTS_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

/**
 * Exports a comprehensive list table in A4 PDF format with a QR code thumbnail in each row.
 * Perfect for canteen administration, kitchen roster, and check-in desk.
 */
export const exportUsersListTablePDF = async (
  users: AuthorizedUser[],
  options: {
    institutionName?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
) => {
  if (!users || users.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const rowsPerPage = 10;
  const totalPages = Math.ceil(users.length / rowsPerPage);
  const institution = options.institutionName || 'ÉCOLE SUPÉRIEURE EN SCIENCES ET TECHNOLOGIES DU SPORT (ESSTS)';
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Pre-generate QR codes
  const qrMap = new Map<string, string>();
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (options.onProgress) {
      options.onProgress(i + 1, users.length);
    }
    const qr = await generateUserQrDataUrl(u, 200);
    qrMap.set(u.id || u.badgeNumber, qr);
  }

  const colX = {
    num: marginX,
    badge: marginX + 10,
    name: marginX + 32,
    role: marginX + 80,
    dept: marginX + 120,
    qr: marginX + 165,
  };

  for (let i = 0; i < users.length; i++) {
    const pageIndex = Math.floor(i / rowsPerPage);
    const rowOnPage = i % rowsPerPage;

    if (i > 0 && rowOnPage === 0) {
      doc.addPage();
    }

    if (rowOnPage === 0) {
      // Header
      doc.setFillColor(5, 150, 105);
      doc.rect(0, 0, pageWidth, 5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', pageWidth / 2, 11, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105);
      doc.text(institution, pageWidth / 2, 17, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('REGISTRE DU PERSONNEL AUTORISÉ & CODES QR DE RÉSERVATION', pageWidth / 2, 23, {
        align: 'center',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Édité le ${dateStr} • Effectif total : ${users.length} agents`, pageWidth / 2, 27.5, {
        align: 'center',
      });

      // Table Header Row
      const tableHeadY = 32;
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, tableHeadY, pageWidth - 2 * marginX, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(marginX, tableHeadY, pageWidth - marginX, tableHeadY);
      doc.line(marginX, tableHeadY + 8, pageWidth - marginX, tableHeadY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      doc.text('N°', colX.num + 2, tableHeadY + 5.5);
      doc.text('MATRICULE', colX.badge, tableHeadY + 5.5);
      doc.text('NOM & PRÉNOM', colX.name, tableHeadY + 5.5);
      doc.text('FONCTION', colX.role, tableHeadY + 5.5);
      doc.text('SERVICE / PÔLE', colX.dept, tableHeadY + 5.5);
      doc.text('QR CODE RÉSERVATION', colX.qr, tableHeadY + 5.5);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Document officiel d’émargement cantine ESSTS', marginX, pageHeight - 8);
      doc.text(`Page ${pageIndex + 1} / ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
        align: 'right',
      });
    }

    // Row rendering
    const rowY = 40 + rowOnPage * 24;
    const user = users[i];
    const qrDataUrl = qrMap.get(user.id || user.badgeNumber);

    // Alternate background
    if (rowOnPage % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, rowY, pageWidth - 2 * marginX, 24, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(marginX, rowY + 24, pageWidth - marginX, rowY + 24);

    // Number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(String(i + 1), colX.num + 2, rowY + 12);

    // Matricule Badge
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(colX.badge, rowY + 6.5, 19, 7, 1, 1, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(user.badgeNumber, colX.badge + 2, rowY + 11.5);

    // Full Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const nameStr = doc.splitTextToSize(user.fullName, 45)[0];
    doc.text(nameStr, colX.name, rowY + 10);

    if (user.email) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const emailStr = doc.splitTextToSize(user.email, 45)[0];
      doc.text(emailStr, colX.name, rowY + 15);
    }

    // Role
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    const roleLines = doc.splitTextToSize(user.role || 'Personnel', 38);
    doc.text(roleLines.slice(0, 2), colX.role, rowY + 10);

    // Department
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const deptLines = doc.splitTextToSize(user.department, 42);
    doc.text(deptLines.slice(0, 2), colX.dept, rowY + 10);

    // QR Code Thumbnail (20 x 20 mm)
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', colX.qr + 2, rowY + 2, 20, 20);
    }
  }

  const filename = `Tableau_Personnel_QR_Codes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

/**
 * Exports a single employee's badge card as a high-resolution, full-page individual PDF.
 */
export const exportSingleUserBadgePDF = async (user: AuthorizedUser) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm
  });

  const pageWidth = 148;
  const pageHeight = 210;

  // Header band
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('ESSTS • BADGE OFFICIEL DE RESTAURATION', pageWidth / 2, 8, { align: 'center' });

  // Outer Card container
  const cardX = 14;
  const cardY = 22;
  const cardW = pageWidth - 28;
  const cardH = pageHeight - 44;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'FD');

  // Institution title inside card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', pageWidth / 2, cardY + 10, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text('ÉCOLE SUPÉRIEURE EN SCIENCES ET TECHNOLOGIES DU SPORT', pageWidth / 2, cardY + 16, {
    align: 'center',
  });

  // User Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(user.fullName, pageWidth / 2, cardY + 30, { align: 'center' });

  // Role
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(user.role || 'Personnel Officiel', pageWidth / 2, cardY + 37, { align: 'center' });

  // Department
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(user.department, pageWidth / 2, cardY + 44, { align: 'center' });

  // Matricule Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth / 2 - 35, cardY + 50, 70, 11, 2, 2, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`MATRICULE: ${user.badgeNumber}`, pageWidth / 2, cardY + 57.5, { align: 'center' });

  // Big QR Code
  const qrDataUrl = await generateUserQrDataUrl(user, 500);
  const qrSize = 65;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = cardY + 68;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, 'FD');
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Instruction text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text('⚡ SCANNEZ POUR RÉSERVER SANS SAISIE', pageWidth / 2, qrY + qrSize + 10, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Présentez ce QR Code devant la borne ou scannez-le depuis votre smartphone.',
    pageWidth / 2,
    qrY + qrSize + 16,
    { align: 'center' }
  );

  doc.text(
    'Vos coordonnées et préférences seront automatiquement renseignées.',
    pageWidth / 2,
    qrY + qrSize + 20,
    { align: 'center' }
  );

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Carte officielle de restauration • ESSTS Alger', pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });

  const filename = `Badge_Canteen_${user.badgeNumber}_${user.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};
