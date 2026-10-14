export type Language = 'fr' | 'ar';

export interface Translations {
  // Global & Brand
  appName: string;
  appSubname: string;
  establishmentRole: string;
  staffCatering: string;
  loading: string;
  connectingDb: string;

  // Navbar
  menuAndBooking: string;
  menuShort: string;
  myTicket: string;
  history: string;
  historyShort: string;
  scanMeal: string;
  scanShort: string;
  qrAccess: string;
  qrShort: string;
  admin: string;
  adminShort: string;
  bookingsOpen: string;
  bookingsClosed: string;

  // Simulator
  simulatorTitle: string;
  realClock: string;
  simulationMode: string;
  simulationActiveNotice: string;
  testTimeSlots: string;
  backToRealTime: string;
  customSimulation: string;
  quickTestSlots: string;
  slotBeforeOpen: string;
  slotInWindow: string;
  slotNearEnd: string;
  slotAfterWindow: string;
  slotServiceLunch: string;

  // Time Banner
  bannerOpenTitle: string;
  bannerOpenSubtitle: string;
  bannerTimeRemaining: string;
  bannerWindowLabel: string;
  bannerPendingTitle: string;
  bannerCurrentTime: string;
  bannerPendingSubtitle: string;
  bannerSimulateBtn: string;
  bannerClosedTitle: string;
  bannerClosedSubtitle: string;
  serviceHoursLabel: string;

  // Menu Display
  dailyMenuTitle: string;
  featuredDishBadge: string;
  chooseThisDish: string;
  dishOfTheDaySelected: string;
  entreesTitle: string;
  entreesSubtitle: string;
  platsTitle: string;
  platsSubtitle: string;
  dessertsTitle: string;
  dessertsSubtitle: string;
  drinksAndBreadTitle: string;
  drinksAndBreadSubtitle: string;
  allergensLabel: string;
  vegetarianBadge: string;
  caloriesLabel: string;
  includedInFormula: string;
  freshBreadOption: string;
  waterBottleOption: string;

  // Reservation Form
  formTitle: string;
  formSubtitle: string;
  stepIdentity: string;
  stepMealType: string;
  stepMenuSelection: string;
  stepOptionsAndNotes: string;
  mealTypeLabel: string;
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  mealBreakfastDesc: string;
  mealLunchDesc: string;
  mealDinnerDesc: string;
  allMealTypes: string;
  breakfastItemsTitle: string;
  dinnerEntreesTitle: string;
  dinnerPlatsTitle: string;
  dinnerDessertsTitle: string;
  fullNameOrBadgeLabel: string;
  fullNameOrBadgePlaceholder: string;
  authorizedAgentBadge: string;
  authorizedAgentHint: string;
  departmentLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  chooseMainDishLabel: string;
  chooseEntreeLabel: string;
  chooseDessertLabel: string;
  breadLabel: string;
  drinkLabel: string;
  timeSlotLabel: string;
  dietaryNotesLabel: string;
  dietaryNotesPlaceholder: string;
  remainingCapacity: string;
  placesTotal: string;
  submitBookingBtn: string;
  submittingBtn: string;
  alreadyBookedError: string;
  outsideHoursError: string;
  capacityFullError: string;
  unauthorizedUserError: string;
  missingNameError: string;
  missingPlatError: string;

  // Ticket Card
  ticketTitle: string;
  ticketSubtitle: string;
  officialTicketValidated: string;
  pickupNumberLabel: string;
  presentAtCounterNotice: string;
  beneficiaryLabel: string;
  departmentTicketLabel: string;
  bookingDateLabel: string;
  timeSlotTicketLabel: string;
  mealCompositionLabel: string;
  mainDishTicket: string;
  entreeTicket: string;
  dessertTicket: string;
  breadTicket: string;
  drinkTicket: string;
  specialNotesTicket: string;
  statusConfirmed: string;
  statusServed: string;
  statusCancelled: string;
  printTicketBtn: string;
  cancelBookingBtn: string;
  newBookingBtn: string;
  confirmCancelPrompt: string;
  cancelSuccessNotice: string;

  // Scanner Modal
  scannerTitle: string;
  scannerSubtitle: string;
  startCamera: string;
  stopCamera: string;
  cameraActiveNotice: string;
  manualEntryTitle: string;
  manualEntryPlaceholder: string;
  validateManualBtn: string;
  mealConfirmedSuccess: string;
  alreadyServedWarning: string;
  ticketNotFoundOrCancelled: string;
  servingNowMeal: string;
  counterRecentServed: string;
  closeBtn: string;

  // QR Poster Modal
  posterTitle: string;
  posterSubtitle: string;
  posterInstructions: string;
  posterStep1: string;
  posterStep2: string;
  posterStep3: string;
  printPosterBtn: string;

  // Admin Login
  adminLoginTitle: string;
  adminLoginSubtitle: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  unlockAdminBtn: string;
  cancelBtn: string;
  incorrectPassword: string;
  quickFillDemoPassword: string;

  // Admin Dashboard
  adminDashboardTitle: string;
  logoutBtn: string;
  tabTodayReservations: string;
  tabMenusAndDishes: string;
  tabAuthorizedUsers: string;
  tabAttendanceStats: string;
  tabSettings: string;
  statTotalReservations: string;
  statMealsServed: string;
  statRemainingToServe: string;
  statCapacityRatio: string;
  exportExcelBtn: string;
  searchReservationPlaceholder: string;
  filterAllDepartments: string;
  filterAllStatuses: string;
  filterConfirmedOnly: string;
  filterServedOnly: string;
  filterCancelledOnly: string;
  colBeneficiary: string;
  colDepartment: string;
  colTimeSlot: string;
  colDish: string;
  colStatus: string;
  colActions: string;
  markAsServedBtn: string;
  actionServedDone: string;

