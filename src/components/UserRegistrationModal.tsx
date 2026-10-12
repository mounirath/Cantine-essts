import React, { useState } from 'react';
import { AuthorizedUser } from '../types';
import { dbService } from '../services/dbService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Check,
  X,
  Briefcase,
  User,
  Building2,
  Search,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess?: (user: AuthorizedUser) => void;
}

const DEPARTMENTS = [
  'Enseignement & Formation',
  'Pôle Technique & Informatique',
  'Service Médical & Soins',
  'Ressources Humaines',
  'Administration & Finances',
  'Logistique & Services Généraux',
  'Direction Générale',
  'Autre service',
];

const SUGGESTED_ROLES = [
  'Professeur EPS',
  'Entraîneur Sportif',
  'Médecin du Sport',
  'Infirmier / Soignant',
  'Ingénieur Informatique',
  'Agent Administratif',
  'Comptable / Gestionnaire',
  'Responsable Logistique',
  'Directeur',
  'Étudiant Athlète',
];

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess,
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'form' | 'status'>('form');

  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [badgeNumber, setBadgeNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [submittedUser, setSubmittedUser] = useState<AuthorizedUser | null>(null);

  // Status Search State
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<AuthorizedUser | null>(null);
  const [searchHasSearched, setSearchHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setLastName('');
    setFirstName('');
    setRole('');
    setDepartment(DEPARTMENTS[0]);
    setBadgeNumber('');
    setEmail('');
    setDietaryNotes('');
    setFormError(null);
    setSubmittedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanLastName = lastName.trim();
    const cleanFirstName = firstName.trim();
    const cleanRole = role.trim();

    if (!cleanLastName) {
      setFormError(isRTL ? 'الرجاء إدخال اللقب.' : 'Le nom de famille est obligatoire.');
      return;
    }

    if (!cleanFirstName) {
      setFormError(isRTL ? 'الرجاء إدخال الاسم.' : 'Le prénom est obligatoire.');
      return;
    }

    if (!cleanRole) {
      setFormError(isRTL ? 'الرجاء إدخال الوظيفة أو الصفة.' : 'La fonction / poste est obligatoire.');
      return;
    }

    setIsSubmitting(true);

    try {
      const registered = await dbService.registerUser({
        lastName: cleanLastName,
        firstName: cleanFirstName,
        role: cleanRole,
        department,
        email: email.trim() || undefined,
        badgeNumber: badgeNumber.trim() || undefined,
        dietaryNotes: dietaryNotes.trim() || undefined,
      });

      setSubmittedUser(registered);
      onRegisteredSuccess?.(registered);

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch {
      setFormError(
        isRTL
          ? 'حدث خطأ أثناء إرسال طلب التسجيل. يرجى إعادة المحاولة.'
          : 'Erreur lors de l’envoi de la demande d’inscription.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSearchQuery.trim()) return;

    setSearchHasSearched(true);
    const users = await dbService.getAuthorizedUsers();
    const q = statusSearchQuery.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.fullName.toLowerCase() === q ||
        u.badgeNumber.toLowerCase() === q ||
        (u.lastName && u.lastName.toLowerCase() === q) ||
        (u.firstName && u.firstName.toLowerCase() === q) ||
        (u.email && u.email.toLowerCase() === q) ||
        u.fullName.toLowerCase().includes(q)
    );
    setSearchedUser(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('form');
              setSubmittedUser(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('registrationModalTitle')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Vérifier mon statut</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: FORMULAIRE D'ENREGISTREMENT */}
        {/* ==================================================== */}
        {activeTab === 'form' && !submittedUser && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {t('registrationModalTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('registrationSubtitle')}
              </p>
            </div>

            {/* Notice d'approbation */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block text-amber-950">Approbation requise par l'administration :</span>
                Votre inscription sera immédiatement transmise au gestionnaire. Vous pourrez réserver vos repas dès qu'elle aura été validée.
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* NOM & PRÉNOM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('userLastName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex : BENALI ou MARTIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('userFirstName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex : Karim ou Claire"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* FONCTION / POSTE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('userRole')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex : Professeur EPS, Entraîneur, Médecin..."
                    className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Suggestions chips */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Suggestions :</span>
                  {SUGGESTED_ROLES.slice(0, 5).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setRole(sug)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* PÔLE / SERVICE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pôle / Service de rattachement
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EMAIL & MATRICULE (OPTIONNELS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email professionnel (optionnel)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@essts.dz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de badge / Matricule (si connu)
                  </label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="Laissez vide pour auto"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* RÉGIME ALIMENTAIRE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Régime alimentaire ou particularité (optionnel)
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ex : Végétarien, Sans lactose, Sans sel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* APERÇU DE LA CARTE AVANT ENVOI */}
              {(lastName || firstName || role) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black tracking-wide">
                        {lastName ? lastName.toUpperCase() : 'NOM'} {firstName || 'Prénom'}
                      </div>
                      <div className="text-slate-300 text-xs mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-emerald-400" />
                        <span>{role || 'Fonction'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{department}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        En attente d'approbation
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmission...' : t('submitRegistrationBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUCCESS SCREEN APRÈS ENREGISTREMENT */}
        {/* ==================================================== */}
        {activeTab === 'form' && submittedUser && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                {t('registrationSuccessTitle')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                {t('registrationSuccessNotice')}
              </p>
            </div>

            {/* Récapitulatif du profil soumis */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left rtl:text-right text-xs max-w-sm mx-auto space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Bénéficiaire :</span>
                <span className="font-black text-slate-900">{submittedUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Fonction / Poste :</span>
                <span className="font-bold text-blue-700">{submittedUser.role}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Service / Pôle :</span>
                <span className="font-semibold text-slate-700">{submittedUser.department}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Matricule attribué :</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {submittedUser.badgeNumber}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Statut :</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>En attente d'approbation</span>
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Nouvelle inscription
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: VÉRIFIER LE STATUT D'UNE DEMANDE EXISTANTE */}
        {/* ==================================================== */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Suivi de votre demande d'inscription
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Entrez votre nom, prénom ou numéro de badge pour connaître l'état d'approbation par l'administration.
              </p>
            </div>

            <form onSubmit={handleCheckStatus} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex : BENALI Karim ou AG-108"
                  value={statusSearchQuery}
                  onChange={(e) => setStatusSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shrink-0"
              >
                Rechercher
              </button>
            </form>

            {searchHasSearched && searchedUser && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 text-sm">
                    {searchedUser.fullName}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {searchedUser.badgeNumber}
                  </span>
                </div>

                <div className="text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{searchedUser.role} &bull; {searchedUser.department}</span>
                </div>

                {/* Status Result */}
                <div className="pt-2 border-t border-slate-200">
                  {searchedUser.approvalStatus === 'approved' || (!searchedUser.approvalStatus && searchedUser.active) ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Demande approuvée avec succès !</span>
                        <span>Votre accès est actif. Vous pouvez dès à présent réserver vos repas en réfectoire.</span>
                      </div>
                    </div>
                  ) : searchedUser.approvalStatus === 'rejected' ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Demande refusée par l'administration</span>
                        <span>Veuillez contacter la direction ou le service de restauration.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">En attente d'approbation</span>
                        <span>Votre demande a bien été reçue et est en cours de validation par le gestionnaire.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {searchHasSearched && !searchedUser && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                Aucun compte trouvé avec cet identifiant. Vous pouvez remplir le formulaire pour soumettre votre inscription.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
