import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, Terminal } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseClient';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Script SQL pour Supabase
            </h3>
            <p className="text-xs text-slate-500">
              Tables pour menus, réservations, utilisateurs autorisés et paramètres.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instructions de mise en place (en 30 secondes) :</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-600">
            <li>Connectez-vous à votre tableau de bord <strong>Supabase.com</strong>.</li>
            <li>Ouvrez le menu <strong>SQL Editor</strong> dans la barre latérale gauche.</li>
            <li>Cliquez sur <strong>New query</strong>, collez le script ci-dessous et cliquez sur <strong>Run</strong>.</li>
          </ol>
        </div>

        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
            <span>schema_mensastaff.sql</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le script SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="flex-1 bg-slate-950 text-emerald-300 p-4 rounded-b-xl overflow-y-auto text-[11px] font-mono leading-relaxed border border-slate-900 max-h-60 select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Compatible avec les versions gratuites et payantes de Supabase.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