  // Common
  today: string;
  save: string;
  delete: string;
  edit: string;
  confirm: string;
  back: string;
  languageName: string;
  switchLanguageTo: string;

  // Organized UX keys
  activeTicketNotice: string;
  viewMyTicketBtn: string;
  capacityProgress: string;
  placesRemainingCount: string;
  fullCapacityNotice: string;
  kitchenSummaryTitle: string;
  settingsGeneralTitle: string;
  settingsBrandingTitle: string;
  settingsDatabaseTitle: string;
  settingsSecurityTitle: string;
  settingsMaintenanceTitle: string;
  testSimulatorToggle: string;
  chooseDishAndBook: string;
  scrollToForm: string;
  quickSummary: string;

  // Manual User Management
  userManagementTitle: string;
  userManagementSubtitle: string;
  addUserBtn: string;
  editUserModalTitle: string;
  addUserModalTitle: string;
  userLastName: string;
  userFirstName: string;
  userRole: string;
  userBadgeNumber: string;
  userStatus: string;
  userStatusActive: string;
  userStatusSuspended: string;
  confirmDeleteUser: string;
  searchUserPlaceholder: string;
  noUsersFound: string;
  filterAllRoles: string;
  totalUsersCount: string;
  activeUsersCount: string;
  suspendedUsersCount: string;

  // Self-Registration & Approval
  registerBtn: string;
  registrationModalTitle: string;
  registrationSubtitle: string;
  submitRegistrationBtn: string;
  registrationSuccessTitle: string;
  registrationSuccessNotice: string;
  approvalStatusLabel: string;
  approvalPendingBadge: string;
  approvalApprovedBadge: string;
  approvalRejectedBadge: string;
  approveUserBtn: string;
  rejectUserBtn: string;
  pendingApprovalsNotice: string;
  filterAllApprovals: string;
  filterOnlyPending: string;
  filterOnlyApproved: string;
  filterOnlyRejected: string;
  // Export PDF & QR Badge
  exportPdfBtn: string;
  exportPdfBadges: string;
  exportPdfTable: string;
  badgeQrModalTitle: string;
  scanBadgeToBook: string;
  scanBadgeSubtitle: string;
  scanBadgeSuccess: string;
  individualBadgeBtn: string;

  // Weekly Trends & Predictions
  tabTrendsAndPredictions: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    appName: 'ESSTS Cantine',
    appSubname: 'MensaStaff',
    establishmentRole: 'École Supérieure des Sciences et Technologies du Sport',
    staffCatering: 'Restauration des étudiants',
    loading: 'Chargement du service de restauration...',
    connectingDb: 'Connexion à la base de données',

    menuAndBooking: 'Menu & Réservation',
    menuShort: 'Menu',
    myTicket: 'Mon Ticket',
    history: 'Historique des Réservations',
    historyShort: 'Historique',
    scanMeal: 'Scanner Repas',
    scanShort: 'Scan',
    qrAccess: 'Accès QR',
    qrShort: 'QR',
    admin: 'Administration',
    adminShort: 'Admin',
    bookingsOpen: 'Réservations Ouvertes',
    bookingsClosed: 'Réservations Closes',

    simulatorTitle: 'Mode Simulation d’horaire',
    realClock: 'Horloge système réelle',
    simulationMode: 'Mode Simulation d’horaire',
    simulationActiveNotice: 'Simulation active (pour tests de la règle 08h-10h)',
    testTimeSlots: 'Tester les créneaux',
    backToRealTime: 'Revenir à l’heure réelle',
    customSimulation: 'Simulation personnalisée',
    quickTestSlots: 'Créneaux de test rapide',
    slotBeforeOpen: 'Avant 08h00 (Fermé)',
    slotInWindow: '08h30 (En cours de réservation)',
    slotNearEnd: '09h55 (Fin imminente)',
    slotAfterWindow: '10h15 (Clôturé pour la cuisine)',
    slotServiceLunch: '12h30 (Service du midi)',

    bannerOpenTitle: 'RÉSERVATIONS OUVERTES',
    bannerOpenSubtitle: 'Vous pouvez composer et valider votre plateau-repas pour le service de ce midi.',
    bannerTimeRemaining: 'Temps restant avant clôture',
    bannerWindowLabel: 'Créneau : {start} - {end}',
    bannerPendingTitle: 'RÉSERVATIONS EN ATTENTE D’OUVERTURE',
    bannerCurrentTime: 'Il est actuellement {time}',
    bannerPendingSubtitle: 'La plateforme ouvrira STRICTEMENT à {start} jusqu’à {end}. Consultez le menu ci-dessous en attendant l’ouverture.',
    bannerSimulateBtn: 'Simuler 08h30 pour tester',
    bannerClosedTitle: 'RÉSERVATIONS CLOSES POUR AUJOURD’HUI',
    bannerClosedSubtitle: 'Le créneau de réservation (08h00 - 10h00) est terminé. Les effectifs ont été transmis au chef pour la préparation.',
    serviceHoursLabel: 'Service : {hours}',

