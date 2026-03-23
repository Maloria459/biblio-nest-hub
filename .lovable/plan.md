

## Plan révisé : "Mes objectifs personnels" — Liste de types non exhaustive

Le système stocke un `objective_type` en base et le hook calcule la progression dynamiquement. Voici la liste complète des types proposés, organisés par catégorie. L'utilisateur choisit parmi cette liste lors de la création d'un objectif.

### Types d'objectifs

**Lecture**
- Lire X livres
- Lire X pages
- Lire pendant X minutes
- Effectuer X sessions de lecture
- Lire X livres d'un auteur (filtre : auteur)
- Lire X livres d'un genre (filtre : genre)
- Lire X livres d'un format (filtre : format)
- Lire X livres d'un éditeur (filtre : éditeur)
- Lire X livres d'une série (filtre : série)
- Terminer un livre de plus de X pages

**Bibliothèque**
- Acheter X livres
- Ajouter X livres à la wishlist
- Ajouter X livres dans ma PAL
- Vider X livres de ma PAL (passer de PAL a lu)
- Prêter X livres
- Emprunter X livres
- Créer X collections
- Ajouter X livres dans des collections
- Rédiger X avis
- Ajouter X citations
- Dépenser moins de X euros en livres

**Qualité / Engagement**
- Avoir X coups de coeur
- Noter X livres
- Atteindre une note moyenne >= X
- Recommander X livres du mois
- Renseigner X personnages préférés
- Renseigner X passages préférés

**Sessions de lecture**
- Lire X jours différents (régularité)
- Faire une session de plus de X minutes
- Atteindre X pages lues en une session

**Communauté**
- Participer à X évènements littéraires
- Participer à X clubs de lecteurs

### Chaque type est défini par

| Champ | Description |
|---|---|
| `objective_type` | Clé technique (ex: `read_books`, `read_author`) |
| `target_value` | Cible chiffrée |
| `filter_value` | Valeur optionnelle (auteur, genre, format, éditeur, série) |
| `period_type` | `month`, `year`, `custom` |

### Structure technique inchangée

- Table `personal_objectives` + RLS
- Hook `usePersonalObjectives` avec un `switch` sur chaque type pour calculer `currentValue`
- Modal de création avec types groupés par catégorie
- Page liste + carte dashboard (3 objectifs épinglés)

### Fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Table `personal_objectives` + RLS |
| `src/hooks/usePersonalObjectives.ts` | CRUD + calcul progression (tous les types) |
| `src/components/PersonalObjectivesContent.tsx` | Page liste + état vide |
| `src/components/CreateObjectiveModal.tsx` | Formulaire avec types groupés |
| `src/pages/Profil.tsx` | Brancher sur l'onglet |
| `src/components/dashboard/PersonalObjectivesCard.tsx` | Brancher sur le hook |

