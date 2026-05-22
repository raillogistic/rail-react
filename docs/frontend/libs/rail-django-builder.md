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

Le composant `ModelForm` agit comme un pont vers le composant de bas niveau `DynamicForm` et offre plusieurs niveaux d'extensibilité via ses propriétés :

#### 1. Surcharge des Champs (`fieldOverrides`)

La propriété `fieldOverrides` permet de redéfinir n'importe quel aspect d'un champ généré automatiquement par le backend. 

```tsx
<ModelForm
  app="inventory"
  model="Product"
  mode="CREATE"
  fieldOverrides={{
    price: {
      required: true,
      description: "Le prix doit inclure la TVA",
      component: CustomCurrencyInput, // Remplacer complètement le rendu natif
    },
    reference: {
      readOnly: true, // Rendre le champ non modifiable
      label: "Code Référence",
    },
    status: {
      // Pour forcer un champ en select si ce n'est pas le comportement par défaut
      type: "select",
      choices: [
        { value: "draft", label: "Brouillon" },
        { value: "published", label: "Publié" }
      ]
    }
  }}
/>
```

#### 2. Layout & Mise en page (`layout`, `sectionOverrides`, `generatedSections`)

Vous pouvez contrôler la façon dont le formulaire s'affiche de manière très granulaire.
- **`layout`** : Contrôle la configuration globale de l'interface (variantes, colonnes, indicateurs).
- **`generatedSections`** : Redéfinit complètement les sections du formulaire.
- **`sectionOverrides`** : Permet de fusionner des propriétés sur les sections renvoyées par le backend (par exemple, pour modifier uniquement le titre d'une section existante).

```tsx
<ModelForm
  app="inventory"
  model="Product"
  mode="CREATE"
  layout={{
    variant: "popup", // Styles adaptés pour un affichage dans une modale/dialogue
    gridCols: 2, // Configuration globale sur 2 colonnes
    hideRequiredIndicators: false,
  }}
  generatedSections={{
    layout: [
      {
        id: "general",
        title: "Informations Générales",
        fields: ["name", "reference", "price"],
        columns: 2 // Surcharge locale pour cette section spécifique
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

> **Attention (Nested Relations)** : Pour les champs de type `ManyToManyField` ou les relations inverses gérés par des contrôles imbriqués, il est **impératif d'inclure ces champs dans la structure `generatedSections`** si vous souhaitez qu'ils soient affichés et modifiables. 

#### 3. État et Valeurs Par Défaut (`state`)

Vous pouvez forcer des valeurs initiales côté frontend en utilisant la propriété `state`. Les valeurs fournies ici prendront le dessus sur celles du backend (utile en mode CREATE).

```tsx
<ModelForm
  app="inventory"
  model="Product"
  mode="CREATE"
  state={{
    defaultValues: {
      status: "draft",
      category: "cat_default_123"
    }
  }}
/>
```

#### 4. Comportement et Logique (`behavior`)

`behavior` permet de manipuler la logique interne, par exemple ajouter un validateur personnalisé complexe ou désactiver la soumission à la touche Entrée.

```tsx
<ModelForm
  // ...
  behavior={{
    disableEnterSubmit: true,
    formValidator: (values) => {
      const errors = {};
      if (values.price < 0) {
        errors.price = "Le prix ne peut pas être négatif.";
      }
      return errors;
    }
  }}
/>
```

#### 5. Actions et Boutons (`actions`)

Vous pouvez personnaliser la barre d'actions en bas du formulaire.

```tsx
<ModelForm
  // ...
  actions={{
    submitLabel: "Enregistrer le produit",
    cancelLabel: "Annuler",
    hideCancel: false, // Utile pour cacher le bouton annuler
    submitIcon: <SaveIcon className="size-4" />,
  }}
/>
```

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