    dailyMenuTitle: 'Menu du Jour',
    featuredDishBadge: '⭐ Plat du Jour Vedette',
    chooseThisDish: 'Choisir ce plat pour ma réservation',
    dishOfTheDaySelected: 'Plat du jour sélectionné',
    entreesTitle: 'Entrées & Salades',
    entreesSubtitle: 'Au choix (inclus dans la formule)',
    platsTitle: 'Plats Principaux',
    platsSubtitle: 'Sélectionnez votre plat chaud pour midi',
    dessertsTitle: 'Desserts & Fruits',
    dessertsSubtitle: 'Douceur de fin de repas',
    drinksAndBreadTitle: 'Pain & Boisson',
    drinksAndBreadSubtitle: 'Inclus avec chaque plateau',
    allergensLabel: 'Allergènes :',
    vegetarianBadge: 'Végétarien',
    caloriesLabel: 'kcal',
    includedInFormula: 'Inclus dans la formule',
    freshBreadOption: 'Pain individuel frais du jour',
    waterBottleOption: 'Eau minérale ou boisson au choix',

    formTitle: 'Formulaire de Réservation de Repas',
    formSubtitle: 'Renseignez vos coordonnées pour valider votre repas et obtenir votre ticket avec QR code.',
    stepIdentity: '1. Identification de l’agent',
    stepMealType: '2. Choix du service (Type de repas)',
    stepMenuSelection: '3. Choix de votre menu',
    stepOptionsAndNotes: '4. Options et remarques',
    mealTypeLabel: 'Service de restauration',
    mealBreakfast: 'Petit-déjeuner',
    mealLunch: 'Repas de midi (Déjeuner)',
    mealDinner: 'Dîner (Soir)',
    mealBreakfastDesc: 'Matin • 07h00 - 09h00',
    mealLunchDesc: 'Midi • 11h45 - 13h45',
    mealDinnerDesc: 'Soir • 19h00 - 21h00',
    allMealTypes: 'Tous les services',
    breakfastItemsTitle: 'Formules Petit-déjeuner',
    dinnerEntreesTitle: 'Entrées & Soupes du soir',
    dinnerPlatsTitle: 'Plats chauds du dîner',
    dinnerDessertsTitle: 'Desserts légers du soir',
    fullNameOrBadgeLabel: 'Nom complet ou Matricule',
    fullNameOrBadgePlaceholder: 'Rechercher par nom ou matricule (ex: AGT-001)...',
    authorizedAgentBadge: 'Agent habilité reconnu',
    authorizedAgentHint: 'Personnel officiel inscrit sur la liste autorisée',
    departmentLabel: 'Service / Département',
    emailLabel: 'Adresse email professionnelle (optionnel)',
    emailPlaceholder: 'prenom.nom@essts.dz',
    chooseMainDishLabel: 'Choix du Plat Chaud *',
    chooseEntreeLabel: 'Choix de l’Entrée',
    chooseDessertLabel: 'Choix du Dessert',
    breadLabel: 'Choix du Pain',
    drinkLabel: 'Choix de la Boisson',
    timeSlotLabel: 'Créneau de passage au réfectoire',
    dietaryNotesLabel: 'Régime spécifique ou remarques pour la cuisine',
    dietaryNotesPlaceholder: 'Ex: Sans sel, allergie spécifique, repas emporté...',
    remainingCapacity: 'Places restantes pour aujourd’hui',
    placesTotal: 'sur {total} couverts autorisés',
    submitBookingBtn: 'Valider ma réservation de repas',
    submittingBtn: 'Enregistrement en cours...',
    alreadyBookedError: 'Une réservation a déjà été effectuée pour cet agent aujourd’hui.',
    outsideHoursError: 'Les réservations sont fermées. Horaires autorisés : 08h00 - 10h00.',
    capacityFullError: 'La capacité maximale du réfectoire pour aujourd’hui a été atteinte.',
    unauthorizedUserError: 'Cet agent ne figure pas dans la liste du personnel autorisé.',
    missingNameError: 'Veuillez saisir votre nom ou matricule.',
    missingPlatError: 'Veuillez sélectionner un plat chaud.',

    ticketTitle: 'Votre Ticket de Déjeuner',
    ticketSubtitle: 'Présentez ce bon lors de votre passage au réfectoire pour récupérer votre plateau.',
    officialTicketValidated: 'Ticket Officiel Validé',
    pickupNumberLabel: 'N° Retrait',
    presentAtCounterNotice: 'Présentez ce QR Code au passe-plat pour valider la prise en charge de votre repas.',
    beneficiaryLabel: 'Bénéficiaire',
    departmentTicketLabel: 'Service / Pôle',
    bookingDateLabel: 'Date du repas',
    timeSlotTicketLabel: 'Créneau de passage',
    mealCompositionLabel: 'Composition du plateau',
    mainDishTicket: 'Plat chaud',
    entreeTicket: 'Entrée',
    dessertTicket: 'Dessert',
    breadTicket: 'Pain',
    drinkTicket: 'Boisson',
    specialNotesTicket: 'Remarques particulières',
    statusConfirmed: 'Confirmé (En attente de retrait)',
    statusServed: 'Servi au passe-plat',
    statusCancelled: 'Annulé',
    printTicketBtn: 'Imprimer le ticket',
    cancelBookingBtn: 'Annuler ma réservation',
    newBookingBtn: 'Effectuer une autre réservation',
    confirmCancelPrompt: 'Êtes-vous sûr de vouloir annuler votre réservation de repas ?',
    cancelSuccessNotice: 'Réservation annulée avec succès.',

