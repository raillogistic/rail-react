# Plateforme de commandes

Frontend React vide basé sur Rail React : authentification, mise en page, thèmes et composants partagés, avec une page d'accueil. Aucun module métier, commande ou jeu de données n'est ajouté.

## Démarrer

```bash
npm run dev
```

Configurer les URL du backend Rail-Django dans `.env` avant d'utiliser l'authentification ou les données. Ce fichier est ignoré par Git ; ses valeurs initiales sont des exemples. Aucun identifiant ni paramètre d'Achat n'a été copié.

## Organisation

- `src/projects/` : pages et fonctionnalités propres à cette plateforme.
- `src/application.ts` : identité, navigation et extensions de l'application.
- `rail/` : infrastructure et composants partagés, intégrés par Git subtree et npm workspace.

## Vérifier

```bash
npm run check:architecture
npm run test:unit
npm run build
```

## Partager les projets métier

Les projets partagés restent dans `src/projects/`, par exemple `src/projects/shared_projects/partners/`. Toutes les interfaces utilisent le dépôt privé unique [shared_apps](https://github.com/raillogistic/shared_apps).

```powershell
npm run apps:pull -- shared_projects.partners
npm run apps:push -- shared_projects.partners -m "Améliorer les partenaires"

# Télécharger ou publier tout le groupe.
npm run apps:pull -- shared_projects
npm run apps:push -- shared_projects -m "Publier les projets partagés"
```

Les dépendances sont installées et les pages sont enregistrées automatiquement selon les permissions. Les choix locaux de pages restent dans `src/application/shared_project_options.ts`. Chaque backend doit fournir les modèles et permissions attendus. Les projets partagés restent indépendants du dossier `rail/`.

Pour préparer une nouvelle interface :

```powershell
npx --yes --package="git+https://github.com/raillogistic/shared_apps.git" shared-apps init
```

## Partager les composants du framework

```bash
npm run shared:push -- "Description du changement"
npm run shared:pull
npm run shared:pull -- v1
npm run shared:pull -- --list
```

Chaque publication crée automatiquement la version suivante. Garder les fichiers de l'application propres avant une synchronisation ; les conflits et échecs de vérification arrêtent la commande. Les mises à jour ne déploient pas l'application.

Ce projet a été initialisé depuis la version GitHub `v1` vérifiée (`4481fce3c8d75f55adf080329051b3aaf2c9ca93`), disponible dans le cache local, car GitHub était inaccessible pendant la création. Le remote `rail` pointe vers `https://github.com/raillogistic/rail-react.git`. La présence de versions plus récentes n'a pas pu être vérifiée. Aucun chemin de dépendance vers une autre application locale n'est nécessaire.
