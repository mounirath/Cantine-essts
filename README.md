# MensaStaff - Réservation de Repas du Personnel

Application moderne et responsive de gestion et de réservation des repas pour le personnel d'établissement, avec contrôle horaire strict (08h00 - 10h00), gestion dynamique des menus, contrôle par QR code au passe-plat, et synchronisation avec Supabase ou stockage local.

---

## 🚀 Fonctionnalités Principales

- **Contrôle horaire strict** : Réservation autorisée uniquement entre **08h00 et 10h00** (avec barre de simulation horaire pour tests et démonstrations).
- **Mise en avant du Plat du Jour** : Encart vedette avec descriptif, allergènes, calories et sélection directe.
- **Liste du Personnel Autorisé (Whitelist)** :
  - Autocomplétion intelligente par nom ou matricule.
  - Prévention des doubles réservations le même jour.
- **Gestion des Menus Multiples** :
  - L'administrateur peut créer plusieurs menus et choisir en 1 clic le menu actif affiché pour les utilisateurs.
  - Choix du Plat du Jour vedette dans chaque menu.
- **Validation au Passe-Plat par QR Code** :
  - Chaque réservation génère un QR code unique de retrait.
  - Module de scan caméra ou saisie rapide pour confirmer le service du repas.
- **Export Excel (`.xlsx`)** : Export complet de la liste des inscrits du jour pour la comptabilité et la cuisine.
- **Personnalisation & Stockage** :
  - Logo de l'établissement modifiable par l'administrateur (upload, URL ou icône).
  - Mode hors-ligne local (`localStorage`) ou synchronisation cloud **Supabase**.

---

## ⚙️ Workflows GitHub Actions inclus

Deux workflows automatisés sont configurés dans `.github/workflows/` :

1. **`ci.yml` (Intégration Continue)** :
   - Déclenché à chaque `push` ou `pull_request` sur les branches `main` et `master`.
   - Exécute le contrôle de typage TypeScript (`npm run lint`).
   - Effectue la compilation de production (`npm run build`).
   - Archive les fichiers de compilation (`dist/`) dans les artefacts GitHub.

2. **`deploy.yml` (Déploiement GitHub Pages)** :
   - Compile l'application et la déploie automatiquement sur GitHub Pages à chaque mise à jour de la branche `main` / `master`.
   - Pour activer GitHub Pages sur votre dépôt :
     1. Rendez-vous sur votre dépôt GitHub : **Settings > Pages**.
     2. Sous **Source**, sélectionnez **GitHub Actions**.
     3. Le workflow publiera automatiquement votre application en ligne.

---

## 🛠️ Installation & Démarrage local

```bash
# 1. Cloner le projet
git clone <url-du-depot>
cd <nom-du-projet>

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Vérifier les types et compiler pour la production
npm run lint
npm run build
```