    scannerTitle: 'Scanner de Passe-Plat (Distribution)',
    scannerSubtitle: 'Validation instantanée des tickets et confirmation du service des plateaux.',
    startCamera: 'Démarrer la caméra',
    stopCamera: 'Arrêter la caméra',
    cameraActiveNotice: 'Pointez la caméra vers le QR code du ticket de l’agent.',
    manualEntryTitle: 'Validation manuelle (N° Retrait ou Matricule)',
    manualEntryPlaceholder: 'Saisir le N° de retrait (ex: R-101) ou le matricule...',
    validateManualBtn: 'Valider le plateau',
    mealConfirmedSuccess: 'Plateau validé avec succès ! Bon appétit !',
    alreadyServedWarning: 'Attention : Ce plateau a déjà été distribué !',
    ticketNotFoundOrCancelled: 'Ticket introuvable ou réservation annulée.',
    servingNowMeal: 'Menu sélectionné pour cet agent :',
    counterRecentServed: 'Derniers plateaux servis aujourd’hui',
    closeBtn: 'Fermer',

    posterTitle: 'Affiche QR Code pour la Cantine',
    posterSubtitle: 'À imprimer et afficher à l’entrée de l’établissement ou au réfectoire.',
    posterInstructions: 'Les membres du personnel peuvent scanner ce code avec leur smartphone pour réserver leur repas entre 08h00 et 10h00.',
    posterStep1: '1. Flashez le QR Code avec votre appareil photo',
    posterStep2: '2. Choisissez votre menu du jour entre 08h et 10h',
    posterStep3: '3. Récupérez votre plateau au réfectoire avec votre ticket',
    printPosterBtn: 'Imprimer l’affiche A4',

    adminLoginTitle: 'Accès Administration',
    adminLoginSubtitle: 'Zone réservée aux gestionnaires de la restauration et intendants pour la gestion des menus et des inscrits.',
    passwordLabel: 'Mot de passe administrateur',
    passwordPlaceholder: 'Entrez le mot de passe...',
    unlockAdminBtn: 'Déverrouiller l’espace admin',
    cancelBtn: 'Annuler',
    incorrectPassword: 'Mot de passe incorrect.',
    quickFillDemoPassword: 'Remplir le mot de passe de démonstration (admin123)',

    adminDashboardTitle: 'Tableau de Bord - Restauration Collective',
    logoutBtn: 'Déconnexion',
    tabTodayReservations: 'Inscrits du Jour',
    tabMenusAndDishes: 'Menus & Plats',
    tabAuthorizedUsers: 'Personnel Autorisé',
    tabAttendanceStats: 'Statistiques de Fréquentation',
    tabSettings: 'Paramètres',
    statTotalReservations: 'Total Inscrits',
    statMealsServed: 'Plateaux Servis',
    statRemainingToServe: 'En Attente',
    statCapacityRatio: 'Capacité Atteinte',
    exportExcelBtn: 'Exporter vers Excel (.xlsx)',
    searchReservationPlaceholder: 'Rechercher un inscrit (nom, matricule, ticket)...',
    filterAllDepartments: 'Tous les départements',
    filterAllStatuses: 'Tous les statuts',
    filterConfirmedOnly: 'Confirmés',
    filterServedOnly: 'Servis',
    filterCancelledOnly: 'Annulés',
    colBeneficiary: 'Agent / Bénéficiaire',
    colDepartment: 'Département',
    colTimeSlot: 'Créneau',
    colDish: 'Plat choisi',
    colStatus: 'Statut',
    colActions: 'Actions',
    markAsServedBtn: 'Marquer servi',
    actionServedDone: 'Déjà servi',

    today: 'Aujourd’hui',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    confirm: 'Confirmer',
    back: 'Retour',
    languageName: 'Français',
    switchLanguageTo: 'Passer en Arabe (العربية)',

    // Organized UX keys
    activeTicketNotice: 'Vous avez déjà validé votre réservation pour aujourd’hui !',
    viewMyTicketBtn: 'Consulter mon Ticket & QR Code',
    capacityProgress: '{count} sur {total} places réservées',
    placesRemainingCount: '{count} places encore disponibles',
    fullCapacityNotice: 'Capacité maximale atteinte pour aujourd’hui',
    kitchenSummaryTitle: 'Synthèse de production cuisine',
    settingsGeneralTitle: 'Établissement & Horaires de Réservation',
    settingsBrandingTitle: 'Identité Visuelle & Logo Officiel',
    settingsDatabaseTitle: 'Base de Données Cloud (Supabase)',
    settingsSecurityTitle: 'Sécurité & Mot de Passe Admin',
    settingsMaintenanceTitle: 'Maintenance & Données de Démonstration',
    testSimulatorToggle: 'Simulateur d’heure',
    chooseDishAndBook: 'Choisir ce plat & Réserver',
    scrollToForm: 'Accéder au formulaire de réservation',
    quickSummary: 'Aperçu rapide',

