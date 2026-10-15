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

## Partager les composants

```bash
npm run shared:push -- "Description du changement"
npm run shared:pull
npm run shared:pull -- v1
npm run shared:pull -- --list
```

Chaque publication crée automatiquement la version suivante. Garder les fichiers de l'application propres avant une synchronisation ; les conflits et échecs de vérification arrêtent la commande. Les mises à jour ne déploient pas l'application.

Ce projet a été initialisé depuis la version GitHub `v1` vérifiée (`4481fce3c8d75f55adf080329051b3aaf2c9ca93`), disponible dans le cache local, car GitHub était inaccessible pendant la création. Le remote `rail` pointe vers `https://github.com/raillogistic/rail-react.git`. La présence de versions plus récentes n'a pas pu être vérifiée. Aucun chemin de dépendance vers une autre application locale n'est nécessaire.
