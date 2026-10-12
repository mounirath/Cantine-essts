import React, { useState } from 'react';
import { Key, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { dbService, DEFAULT_ADMIN_PASSWORD_PLAIN } from '../services/dbService';
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