    // Manual User Management
    userManagementTitle: 'Gestion du Personnel Autorisé (Whitelist)',
    userManagementSubtitle: 'Gestion manuelle des utilisateurs : ajout, suppression, modification du nom, prénom et de la fonction.',
    addUserBtn: 'Ajouter un agent',
    editUserModalTitle: 'Modifier l’agent',
    addUserModalTitle: 'Ajouter manuellement un agent',
    userLastName: 'Nom',
    userFirstName: 'Prénom',
    userRole: 'Fonction / Poste',
    userBadgeNumber: 'Matricule / Badge',
    userStatus: 'Statut d’accès',
    userStatusActive: 'Autorisé (Actif)',
    userStatusSuspended: 'Suspendu (Inactif)',
    confirmDeleteUser: 'Êtes-vous sûr de vouloir supprimer définitivement cet agent de la liste autorisée ?',
    searchUserPlaceholder: 'Rechercher par nom, prénom, fonction, matricule...',
    noUsersFound: 'Aucun utilisateur ne correspond à vos critères de recherche.',
    filterAllRoles: 'Toutes les fonctions',
    totalUsersCount: 'Total Utilisateurs',
    activeUsersCount: 'Agents Autorisés',
    suspendedUsersCount: 'Accès Suspendus',

    // Self-Registration & Approval
    registerBtn: 'S’inscrire',
    registrationModalTitle: 'Formulaire d’enregistrement agent',
    registrationSubtitle: 'Renseignez votre nom, prénom et fonction pour demander votre accès au réfectoire. L’administration validera votre demande.',
    submitRegistrationBtn: 'Soumettre ma demande d’inscription',
    registrationSuccessTitle: 'Demande enregistrée avec succès !',
    registrationSuccessNotice: 'Votre demande a été transmise à l’administration. Dès validation de votre profil, vous pourrez réserver vos repas en réfectoire.',
    approvalStatusLabel: 'Statut d’approbation',
    approvalPendingBadge: 'En attente d’approbation',
    approvalApprovedBadge: 'Approuvé',
    approvalRejectedBadge: 'Refusé',
    approveUserBtn: 'Approuver l’accès',
    rejectUserBtn: 'Refuser',
    pendingApprovalsNotice: '{count} demande(s) d’inscription en attente d’approbation par l’administration',
    filterAllApprovals: 'Tous les états d’approbation',
    filterOnlyPending: 'En attente d’approbation',
    filterOnlyApproved: 'Approuvés uniquement',
    filterOnlyRejected: 'Refusés',

    // Export PDF & QR Badge
    exportPdfBtn: 'Exporter en PDF',
    exportPdfBadges: 'Badges avec QR Codes (Planche A4)',
    exportPdfTable: 'Tableau Registre avec QR Codes',
    badgeQrModalTitle: 'Badge & QR Code de l’agent',
    scanBadgeToBook: 'Scanner mon Badge QR (Réservation express)',
    scanBadgeSubtitle: 'Scannez votre QR code pour réserver sans saisir vos informations manuellement.',
    scanBadgeSuccess: 'Agent reconnu par QR Code',
    individualBadgeBtn: 'Badge & QR Code',

