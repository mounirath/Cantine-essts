import React, { useState, useMemo } from 'react';
import { AuthorizedUser } from '../types';
import { dbService } from '../services/dbService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  UserPlus,
  Trash2,
  Edit2,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Briefcase,
  User,
  Clock,
  Download,
  Building2,
  BadgeAlert,
  IdCard,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Sparkles,
  QrCode,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { UserBadgeModal } from './UserBadgeModal';
import {
  exportUsersBadgesGridPDF,
  exportUsersListTablePDF,
} from '../utils/userPdfExport';

interface AuthorizedUsersManagerProps {
  initialUsers: AuthorizedUser[];
  onRefresh: () => Promise<void>;
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

export const AuthorizedUsersManager: React.FC<AuthorizedUsersManagerProps> = ({
  initialUsers,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [users, setUsers] = useState<AuthorizedUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modal Create / Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [email, setEmail] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Delete state
  const [userToDelete, setUserToDelete] = useState<AuthorizedUser | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Badge & QR Code Modal state
  const [selectedUserForBadge, setSelectedUserForBadge] = useState<AuthorizedUser | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Unique roles in current database for filtering
  const existingRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role && u.role.trim()) set.add(u.role.trim());
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const uLast = (u.lastName || '').toLowerCase();
      const uFirst = (u.firstName || '').toLowerCase();
      const uFull = (u.fullName || '').toLowerCase();
      const uRole = (u.role || '').toLowerCase();
      const uBadge = (u.badgeNumber || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();

      const matchesSearch =
        !q ||
        uLast.includes(q) ||
        uFirst.includes(q) ||
        uFull.includes(q) ||
        uRole.includes(q) ||
        uBadge.includes(q) ||
        uEmail.includes(q);

      const matchesRole = roleFilter === 'ALL' || (u.role || '').trim() === roleFilter;
      const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'active' && u.active) ||
        (statusFilter === 'suspended' && !u.active);

      const currentApproval = u.approvalStatus || (u.active ? 'approved' : 'pending');
      const matchesApproval = approvalFilter === 'ALL' || currentApproval === approvalFilter;

      return matchesSearch && matchesRole && matchesDept && matchesStatus && matchesApproval;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter, approvalFilter]);

  // Statistics
  const totalCount = users.length;
  const pendingCount = users.filter((u) => (u.approvalStatus === 'pending' || (!u.approvalStatus && !u.active))).length;
  const activeCount = users.filter((u) => u.active && u.approvalStatus !== 'pending').length;
  const rejectedCount = users.filter((u) => u.approvalStatus === 'rejected').length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setLastName('');
    setFirstName('');
    setRole('');
    const nextNum = Math.floor(100 + Math.random() * 900);
    setBadgeNumber(`AG-${nextNum}`);
    setDepartment(DEPARTMENTS[0]);
    setEmail('');
    setDietaryNotes('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AuthorizedUser) => {
    setEditingUserId(user.id);
    setLastName(user.lastName || '');
    setFirstName(user.firstName || '');
    setRole(user.role || '');
    setBadgeNumber(user.badgeNumber || '');
    setDepartment(user.department || DEPARTMENTS[0]);
    setEmail(user.email || '');
    setDietaryNotes(user.dietaryNotes || '');
    setIsActive(user.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanLastName = lastName.trim();
    const cleanFirstName = firstName.trim();
    const cleanRole = role.trim();
    const cleanBadge = badgeNumber.trim().toUpperCase();

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

    if (!cleanBadge) {
      setFormError(isRTL ? 'الرجاء إدخال رقم البطاقة / المعرّف.' : 'Le matricule ou numéro de badge est obligatoire.');
      return;
    }

    // Check unique badge
    const badgeConflict = users.find(
      (u) =>
        u.badgeNumber.trim().toUpperCase() === cleanBadge &&
        u.id !== editingUserId
    );
    if (badgeConflict) {
      setFormError(
        isRTL
          ? `رقم البطاقة "${cleanBadge}" مسجل بالفعل للموظف ${badgeConflict.fullName}.`
          : `Le matricule "${cleanBadge}" est déjà attribué à ${badgeConflict.fullName}.`
      );
      return;
    }

    try {
      const formattedFullName = `${cleanLastName.toUpperCase()} ${cleanFirstName}`;
      const existing = editingUserId ? users.find((u) => u.id === editingUserId) : null;
      const userObj: AuthorizedUser = {
        id: editingUserId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        badgeNumber: cleanBadge,
        lastName: cleanLastName,
        firstName: cleanFirstName,
        role: cleanRole,
        fullName: formattedFullName,
        department,
        email: email.trim() || undefined,
        dietaryNotes: dietaryNotes.trim() || undefined,
        active: isActive,
        approvalStatus: existing?.approvalStatus || 'approved',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      await dbService.saveAuthorizedUser(userObj);
      await onRefresh();
      setIsModalOpen(false);
    } catch {
      setFormError(
        isRTL
          ? 'حدث خطأ أثناء حفظ بيانات الموظف.'
          : 'Erreur lors de l’enregistrement de l’agent.'
      );
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user: AuthorizedUser) => {
    const updated: AuthorizedUser = { ...user, active: !user.active };
    await dbService.saveAuthorizedUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
  };

  // Approve a user registration
  const handleApprove = async (user: AuthorizedUser) => {
    try {
      const updated = await dbService.approveUser(user.id);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        await onRefresh();
      }
    } catch {
      alert(isRTL ? 'فشل اعتماد الموظف.' : 'Erreur lors de l’approbation.');
    }
  };

  // Reject a user registration
  const handleReject = async (user: AuthorizedUser) => {
    try {
      const updated = await dbService.rejectUser(user.id);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        await onRefresh();
      }
    } catch {
      alert(isRTL ? 'فشل رفض الطلب.' : 'Erreur lors du rejet.');
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      for (const id of selectedUserIds) {
        await dbService.approveUser(id);
      }
      await onRefresh();
      setSelectedUserIds([]);
    } catch {
      alert(isRTL ? 'فشل اعتماد التحديد.' : 'Erreur lors de l’approbation groupée.');
    }
  };

  // Delete single user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await dbService.deleteAuthorizedUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
      await onRefresh();
      setUserToDelete(null);
    } catch {
      alert(isRTL ? 'فشل حذف الموظف.' : 'Erreur lors de la suppression.');
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      for (const id of selectedUserIds) {
        await dbService.deleteAuthorizedUser(id);
      }
      setUsers((prev) => prev.filter((u) => !selectedUserIds.includes(u.id)));
      setSelectedUserIds([]);
      await onRefresh();
      setIsBulkDeleteModalOpen(false);
    } catch {
      alert(isRTL ? 'حدث خطأ أثناء الحذف المتعدد.' : 'Erreur lors de la suppression groupée.');
    }
  };

  // Toggle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Fonction', 'Matricule', 'Service', 'Email', 'Statut Approbation'];
    const rows = filteredUsers.map((u) => [
      `"${u.lastName || ''}"`,
      `"${u.firstName || ''}"`,
      `"${u.role || ''}"`,
      `"${u.badgeNumber || ''}"`,
      `"${u.department || ''}"`,
      `"${u.email || ''}"`,
      `"${u.approvalStatus || (u.active ? 'approved' : 'pending')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `utilisateurs_cantine_essts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export (Badges Grid or Table List with QR codes)
  const handleExportPdf = async (type: 'badges' | 'table') => {
    const targetUsers =
      selectedUserIds.length > 0
        ? users.filter((u) => selectedUserIds.includes(u.id))
        : filteredUsers;

    if (targetUsers.length === 0) return;

    setIsExportingPdf(true);
    setIsPdfMenuOpen(false);
    setPdfExportProgress({ current: 0, total: targetUsers.length });

    try {
      if (type === 'badges') {
        await exportUsersBadgesGridPDF(targetUsers, {
          onProgress: (current, total) => setPdfExportProgress({ current, total }),
        });
      } else {
        await exportUsersListTablePDF(targetUsers, {
          onProgress: (current, total) => setPdfExportProgress({ current, total }),
        });
      }
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfExportProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending approval alert banner */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-950 text-sm sm:text-base">
                  {pendingCount} demande(s) d'inscription en attente d'approbation
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wide">
                  Action requise
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Des agents se sont enregistrés via le formulaire en ligne et attendent votre validation pour réserver leurs repas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setApprovalFilter('pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Examiner les demandes ({pendingCount})</span>
          </button>
        </div>
      )}

      {/* Top action header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {t('userManagementTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t('userManagementSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
            title="Exporter en CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>

          {/* PDF Export Dropdown (Badges or Table with QR Codes) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPdfMenuOpen((prev) => !prev)}
              disabled={isExportingPdf}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 transition shadow-2xs disabled:opacity-50"
              title="Exporter en PDF avec QR Codes pour réservation instantanée"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>
                {isExportingPdf
                  ? `Génération (${pdfExportProgress?.current || 0}/${pdfExportProgress?.total || 0})...`
                  : selectedUserIds.length > 0
                  ? `Exporter PDF (${selectedUserIds.length})`
                  : t('exportPdfBtn')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
            </button>

            {isPdfMenuOpen && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                  {selectedUserIds.length > 0
                    ? `${selectedUserIds.length} agent(s) sélectionné(s)`
                    : `${filteredUsers.length} agent(s) à exporter`}
                </div>

                <button
                  type="button"
                  onClick={() => handleExportPdf('badges')}
                  className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-emerald-50 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2.5 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-900">
                      {t('exportPdfBadges')}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Cartes d'accès officielles avec QR Code (6 par page)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPdf('table')}
                  className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-blue-50 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2.5 transition mt-1"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-900">
                      {t('exportPdfTable')}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Tableau d'émargement récapitulatif & QR miniature
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition hover:shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>{t('addUserBtn')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards / Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setApprovalFilter('ALL')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs ${
            approvalFilter === 'ALL'
              ? 'bg-white border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('totalUsersCount')}
            </span>
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {totalCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {existingRoles.length} fonctions répertoriées
          </span>
        </div>

        {/* Pending approvals card */}
        <div
          onClick={() => setApprovalFilter('pending')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs ${
            approvalFilter === 'pending'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>En attente d'approbation</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
            {pendingCount}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
            {pendingCount > 0 ? 'Validation requise' : 'Aucune demande en attente'}
          </span>
        </div>

        {/* Approved active users card */}
        <div
          onClick={() => setApprovalFilter('approved')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs ${
            approvalFilter === 'approved'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-emerald-50/20 border-emerald-200/80 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              {t('activeUsersCount')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {activeCount}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
            Comptes approuvés & autorisés
          </span>
        </div>

        {/* Refused or Suspended card */}
        <div
          onClick={() => setApprovalFilter(rejectedCount > 0 ? 'rejected' : 'ALL')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
              Suspendus / Refusés
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
            {totalCount - activeCount - pendingCount + rejectedCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            {rejectedCount} refusé(s) &bull; {totalCount - activeCount - pendingCount} suspendu(s)
          </span>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 rtl:left-auto rtl:right-3.5" />
            <input
              type="text"
              placeholder={t('searchUserPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Approval Status */}
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as any)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                approvalFilter === 'pending'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              <option value="ALL">Tous les statuts d'approbation</option>
              <option value="pending">⏳ En attente d'approbation ({pendingCount})</option>
              <option value="approved">✅ Approuvés ({activeCount})</option>
              <option value="rejected">❌ Refusés ({rejectedCount})</option>
            </select>

            {/* Filter by Role / Fonction */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">{t('filterAllRoles')}</option>
              {existingRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Filter by Department */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">{t('filterAllDepartments')}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected count info banner if active */}
        {selectedUserIds.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">
              {selectedUserIds.length} agent(s) sélectionné(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approuver la sélection</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUserIds.length === filteredUsers.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Statut Approbation</th>
                <th className="py-3 px-4">{t('userLastName')}</th>
                <th className="py-3 px-4">{t('userFirstName')}</th>
                <th className="py-3 px-4">{t('userRole')}</th>
                <th className="py-3 px-4">Pôle / Service</th>
                <th className="py-3 px-4">{t('userBadgeNumber')}</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right rtl:text-left">Actions & Approbation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">{t('noUsersFound')}</p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t('addUserBtn')}</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const approvalState = user.approvalStatus || (user.active ? 'approved' : 'pending');

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition ${
                        approvalState === 'pending'
                          ? 'bg-amber-50/30'
                          : !user.active
                          ? 'opacity-60 bg-slate-50/40'
                          : ''
                      } ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(user.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Statut d'approbation */}
                      <td className="py-3 px-4">
                        {approvalState === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En attente</span>
                          </span>
                        ) : approvalState === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Refusé</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              user.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Cliquer pour basculer le statut"
                          >
                            {user.active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{t('userStatusActive')}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>{t('userStatusSuspended')}</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Nom (Majuscule) */}
                      <td className="py-3 px-4 font-black text-slate-900 tracking-tight">
                        {user.lastName ? user.lastName.toUpperCase() : user.fullName.toUpperCase()}
                      </td>

                      {/* Prénom */}
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {user.firstName || '-'}
                      </td>

                      {/* Fonction / Poste */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                          <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{user.role || 'Personnel'}</span>
                        </span>
                      </td>

                      {/* Pôle / Service */}
                      <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                        {user.department}
                      </td>

                      {/* Matricule / Badge */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {user.badgeNumber}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {user.email || '-'}
                      </td>

                      {/* Actions & Approbation */}
                      <td className="py-3 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5 flex-wrap">
                          {/* Si en attente : boutons Approuver / Refuser */}
                          {approvalState === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(user)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                title="Approuver l'inscription"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approuver</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReject(user)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                title="Refuser l'accès"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Refuser</span>
                              </button>
                            </>
                          )}

                          {approvalState === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(user)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition"
                            >
                              Réautoriser
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForBadge(user);
                              setIsBadgeModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition"
                            title="Badge officiel & QR Code de réservation"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL AJOUTER / MODIFIER UTILISATEUR */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                {editingUserId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingUserId ? t('editUserModalTitle') : t('addUserModalTitle')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestion manuelle : renseignez le nom, prénom et la fonction de l'agent.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-5 space-y-4">
              {/* NOM & PRÉNOM EN 2 CHAMPS DISTINCTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nom de famille</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Prénom usuel</span>
                </div>
              </div>

              {/* FONCTION / POSTE (AVEC SUGGESTIONS RAPIDES) */}
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

              {/* MATRICULE & STATUT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('userBadgeNumber')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="AG-108"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Identifiant unique</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('userStatus')}
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="true">{t('userStatusActive')}</option>
                    <option value="false">{t('userStatusSuspended')}</option>
                  </select>
                </div>
              </div>

              {/* SERVICE / PÔLE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pôle / Service <span className="text-rose-500">*</span>
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

              {/* EMAIL */}
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

              {/* RÉGIME / REMARQUE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Régime alimentaire ou note de cuisine (optionnel)
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ex : Sans sel, Végétarien..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* BOUTONS ACTIONS */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Mettre à jour l’agent' : 'Enregistrer l’agent'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL DE CONFIRMATION DE SUPPRESSION INDIVIDUELLE */}
      {/* ==================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Supprimer cet utilisateur ?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Vous êtes sur le point de retirer définitivement :
            </p>

            <div className="my-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {userToDelete.fullName}
              </div>
              <div className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>{userToDelete.role || userToDelete.department}</span>
              </div>
              <div className="font-mono text-slate-500 mt-1">
                Matricule : {userToDelete.badgeNumber}
              </div>
            </div>

            <p className="text-[11px] text-rose-600 font-semibold mb-5">
              Cet agent ne pourra plus réserver de repas à la cantine tant qu'il n'aura pas été réajouté.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL DE SUPPRESSION MULTIPLE (BULK DELETE) */}
      {/* ==================================================== */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <BadgeAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Suppression groupée de {selectedUserIds.length} agent(s)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement les {selectedUserIds.length} utilisateurs sélectionnés de la liste autorisée ? Cette action est irréversible.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer les {selectedUserIds.length} agents</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL BADGE INDIVIDUEL & QR CODE EXPORTABLE */}
      {/* ==================================================== */}
      <UserBadgeModal
        user={selectedUserForBadge}
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setSelectedUserForBadge(null);
        }}
      />
    </div>
  );
};
