# ModelForm

Le composant `ModelForm` est une abstraction de haut niveau permettant de générer automatiquement des formulaires complexes à partir des modèles Django (via l'API GraphQL Rail Django). Il encapsule le chargement du contrat, la récupération des données initiales, la validation et la soumission des mutations.

## Aperçu

`ModelForm` utilise le composant `DynamicForm` en interne mais ajoute une couche intelligente pour :
1.  **Introspection** : Récupérer le schéma du formulaire depuis le backend.
2.  **Gestion du Mode** : Gérer les modes `CREATE`, `UPDATE` et `VIEW` nativement.
3.  **Relations Imbriquées** : Gérer les relations One-to-One, One-to-Many et Many-to-Many.
4.  **Mutations Automatiques** : Appeler les mutations `createModel` ou `updateModel` correspondantes.

## Utilisation de Base

```tsx
import { ModelForm } from "@/widgets/model-form";
import type { PatrimoineAsset } from "@/models";

export function AssetForm({ id }: { id?: string }) {
  return (
    <ModelForm<PatrimoineAsset>
      app="patrimoine"
      model="Asset"
      mode={id ? "UPDATE" : "CREATE"}
      objectId={id}
      title={id ? "Modifier le Bien" : "Nouveau Bien"}
    />
  );
}
```

## Propriétés Principales

| Propriété | Type | Description |
| :--- | :--- | :--- |
| `app` | `string` | Le nom de l'application Django (ex: "patrimoine"). |
| `model` | `string` | Le nom du modèle Django (ex: "Asset"). |
| `mode` | `"CREATE" \| "UPDATE" \| "VIEW"` | Le mode d'opération du formulaire. |
| `objectId` | `string \| number` | L'ID de l'objet à charger (requis pour `UPDATE` et `VIEW`). |
| `title` | `ReactNode` | Titre affiché dans l'en-tête. |
| `description` | `ReactNode` | Description affichée sous le titre. |
| `includeNested` | `boolean` | Si `true`, inclut automatiquement les relations imbriquées. |
| `nested` | `ModelFormNestedConfig` | Configuration détaillée des relations imbriquées (voir section dédiée). |

## Personnalisation du Schéma

Vous pouvez affiner le schéma généré via plusieurs propriétés :

### Filtrage des Champs

-   `onlyFields` : Liste des chemins de champs à afficher exclusivement.
-   `excludeFields` : Liste des chemins de champs à masquer.
-   `onlyRequired` : N'affiche que les champs obligatoires selon le modèle.

### Overrides (Surcharges)

La propriété `fieldOverrides` permet de modifier l'apparence ou le comportement d'un champ spécifique. Chaque surcharge peut être soit un objet partiel de configuration, soit une fonction recevant la configuration générée.

#### Propriétés de base d'un champ :
- `label`, `description`, `placeholder`, `helpText` : Textes d'accompagnement.
- `required` : Force le caractère obligatoire.
- `disabled`, `readOnly`, `hidden` : Contrôle de l'état (statique).
- `className`, `colSpan` : Style et mise en page (grille).

#### Propriétés Réactives et Calculées :
C'est ici que réside la puissance de personnalisation pour les règles métier complexes :

- `visible: (values) => boolean` : Affiche ou masque le champ dynamiquement selon les autres valeurs du formulaire.
- `disabledWhen: (values) => boolean` : Désactive le champ dynamiquement.
- `compute: (values) => any` : Calcule automatiquement la valeur du champ à partir d'autres champs.
- `dependsOn: string[]` : Liste des champs dont dépend ce champ (déclenche recalcul de `visible`, `disabledWhen`, `compute`).
- `transform: (value) => any` : Transforme la valeur avant qu'elle ne soit enregistrée dans l'état du formulaire.

```tsx
fieldOverrides={{
  // Exemple de champ calculé et réactif
  totalPrice: {
    label: "Prix Total",
    compute: (values) => values.quantity * values.unitPrice,
    dependsOn: ["quantity", "unitPrice"],
    readOnly: true
  },
  // Exemple de visibilité conditionnelle
  reason: {
    visible: (values) => values.status === "REJECTED",
    dependsOn: ["status"],
    required: true
  }
}}
```

### Types de Champs Supportés

`ModelForm` (via `DynamicForm`) supporte de nombreux types d'entrées :

| Type | Description | Options spécifiques |
| :--- | :--- | :--- |
| `text`, `textarea` | Saisie de texte simple ou multiligne. | `minLength`, `maxLength`, `rows` |
| `number`, `decimal` | Saisie numérique. | `min`, `max`, `step`, `precision` |
| `select`, `radio` | Choix parmi une liste fixe. | `options: { label, value }[]` |
| `select-query` | Recherche asynchrone dans une autre table. | `relatedModel`, `graphql`, `inlineCreate` |
| `date`, `datetime-local` | Sélecteurs de date et heure. | `min`, `max` |
| `file` | Upload de fichiers. | `accept`, `multiple` |
| `rich-text` | Éditeur WYSIWYG. | `toolbar`, `minHeight` |
| `custom` | Rendu totalement personnalisé. | `render: (ctx) => ReactNode` |

#### Focus sur `select-query`

Pour les relations de type clé étrangère (FK), `ModelForm` utilise `select-query`. Vous pouvez le configurer pour ajouter la création en ligne :

```tsx
fieldOverrides={{
  category: {
    type: "select-query",
    inlineCreate: {
      enabled: true,
      title: "Nouvelle Catégorie",
      modelName: "Category"
    }
  }
}}
```

### Sections

Vous pouvez regrouper des champs dans des sections personnalisées via `sectionOverrides` :

```tsx
sectionOverrides={{
  identity: {
    title: "Informations d'identité",
    columns: 2,
    collapsible: true
  }
}}
```

Ou utiliser `generatedSections` pour redéfinir complètement le layout :

```tsx
generatedSections={[
  {
    id: "main",
    title: "Général",
    fields: ["name", "code", "type"]
  },
  {
    id: "finance",
    title: "Données financières",
    fields: ["price", "purchaseDate", "depreciationPeriod"]
  }
]}
```

## Gestion des Relations Imbriquées

La propriété `nested` est extrêmement puissante pour gérer les relations. Elle accepte soit un tableau de clés de relations, soit un objet de configuration.

### Exemple de Configuration

```tsx
<ModelForm
  nested={{
    // Relation One-to-Many (ex: pièces jointes)
    attachments: {
      title: "Documents joints",
      itemLabel: "Document",
      columns: 2,
      addButton: { label: "Ajouter un fichier" },
      sortable: { enabled: true, orderField: "position" },
      fieldOverrides: {
        file: { label: "Fichier source" }
      }
    },
    // Relation Many-to-Many
    tags: {
      enabled: true,
      onlyFields: ["id", "name"]
    }
  }}
/>
```

### Options des Relations Imbriquées

-   `addButton` : Configure le bouton d'ajout (label, activation).
-   `sortable` : Active le tri par glisser-déposer ou boutons.
-   `minItems` / `maxItems` : Limites sur le nombre d'éléments.
-   `collapsible` : Permet de réduire la section de la relation.
-   `scalarListOperation` : `"set"` (remplacement) ou `"connect"` (ajout).
-   `removeOperation` : `"disconnect"` (délier) ou `"delete"` (supprimer de la DB).

## Logique et État du Formulaire

`ModelForm` expose des propriétés pour injecter de la logique personnalisée, héritées de `DynamicForm`.

### `state` : Contrôle de l'état
Permet de définir des valeurs par défaut ou de contrôler l'état de chargement.
```tsx
state={{
  defaultValues: { purchaseDate: new Date() },
  readOnly: false
}}
```

### `behavior` : Comportement et Validation
Permet d'ajouter des validations personnalisées ou d'intercepter la soumission.
```tsx
behavior={{
  validate: (values) => {
    const errors: any = {};
    if (values.price < 0) errors.price = "Le prix ne peut pas être négatif";
    return errors;
  },
  onSubmit: async (values) => {
    console.log("Données soumises :", values);
    // Si onSubmit est présent, la mutation automatique est désactivée.
  }
}}
```

### `layout` : Organisation Visuelle
```tsx
layout={{
  variant: "popup", // ou "standard", "compact"
  columns: 2,
  ordering: { order: ["name", "price", "description"] }
}}
```

### `actions` : Boutons de Soumission
```tsx
actions={{
  submitLabel: "Enregistrer les modifications",
  resetLabel: "Annuler",
  extra: <Button variant="outline">Exporter en PDF</Button>
}}
```

## Validation Avancée

Vous pouvez étendre les validateurs générés via `validatorExtensions`. Cela permet de garder les validations backend tout en ajoutant des règles frontend complexes.

```tsx
validatorExtensions={{
  // Chemin du champ : fonction de validation
  "dimensions.height": (value) => value > 200 ? "Trop haut" : null
}}
```

## Callbacks de Cycle de Vie

-   `onContractLoaded` : Appelé quand le schéma a été chargé depuis le backend.
-   `onInitialDataLoaded` : Appelé quand les données de l'objet (pour UPDATE) ont été chargées.
-   `onSubmitResult` : Appelé après une tentative de soumission automatique avec le résultat détaillé de la mutation.
-   `onLoadError` : Appelé en cas d'erreur de chargement (schéma ou données).

## Architecture et Sous-composants

`ModelForm` n'est pas qu'un seul fichier, il s'appuie sur une suite de hooks spécialisés :

1.  `useModelFormQueries` : Gère les appels Apollo GraphQL pour le contrat et les données.
2.  `useGeneratedModelForm` : Transforme le contrat brut en un schéma `DynamicForm` et gère la soumission.
3.  `useModelFormSchema` : Applique les `fieldOverrides`, filtre les champs et gère la structure des sections.
4.  `useModelFormLogic` : Fusionne les comportements générés avec les comportements utilisateurs (`validate`, `onSubmit`).

En interne, le rendu est délégué à `DynamicForm`, qui utilise une fabrique de composants d'entrée (`inputs/factory.tsx`) pour afficher les bons contrôles (Text, Date, Select, etc.) en fonction des types déclarés dans le schéma.

### Enregistrement d'un Rendu d'Input Personnalisé

Si les types d'entrées standards ne suffisent pas, vous pouvez enregistrer un nouveau moteur de rendu globalement :

```tsx
import { registerInputRenderer } from "@/widgets/model-form";

registerInputRenderer("my-custom-type", ({ config, field, form }) => {
  return (
    <input 
      value={field.state.value} 
      onChange={(e) => field.handleChange(e.target.value)}
      className={config.className}
    />
  );
});
```

Une fois enregistré, vous pouvez l'utiliser dans vos `fieldOverrides` via `type: "my-custom-type"`.
