

## Audit du formulaire de création d'objectifs

### Problèmes identifiés

1. **Pas d'espacement entre les champs** — Les `div.space-y-1.5` sont empilés sans `gap` ni `space-y` sur le conteneur parent, ce qui colle tous les champs ensemble.

2. **Pas de validation visuelle** — Aucun message d'erreur si la valeur cible est 0 ou négative, si le filtre obligatoire est vide, etc. Le bouton est juste désactivé sans explication.

3. **Pas de description/aide contextuelle** — L'utilisateur ne sait pas ce que signifie concrètement chaque type d'objectif ni comment la progression sera calculée.

4. **Le filtre obligatoire n'est pas signalé** — Quand un type nécessite un filtre (auteur, genre...), rien n'indique que c'est requis pour valider.

5. **Pas de prévisualisation de l'objectif** — L'utilisateur ne voit pas le libellé final de son objectif avant de le créer.

6. **Bouton Créer dans la zone scrollable** — Le bouton de validation devrait être dans un footer fixe, pas dans la zone qui scroll.

7. **Pas de confirmation avant fermeture** — Si l'utilisateur a rempli des champs et clique sur l'overlay, tout est perdu sans avertissement.

---

### Propositions d'amélioration

| # | Amélioration | Détail |
|---|---|---|
| 1 | **Espacement correct** | Ajouter `space-y-5` sur le conteneur des champs |
| 2 | **Prévisualisation du libellé** | Afficher en temps réel le libellé final de l'objectif (ex: "Lire 12 livres de Victor Hugo (ce mois)") dans un encadré en bas du formulaire |
| 3 | **Messages de validation inline** | Afficher des messages d'erreur sous chaque champ invalide (valeur ≤ 0, filtre manquant, dates incohérentes) |
| 4 | **Description contextuelle du type** | Ajouter une petite description sous le sélecteur de type expliquant comment la progression est mesurée |
| 5 | **Footer fixe avec bouton** | Sortir le bouton "Créer" du scroll et le placer dans un footer fixe avec bordure en haut |
| 6 | **Indicateur de filtre requis** | Marquer le champ filtre avec un astérisque rouge quand il est obligatoire, et bloquer la validation si vide |
| 7 | **Icône par catégorie** | Ajouter une icône devant chaque catégorie dans le sélecteur de type (livre, bibliothèque, étoile, chrono, utilisateurs) |
| 8 | **Saisie libre + sélection pour le filtre** | Permettre de taper un auteur/éditeur qui n'est pas encore dans la bibliothèque via un Combobox (sélection + saisie libre) |

---

### Plan d'implémentation (fichier unique : `CreateObjectiveModal.tsx`)

1. **Restructurer le layout** : séparer header / corps scrollable / footer fixe avec le bouton
2. **Ajouter `space-y-5`** sur le conteneur des champs
3. **Ajouter un encadré de prévisualisation** qui reconstruit le libellé dynamiquement (même logique que dans le hook)
4. **Ajouter des messages d'erreur inline** sous les champs invalides (valeur cible, filtre, dates)
5. **Ajouter des descriptions contextuelles** par type d'objectif via un mapping `OBJECTIVE_DESCRIPTIONS`
6. **Ajouter des icônes par catégorie** dans le Select groupé (Book, Library, Star, Clock, Users)
7. **Marquer les champs requis** avec un astérisque visuel
8. **Déplacer le bouton dans un footer fixe** avec `border-t` et `px-6 py-4`

Aucune modification de base de données nécessaire. Uniquement des changements UI dans `CreateObjectiveModal.tsx` et potentiellement l'ajout de descriptions dans `usePersonalObjectives.ts`.

