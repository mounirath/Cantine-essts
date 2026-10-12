import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Camera,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { MenuItem, MealCategory } from '../types';
import { DISH_IMAGE_PRESETS, compressImageFile } from '../utils/dishImageUtils';

interface DishPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish?: MenuItem | null;
  isMenuCover?: boolean;
  menuTitle?: string;
  initialImageUrl?: string;
  onSavePhoto: (dishId: string, category: MealCategory | 'menu', imageUrl?: string) => void;
}

export const DishPhotoModal: React.FC<DishPhotoModalProps> = ({
  isOpen,
  onClose,
  dish,
  isMenuCover = false,
  menuTitle = 'Menu du jour',
  initialImageUrl,
  onSavePhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | 'menu' | 'entree' | 'plat' | 'dessert'>('all');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentUrl = isMenuCover ? (initialImageUrl || '') : (dish?.imageUrl || '');
      setPreviewUrl(currentUrl);
      setUrlInput(currentUrl);
      setErrorMsg(null);
      setIsDragging(false);
      setPresetCategoryFilter(isMenuCover ? 'menu' : (dish?.category || 'all'));
    }
  }, [isOpen, dish, isMenuCover, initialImageUrl]);

  // Handle Clipboard Paste (Ctrl+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isMenuCover]);

  if (!isOpen) return null;
  if (!isMenuCover && !dish) return null;

  const targetId = isMenuCover ? 'menu-cover' : dish!.id;
  const targetCategory: MealCategory | 'menu' = isMenuCover ? 'menu' : dish!.category;
  const titleLabel = isMenuCover
    ? 'Photo de Couverture du Menu'
    : `Photo : ${dish!.name}`;
  const subtitleLabel = isMenuCover
    ? `Bannière d'ambiance pour « ${menuTitle} »`
    : `Catégorie : ${dish!.category === 'entree' ? 'Entrée' : dish!.category === 'plat' ? 'Plat Chaud' : 'Dessert'}`;

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const compressedDataUrl = await compressImageFile(
        file,
        isMenuCover ? 1200 : 700,
        isMenuCover ? 600 : 500
      );
      setPreviewUrl(compressedDataUrl);
      setUrlInput(compressedDataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du traitement de l’image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessFile(file);
    } else {
      setErrorMsg('Veuillez déposer un fichier image valide (JPG, PNG, WEBP).');
    }
  };

  const handleApplyPreset = (presetUrl: string) => {
    setPreviewUrl(presetUrl);
    setUrlInput(presetUrl);
    setErrorMsg(null);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Veuillez entrer une URL d’image valide.');
      return;
    }
    setPreviewUrl(urlInput.trim());
    setErrorMsg(null);
  };

  const handleDeletePhoto = () => {
    onSavePhoto(targetId, targetCategory, undefined);
    onClose();
  };

  const handleConfirmSave = () => {
    onSavePhoto(targetId, targetCategory, previewUrl.trim() ? previewUrl.trim() : undefined);
    onClose();
  };

  // Filtered presets
  const availablePresets = DISH_IMAGE_PRESETS.filter((p) => {
    if (presetCategoryFilter === 'all') return true;
    return p.category === presetCategoryFilter;
  });

  const hasPhoto = Boolean(previewUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {titleLabel}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {subtitleLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Current / New Photo Preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div
              className={`rounded-2xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 relative shadow-inner flex items-center justify-center ${
                isMenuCover ? 'w-44 h-24' : 'w-28 h-28'
              }`}
            >
              {hasPhoto ? (
                <img
                  src={previewUrl}
                  alt={isMenuCover ? menuTitle : dish?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2 text-slate-400 text-xs flex flex-col items-center">
                  <Camera className="w-6 h-6 mb-1 opacity-50" />
                  <span>Aucune photo</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {hasPhoto ? 'Aperçu actuel de la photo' : 'Aucune photo associée'}
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isMenuCover
                  ? 'La photo de couverture s’affiche en grand format d’en-tête sur la page d’accueil du restaurant.'
                  : 'Ajoutez une belle photo culinaire pour mettre en valeur ce plat et faciliter le choix des agents.'}
              </p>

              {hasPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl('');
                    setUrlInput('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer cette photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-tabs for adding/changing photo */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Téléverser / Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bibliothèque culinaire</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Lien URL</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Tab 1: Upload from computer/phone */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition text-center space-y-2.5 cursor-pointer ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-100/50 scale-[1.01]'
                    : 'border-emerald-500/40 hover:border-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-2xs">
                  <Upload className={`w-6 h-6 ${isProcessing ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                    {isProcessing
                      ? 'Optimisation et compression...'
                      : isDragging
                      ? 'Déposez l’image ici'
                      : 'Cliquez ou glissez-déposez une photo ici'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Formats acceptés : JPG, PNG, WEBP (compression automatique fluide)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Astuce : vous pouvez aussi coller une image directement avec Ctrl+V (ou ⌘+V)
                  </span>
                </div>
              </div>

              {/* Quick actions for mobile camera / file browsing */}
              <div className="flex items-center gap-2 justify-center flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>Parcourir mes fichiers</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-200"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prendre une photo (Appareil)</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setPresetCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    presetCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategoryFilter('menu')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    presetCategoryFilter === 'menu'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bannières Menu
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategoryFilter('entree')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    presetCategoryFilter === 'entree'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Entrées
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategoryFilter('plat')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    presetCategoryFilter === 'plat'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Plats Chauds
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategoryFilter('dessert')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    presetCategoryFilter === 'dessert'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Desserts
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                {availablePresets.map((preset) => {
                  const isChosen = previewUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.url)}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition aspect-video bg-slate-100 ${
                        isChosen
                          ? 'border-emerald-600 ring-2 ring-emerald-400'
                          : 'border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-1.5 text-white">
                        <span className="text-[10px] font-bold block truncate leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isChosen && (
                        <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: URL Direct input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Collez l’URL web directe de l’image :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shrink-0"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {(isMenuCover ? initialImageUrl : dish?.imageUrl) ? (
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition border border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer définitivement</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