    tabTrendsAndPredictions: 'Tendance & Ingrédients',
  },

  ar: {
    appName: 'مطعم ESSTS',
    appSubname: 'خدمة إطعام الموظفين',
    establishmentRole: 'المدرسة العليا لعلوم الرياضة وتكنولوجياتها',
    staffCatering: 'إطعام الطلبة',
    loading: 'جاري تحميل خدمة الإطعام...',
    connectingDb: 'الاتصال بقاعدة البيانات',

    menuAndBooking: 'القائمة والحجز',
    menuShort: 'القائمة',
    myTicket: 'تذكرتي',
    history: 'سجل الحجوزات',
    historyShort: 'السجل',
    scanMeal: 'مسح الوجبة',
    scanShort: 'مسح',
    qrAccess: 'رمز QR',
    qrShort: 'QR',
    admin: 'الإدارة',
    adminShort: 'الإدارة',
    bookingsOpen: 'الحجوزات مفتوحة',
    bookingsClosed: 'الحجوزات مغلقة',

    simulatorTitle: 'محاكي توقيت النظام',
    realClock: 'ساعة النظام الفعلية',
    simulationMode: 'وضع محاكاة الوقت',
    simulationActiveNotice: 'المحاكاة نشطة (لاختبار نافذة الحجز 08:00 - 10:00)',
    testTimeSlots: 'اختبار الفترات الزمنية',
    backToRealTime: 'الرجوع للتوقيت الفعلي',
    customSimulation: 'محاكاة مخصصة',
    quickTestSlots: 'فترات اختبار سريعة',
    slotBeforeOpen: 'قبل 08:00 (مغلق)',
    slotInWindow: '08:30 (فترة الحجز مفتوحة)',
    slotNearEnd: '09:55 (اقتراب الإغلاق)',
    slotAfterWindow: '10:15 (مغلق لتحضير المطبخ)',
    slotServiceLunch: '12:30 (وقت تقديم الغداء)',

    bannerOpenTitle: 'الحجوزات مفتوحة الآن',
    bannerOpenSubtitle: 'يمكنكم اختيار وتأكيد وجبة الغداء لهذا اليوم.',
    bannerTimeRemaining: 'الوقت المتبقي قبل الإغلاق',
    bannerWindowLabel: 'الفترة المسموحة: {start} - {end}',
    bannerPendingTitle: 'في انتظار فتح الحجز',
    bannerCurrentTime: 'الساعة الحالية {time}',
    bannerPendingSubtitle: 'تفتح منصة الحجز بدقة من الساعة {start} حتى {end}. يمكنكم الاطلاع على القائمة أدناه في انتظار الفتح.',
    bannerSimulateBtn: 'محاكاة 08:30 للتجربة',
    bannerClosedTitle: 'الحجوزات مغلقة لهذا اليوم',
    bannerClosedSubtitle: 'انتهت فترة الحجز (08:00 - 10:00). تم إرسال الأعداد للمطبخ لبدء تجهيز الوجبات.',
    serviceHoursLabel: 'فترة التقديم: {hours}',

    dailyMenuTitle: 'قائمة طعام اليوم',
    featuredDishBadge: '⭐ طبق اليوم المميز',
    chooseThisDish: 'اختيار هذا الطبق لحجزي',
    dishOfTheDaySelected: 'تم اختيار طبق اليوم',
    entreesTitle: 'المقبلات والسلطات',
    entreesSubtitle: 'حسب الاختيار (مشمولة في الوجبة)',
    platsTitle: 'الأطباق الرئيسية الساخنة',
    platsSubtitle: 'اختر طبقك الرئيسي المفضل لوجبة الغداء',
    dessertsTitle: 'الحلويات والفواكه',
    dessertsSubtitle: 'تحلية ختام الوجبة',
    drinksAndBreadTitle: 'الخبز والمشروبات',
    drinksAndBreadSubtitle: 'مشمولة مع كل وجبة',
    allergensLabel: 'مسببات الحساسية:',
    vegetarianBadge: 'نباتي',
    caloriesLabel: 'سعرة حرارية',
    includedInFormula: 'مشمول في الوجبة',
    freshBreadOption: 'خبز طازج يومي فردي',
    waterBottleOption: 'ماء معدني أو مشروب حسب الاختيار',

    formTitle: 'نموذج حجز وجبة الغداء',
    formSubtitle: 'يرجى إدخال معلوماتك لتأكيد حجز وجبتك واستلام تذكرة الحجز برمز QR.',
    stepIdentity: '1. تعريف الموظف',
    stepMealType: 'نوع الوجبة (فطور، غداء، عشاء)',
    stepMenuSelection: '2. اختيار مكونات الوجبة',
    stepOptionsAndNotes: '3. الخيارات والملاحظات',
    mealTypeLabel: 'اختر الوجبة المراد حجزها',
    mealBreakfast: 'فطور الصباح',
    mealLunch: 'وجبة الغداء',
    mealDinner: 'وجبة العشاء',
    mealBreakfastDesc: 'من 07:00 إلى 09:00 - قهوة، كرواسون، عصير',
    mealLunchDesc: 'من 11:30 إلى 14:00 - مقبلات، طبق رئيسي، تحلية',
    mealDinnerDesc: 'من 18:30 إلى 20:30 - وجبة خفيفة ومتكاملة',
    allMealTypes: 'جميع الوجبات',
    breakfastItemsTitle: 'تشكيلة فطور الصباح',
    dinnerEntreesTitle: 'مقبلات العشاء',
    dinnerPlatsTitle: 'أطباق العشاء الرئيسية',
    dinnerDessertsTitle: 'تحليات العشاء',
    fullNameOrBadgeLabel: 'الاسم واللقب أو الرقم الوظيفي',
    fullNameOrBadgePlaceholder: 'ابحث بالاسم أو الرقم الوظيفي (مثال: AGT-001)...',
    authorizedAgentBadge: 'موظف معتمد ومصرح له',
    authorizedAgentHint: 'موظف مسجل رسمياً في القائمة المصرح لها',
    departmentLabel: 'المصلحة / القسم',
    emailLabel: 'البريد الإلكتروني المهني (اختياري)',
    emailPlaceholder: 'prenom.nom@essts.dz',
    chooseMainDishLabel: 'اختيار الطبق الرئيسي الساخن *',
    chooseEntreeLabel: 'اختيار المقبلات (السلطة)',
    chooseDessertLabel: 'اختيار التحلية',
    breadLabel: 'نوع الخبز',
    drinkLabel: 'نوع المشروب',
    timeSlotLabel: 'فترة استلام الوجبة في المطعم',
    dietaryNotesLabel: 'نظام غذائي خاص أو ملاحظات للمطبخ',
    dietaryNotesPlaceholder: 'مثال: بدون ملح، حساسية معينة، وجبة محمولة...',
    remainingCapacity: 'الأماكن المتبقية لهذا اليوم',
    placesTotal: 'من أصل {total} وجبة مسموحة',
    submitBookingBtn: 'تأكيد حجز وجبتي واستخراج التذكرة',
    submittingBtn: 'جاري تسجيل الحجز...',
    alreadyBookedError: 'تم تسجيل حجز لهذا الموظف مسبقاً لهذا اليوم.',
    outsideHoursError: 'الحجوزات مغلقة حالياً. الفترة المصرح بها: 08:00 - 10:00.',
    capacityFullError: 'تم الوصول إلى الحد الأقصى للطاقة الاستيعابية لمطعم اليوم.',
    unauthorizedUserError: 'هذا الموظف غير مسجل في قائمة الموظفين المصرح لهم.',
    missingNameError: 'يرجى كتابة الاسم أو الرقم الوظيفي.',
    missingPlatError: 'يرجى اختيار الطبق الرئيسي الساخن.',

    ticketTitle: 'تذكرة وجبة الغداء',
    ticketSubtitle: 'يرجى إبراز هذه التذكرة عند المرور في المطعم لاستلام صينية الغداء.',
    officialTicketValidated: 'تذكرة رسمية معتمدة',
    pickupNumberLabel: 'رقم الاستلام',
    presentAtCounterNotice: 'أظهر رمز QR لمسؤول التوزيع لاستلام وجبتك بسرعة وسلاسة.',
    beneficiaryLabel: 'المستفيد',
    departmentTicketLabel: 'المصلحة / القسم',
    bookingDateLabel: 'تاريخ الوجبة',
    timeSlotTicketLabel: 'فترة الاستلام',
    mealCompositionLabel: 'محتويات صينية الغداء',
    mainDishTicket: 'الطبق الرئيسي',
    entreeTicket: 'المقبلات',
    dessertTicket: 'التحلية',
    breadTicket: 'الخبز',
    drinkTicket: 'المشروب',
    specialNotesTicket: 'ملاحظات خاصة',
    statusConfirmed: 'مؤكد (في انتظار الاستلام)',
    statusServed: 'تم الاستلام في المطعم',
    statusCancelled: 'ملغى',
    printTicketBtn: 'طباعة التذكرة',
    cancelBookingBtn: 'إلغاء حجزي',
    newBookingBtn: 'إجراء حجز آخر',
    confirmCancelPrompt: 'هل أنت متأكد من رغبتك في إلغاء حجز وجبتك؟',
    cancelSuccessNotice: 'تم إلغاء الحجز بنجاح.',

    scannerTitle: 'ماسح خدمة التوزيع (Passe-Plat)',
    scannerSubtitle: 'التحقق الفوري من التذاكر وتأكيد تسليم الوجبات للموظفين.',
    startCamera: 'تشغيل الكاميرا',
    stopCamera: 'إيقاف الكاميرا',
    cameraActiveNotice: 'وجه الكاميرا نحو رمز QR الموجود على تذكرة الموظف.',
    manualEntryTitle: 'تحقق يدوي (برقم الاستلام أو الرقم الوظيفي)',
    manualEntryPlaceholder: 'أدخل رقم الاستلام (مثال: R-101) أو الرقم الوظيفي...',
    validateManualBtn: 'تأكيد تسليم الوجبة',
    mealConfirmedSuccess: 'تم تسليم الوجبة بنجاح! شهية طيبة!',
    alreadyServedWarning: 'تنبيه: تم استلام هذه الوجبة مسبقاً!',
    ticketNotFoundOrCancelled: 'التذكرة غير موجودة أو تم إلغاؤها.',
    servingNowMeal: 'محتويات الوجبة المختارة للموظف:',
    counterRecentServed: 'آخر الوجبات المسلمة اليوم',
    closeBtn: 'إغلاق',

    posterTitle: 'ملصق رمز QR لمطعم المؤسسة',
    posterSubtitle: 'للطباعة والتعليق عند مدخل المؤسسة أو قاعة المطعم.',
    posterInstructions: 'يمكن للموظفين مسح هذا الرمز بهواتفهم الذكية لحجز وجباتهم بين 08:00 و 10:00.',
    posterStep1: '1. امسح رمز QR بكاميرا هاتفك المحمول',
    posterStep2: '2. اختر وجبتك المفضلة بين 08:00 و 10:00',
    posterStep3: '3. استلم صينيتك في المطعم بإبراز التذكرة',
    printPosterBtn: 'طباعة الملصق بقياس A4',

    adminLoginTitle: 'دخول الإدارة',
    adminLoginSubtitle: 'منطقة مخصصة لمسؤولي الإطعام والمقتصدين لإدارة القوائم والمسجلين.',
    passwordLabel: 'كلمة مرور المشرف',
    passwordPlaceholder: 'أدخل كلمة المرور...',
    unlockAdminBtn: 'فتح لوحة الإدارة',
    cancelBtn: 'إلغاء',
    incorrectPassword: 'كلمة المرور غير صحيحة.',
    quickFillDemoPassword: 'تعبئة كلمة المرور التجريبية (admin123)',

    adminDashboardTitle: 'لوحة التحكم - الإطعام الجماعي',
    logoutBtn: 'تسجيل الخروج',
    tabTodayReservations: 'مسجلو اليوم',
    tabMenusAndDishes: 'القوائم والأطباق',
    tabAuthorizedUsers: 'الموظفون المصرح لهم',
    tabAttendanceStats: 'إحصائيات الإقبال',
    tabSettings: 'الإعدادات',
    statTotalReservations: 'إجمالي الحجوزات',
    statMealsServed: 'الوجبات المسلمة',
    statRemainingToServe: 'في انتظار الاستلام',
    statCapacityRatio: 'نسبة الإشغال',
    exportExcelBtn: 'تصدير إلى Excel (.xlsx)',
    searchReservationPlaceholder: 'البحث عن مسجل (الاسم، الرقم، التذكرة)...',
    filterAllDepartments: 'جميع الأقسام',
    filterAllStatuses: 'جميع الحالات',
    filterConfirmedOnly: 'المؤكدة',
    filterServedOnly: 'المسلمة',
    filterCancelledOnly: 'الملغاة',
    colBeneficiary: 'الموظف / المستفيد',
    colDepartment: 'القسم / المصلحة',
    colTimeSlot: 'الفترة',
    colDish: 'الطبق المختار',
    colStatus: 'الحالة',
    colActions: 'الإجراءات',
    markAsServedBtn: 'تحديد كمسلَّم',
    actionServedDone: 'تم التسليم',

    today: 'اليوم',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    confirm: 'تأكيد',
    back: 'رجوع',
    languageName: 'العربية',
    switchLanguageTo: 'Passer en Français',

    // Organized UX keys
    activeTicketNotice: 'لقد قمت بالفعل بحجز وجبتك لهذا اليوم!',
    viewMyTicketBtn: 'عرض تذكرتي ورمز QR',
    capacityProgress: '{count} من أصل {total} وجبة محجوزة',
    placesRemainingCount: '{count} مكان متبقٍ للحجز',
    fullCapacityNotice: 'اكتملت السعة القصوى لهذا اليوم',
    kitchenSummaryTitle: 'ملخص تجهيز وجبات المطبخ',
    settingsGeneralTitle: 'إعدادات المؤسسة وأوقات الحجز',
    settingsBrandingTitle: 'الهوية البصرية والشعار الرسمي',
    settingsDatabaseTitle: 'قاعدة البيانات السحابية (Supabase)',
    settingsSecurityTitle: 'الأمان وكلمة مرور المسؤول',
    settingsMaintenanceTitle: 'الصيانة والبيانات التجريبية',
    testSimulatorToggle: 'محاكي الوقت',
    chooseDishAndBook: 'اختيار هذا الطبق والحجز',
    scrollToForm: 'الانتقال إلى نموذج الحجز',
    quickSummary: 'نظرة سريعة',

    // Manual User Management
    userManagementTitle: 'إدارة الموظفين المصرح لهم (القائمة البيضاء)',
    userManagementSubtitle: 'إدارة يدوية للمستخدمين: إضافة وحذف وتعديل اللقب، الاسم والوظيفة.',
    addUserBtn: 'إضافة موظف',
    editUserModalTitle: 'تعديل بيانات الموظف',
    addUserModalTitle: 'إضافة موظف يدوياً',
    userLastName: 'اللقب',
    userFirstName: 'الاسم',
    userRole: 'الوظيفة / الصفة',
    userBadgeNumber: 'رقم البطاقة / المعرّف',
    userStatus: 'حالة الدخول',
    userStatusActive: 'مصرح به (نشط)',
    userStatusSuspended: 'موقوف (معطل)',
    confirmDeleteUser: 'هل أنت متأكد من رغبتك في حذف هذا الموظف نهائياً من القائمة المصرح لها؟',
    searchUserPlaceholder: 'بحث باللقب، الاسم، الوظيفة أو رقم البطاقة...',
    noUsersFound: 'لم يتم العثور على أي موظف يطابق معايير البحث.',
    filterAllRoles: 'جميع الوظائف',
    totalUsersCount: 'إجمالي الموظفين',
    activeUsersCount: 'المصرح لهم بالحجز',
    suspendedUsersCount: 'الحسابات الموقوفة',

    // Self-Registration & Approval
    registerBtn: 'تسجيل جديد',
    registrationModalTitle: 'استمارة تسجيل موظف جديد',
    registrationSubtitle: 'يرجى إدخال اللقب والاسم والوظيفة لطلب الاستفادة من خدمة الإطعام. ستتم مراجعة الطلب من قبل الإدارة.',
    submitRegistrationBtn: 'إرسال طلب التسجيل',
    registrationSuccessTitle: 'تم تسجيل طلبك بنجاح!',
    registrationSuccessNotice: 'تم إرسال طلبك إلى الإدارة. بمجرد اعتماد حسابك، ستتمكن من حجز وجباتك اليومية.',
    approvalStatusLabel: 'حالة الاعتماد',
    approvalPendingBadge: 'قيد المراجعة والاعتماد',
    approvalApprovedBadge: 'معتمد ومقبول',
    approvalRejectedBadge: 'مرفوض',
    approveUserBtn: 'اعتماد وقبول',
    rejectUserBtn: 'رفض الطلب',
    pendingApprovalsNotice: '{count} طلب(ات) تسجيل جديدة بانتظار موافقة الإدارة',
    filterAllApprovals: 'جميع حالات الاعتماد',
    filterOnlyPending: 'قيد الاعتماد والمراجعة',
    filterOnlyApproved: 'المعتمدون فقط',
    filterOnlyRejected: 'المرفوضون',

    // Export PDF & QR Badge
    exportPdfBtn: 'تصدير كملف PDF',
    exportPdfBadges: 'بطاقات مع رموز QR (صفحات A4)',
    exportPdfTable: 'سجل الموظفين مع رموز QR',
    badgeQrModalTitle: 'بطاقة ورمز QR للموظف',
    scanBadgeToBook: 'مسح رمز QR للبطاقة (حجز سريع)',
    scanBadgeSubtitle: 'امسح رمز QR للحجز فورياً دون الحاجة لكتابة بياناتك يدوياً.',
    scanBadgeSuccess: 'تم التعرف على الموظف عبر رمز QR',
    individualBadgeBtn: 'البطاقة ورمز QR',

    tabTrendsAndPredictions: 'الاتجاهات وتوقعات المكونات',
  },
};

/**
 * Format date in Arabic, e.g. "الخميس 8 أكتوبر 2026"
 */
export function formatArabicDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('ar-DZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format localized date depending on language
 */
export function formatLocalizedDate(dateStr: string, lang: Language): string {
  if (lang === 'ar') {
    return formatArabicDate(dateStr);
  }
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}
