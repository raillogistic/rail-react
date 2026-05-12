# Rail Django Builder : Guide d'Utilisation et de Personnalisation des Composants Frontend

Le module `rail-django-builder` fournit un ensemble de composants React haut niveau qui interagissent directement avec l'API GraphQL générée par le backend `rail-django`. Ces composants permettent de créer des interfaces utilisateur riches, dynamiques et basées sur le schéma de données (metadata-driven) en un minimum de code.

Ce guide décrit l'utilisation, l'extension et la personnalisation des trois composants principaux : `ModelForm`, `DynamicModelTable` et `ModelDynamicDetail`.

---

## 1. `ModelForm`

`ModelForm` est utilisé pour créer et éditer des entités de données. Il récupère automatiquement le contrat du formulaire et les données initiales depuis le backend, gère la validation et orchestre les mutations GraphQL de manière transparente.

### Utilisation de Base

Le composant nécessite l'application (`app`), le modèle (`model`) et le mode d'opération (`mode`). Si le mode est `"UPDATE"`, l'identifiant de l'objet (`objectId`) est requis.

```tsx
import { ModelForm } from "@/widgets/model-form";

export function ProduitForm() {
  return (
    <ModelForm
      app="inventory"
      model="Product"
      mode="CREATE" // Utilisez "UPDATE" pour modifier un enregistrement existant
      // objectId="123" // Requis si mode="UPDATE"
      title="Créer un Produit"
      description="Saisissez les détails du nouveau produit."
      onSubmitResult={(result) => {
        if (result.ok) {
          console.log("Produit créé avec succès !");
        }
      }}
    />
  );
}
```

### Personnalisation et Extension

`ModelForm` offre plusieurs niveaux d'extensibilité via ses propriétés :

- **`fieldOverrides`** : Permet de surcharger le comportement d'un champ généré automatiquement. Vous pouvez modifier le type de rendu, ajouter des contraintes (disabled, readOnly) ou remplacer complètement le composant de saisie.

```tsx
<ModelForm
  app="inventory"
  model="Product"
  mode="CREATE"
  fieldOverrides={{
    price: {
      required: true,
      component: CustomCurrencyInput, // Remplacer le rendu natif
    },
    reference: {
      readOnly: true, // Forcer le champ en lecture seule
    }
  }}
/>
```

- **`sectionOverrides`** et **`generatedSections`** : Modifie la mise en page. Vous pouvez redéfinir les sections (groupes de champs) du formulaire, changer le nombre de colonnes, ou masquer certaines sections.

```tsx
<ModelForm
  // ...
  generatedSections={{
    layout: [
      {
        id: "general",
        title: "Informations Générales",
        fields: ["name", "reference", "price"],
        columns: 2 // Afficher sur deux colonnes
      },
      {
        id: "relations",
        title: "Associations",
        fields: ["category", "tags"]
      }
    ]
  }}
/>
```

- **Relations Multiples (Nested)** : Pour les champs de type `ManyToManyField` ou les relations inverses, il est impératif d'inclure ces champs dans les `generatedSections` si on souhaite qu'ils soient affichés et modifiables. 

---

## 2. `DynamicModelTable`

`DynamicModelTable` est conçu pour afficher une liste d'enregistrements (List View). Il gère nativement la pagination côté serveur, le tri, le filtrage avancé et l'affichage des colonnes relationnelles.

### Utilisation de Base

```tsx
import { DynamicModelTable } from "@/widgets/model-table";

export function ProduitListe() {
  return (
    <DynamicModelTable
      app="inventory"
      model="Product"
      baseTable={{
        fields: ["id", "reference", "name", "price", "status", "createdAt"],
        quickFilters: ["name", "status"], // Champs disponibles pour le filtrage rapide
      }}
    />
  );
}
```

### Personnalisation et Extension

- **`baseTable.fields`** : Spécifie les colonnes à afficher. Peut inclure des champs relationnels profonds (ex: `"category.name"`).
- **`baseTable.quickFilters`** : Active la barre de recherche rapide pour les champs spécifiés ou les filtres personnalisés configurés via `@filter` côté Django.
- **`baseTable.columnActions`** : Ajoute des actions contextuelles au bout de chaque ligne (éditer, supprimer, ou des méthodes personnalisées).
- **`baseTable.topActions`** : Permet d'insérer des boutons globaux en haut de la table (ex: "Créer", "Exporter").
- **`baseTable.expand`** : (Sub-rows) Permet d'afficher un composant détaillé lorsqu'on clique sur une ligne.

```tsx
<DynamicModelTable
  // ...
  baseTable={{
    // ...
    columnActions: {
      items: [
        {
          id: "custom_action",
          label: "Archiver",
          icon: ArchiveIcon,
          onClick: (row) => archiverProduit(row.id),
        }
      ]
    },
    expand: {
      render: (row) => <ProduitDetailApercu data={row} />,
    }
  }}
/>
```

---

## 3. `ModelDynamicDetail`

`ModelDynamicDetail` est le composant de vue de détails (Read-Only). Il extrait toutes les métadonnées de l'objet et de ses relations, supporte les templates d'impression (PDF/Excel) et permet d'exécuter des mutations complexes (FSM transitions).

### Utilisation de Base

```tsx
import { ModelDynamicDetail } from "@/widgets/model-details";

export function ProduitDetail({ id }) {
  return (
    <ModelDynamicDetail
      app="inventory"
      model="Product"
      objectId={id}
    />
  );
}
```

### Personnalisation et Extension

- **`tabs`** : Permet d'organiser les relations complexes ou d'autres vues sous forme d'onglets.
- **`headerActions`** : Ajouter des actions (boutons) dans l'en-tête de la page de détail. Par défaut, les actions d'édition et de suppression sont intégrées selon les permissions (RBAC/ABAC).
- **`customMutations`** : Modifie la façon dont les mutations exposées par le backend (FSM, actions spécifiques) sont affichées ou traitées.
- **`sectionOverrides`** : Tout comme `ModelForm`, permet d'altérer la structure des groupes d'informations.

```tsx
<ModelDynamicDetail
  app="inventory"
  model="Product"
  objectId="123"
  tabs={[
    {
      id: "general",
      title: "Général",
      order: 1,
    },
    {
      id: "historique",
      title: "Historique d'Affectation",
      order: 2,
    }
  ]}
  headerActions={[
    {
      position: 10,
      render: ({ data }) => (
        <Button onClick={() => imprimerEtiquette(data.id)}>
          Imprimer Étiquette
        </Button>
      )
    }
  ]}
/>
```

## Résumé des Bonnes Pratiques

1. **Convention GraphQL (`camelCase`)** : Le backend `rail-django` expose désormais l'API en `camelCase`. Assurez-vous d'utiliser `camelCase` pour vos sélecteurs (`baseTable.fields`), les clés de variables, et les filtres (`where`).
2. **Métadonnées** : Favorisez la configuration côté Backend. Utilisez les décorateurs Python `@field`, `@filter`, `@model_pdf_template` qui seront automatiquement reflétés dans les trois composants sans écrire de code Frontend supplémentaire.
3. **ModelForm & Nested Relations** : Pour modifier une relation `ManyToMany` ou inversée depuis `ModelForm`, il faut l'inclure dans les sections (`generatedSections`).
4. **Layout et Variant** : Utilisez `variant: "popup"` dans la configuration de `layout` de `ModelForm` si vous l'affichez dans un modale.
