import React, { useState, useEffect } from 'react';
import { Key, Shield, ArrowRight, AlertCircle, LogIn } from 'lucide-react';
import { dbService, DEFAULT_ADMIN_PASSWORD_PLAIN } from '../services/dbService';
import { signInWithGoogle, auth, subscribeToAuth } from '../services/firebase';
import { useLanguage } from '../i18n/LanguageContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(auth.currentUser?.email || null);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUserEmail(user?.email || null);
      if (user && user.email === 'rita68dz@gmail.com') {
        onLoginSuccess();
      }
    });
    return unsub;
  }, [onLoginSuccess]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        // If email matches the admin or any authenticated user approved
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await dbService.verifyAdminPassword(password);
      if (isValid) {
        onLoginSuccess();
      } else {
        setError(t('incorrectPassword'));
      }
    } catch {
      setError(t('incorrectPassword'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDefault = () => {
    setPassword(DEFAULT_ADMIN_PASSWORD_PLAIN);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mb-4 shadow-md">
          <Shield className="w-6 h-6" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t('adminLoginTitle')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('adminLoginSubtitle')}
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Connexion rapide avec Google (Firebase Auth) */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition shadow-2xs"
          >
            {isGoogleLoading ? (
              <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Se connecter avec Google (Firebase Auth)</span>
          </button>

          {currentUserEmail && (
            <div className="text-[11px] text-center text-slate-500">
              Connecté en tant que <span className="font-semibold text-slate-700">{currentUserEmail}</span>
            </div>
          )}

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              ou avec mot de passe
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3.5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-700">{t('passwordLabel')} :</span>{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-emerald-700 font-bold">
                {DEFAULT_ADMIN_PASSWORD_PLAIN}
              </code>
            </div>
            <button
              type="button"
              onClick={handleFillDefault}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0"
            >
              Demo
            </button>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-slate-900/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('unlockAdminBtn')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
