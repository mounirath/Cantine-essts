export interface DishImagePreset {
  id: string;
  name: string;
  category: 'entree' | 'plat' | 'dessert' | 'menu';
  url: string;
}

export const DISH_IMAGE_PRESETS: DishImagePreset[] = [
  // ==========================================
  // Bannières / Couvertures de Menu
  // ==========================================
  {
    id: 'banniere-cantine-buffet',
    name: 'Bannière Buffet & Saveurs du Réfectoire',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'banniere-cantine-chef',
    name: 'Bannière Brigade & Préparation Fraîche',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1507048821117-657942f128f4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'banniere-cantine-saine',
    name: 'Bannière Produits Frais & Équilibrés',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'banniere-plateau-repas',
    name: 'Bannière Déjeuner Convivial & Plateau Gourmand',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'banniere-ambiance-table',
    name: 'Bannière Ambiance Brasserie & Table du Midi',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'banniere-epices-saveurs',
    name: 'Bannière Épices & Saveurs Méditerranéennes',
    category: 'menu',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  },

  // ==========================================
  // Plats Chauds
  // ==========================================
  {
    id: 'couscous',
    name: 'Couscous royal & légumes',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'saumon',
    name: 'Pavé de saumon grillé & légumes',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'poulet',
    name: 'Blanc de poulet rôti aux herbes',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'risotto',
    name: 'Risotto crémeux aux champignons',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'steak',
    name: 'Steak grillé façon bouchère',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pates',
    name: 'Pâtes penne à la bolognaise',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tajine',
    name: 'Tajine fondant aux légumes et épices',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'poisson-riz',
    name: 'Filet de poisson blanc & riz parfumé',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'curry-legumes',
    name: 'Curry végétarien aux légumes de saison',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'lasagnes',
    name: 'Lasagnes traditionnelles gratinées',
    category: 'plat',
    url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80',
  },

  // ==========================================
  // Entrées
  // ==========================================
  {
    id: 'salade-composee',
    name: 'Salade fraîcheur méditerranéenne',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'veloute',
    name: 'Velouté onctueux de légumes',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'taboule',
    name: 'Taboulé oriental à la menthe',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'carottes',
    name: 'Carottes râpées citronnées',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'salade-cesar',
    name: 'Salade César croquante',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'soupe-chorba',
    name: 'Soupe chaude réconfortante',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'crudites',
    name: 'Assiette panachée de crudités',
    category: 'entree',
    url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
  },

  // ==========================================
  // Desserts
  // ==========================================
  {
    id: 'tarte-pommes',
    name: 'Tarte aux pommes dorée',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'mousse-choco',
    name: 'Mousse au chocolat maison',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'salade-fruits',
    name: 'Salade de fruits frais',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'eclair',
    name: 'Éclair pâtissier au café',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu traditionnel',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'creme-dessert',
    name: 'Crème renversée au caramel',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'yaourt-fruits',
    name: 'Yaourt onctueux & coulis de fruits rouges',
    category: 'dessert',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Compresse et redimensionne un fichier image local vers un Data URL JPEG léger
 */
export function compressImageFile(
  file: File,
  maxWidth = 700,
  maxHeight = 500,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné n’est pas une image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Impossible de charger l’image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}
