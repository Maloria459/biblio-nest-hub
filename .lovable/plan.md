

## Refonte visuelle et fonctionnelle de "Mes statistiques"

### 1. Filtres avancés avec sélection libre de période

Remplacer les 4 boutons actuels (Semaine / Mois / Année / Depuis mon inscription) par un système plus flexible :

- **Boutons de mode** : Semaine, Mois, Année, Global
- **Navigation dans la période** : Quand Semaine, Mois ou Année est sélectionné, afficher des flèches gauche/droite + le label de la période (ex: "Semaine du 24 mars 2026", "Mars 2026", "2025") pour naviguer librement
- **Bouton "Réinitialiser"** : Ramène au mode "Global" (depuis l'inscription)
- Le mode "Global" n'a pas de navigation, il affiche tout

**Fichier** : `StatistiquesContent.tsx` (refonte du bloc filtres + state `periodOffset` pour naviguer)

### 2. Amélioration visuelle : Cards distinctes par bloc

Chaque bloc sera encadré dans une `Card` avec bordure et padding pour bien les séparer visuellement :

```text
┌─ Card ─────────────────────────────┐
│ 📖 Lecture                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ...    │
│ │ Stat │ │ Stat │ │ Stat │        │
│ └──────┘ └──────┘ └──────┘        │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ Chart       │ │ Chart       │   │
│ └─────────────┘ └─────────────┘   │
└────────────────────────────────────┘
```

**Modifications par bloc** :

- **StatsLectureBlock** : Wrapper `Card` avec titre en `CardHeader`. Sous-sections "Chiffres clés", "Records" et "Graphiques" séparées par des sous-titres légers. Ajouter la distribution des notes (rating chart) et la note moyenne dans ce bloc.
- **StatsBibliothequeBlock** : Wrapper `Card`. Ajouter des icônes aux StatItems (ShoppingCart, Wallet). Les graphiques genre/format restent en grille 2 colonnes.
- **StatsObjectifsBlock** : Wrapper `Card`. Ajouter le nombre total d'objectifs créés et le taux de complétion en plus du nombre réalisé.
- **StatsGamificationBlock** : Wrapper `Card`. Les 5 items restent en grille.
- **StatsCommunauteBlock** : Wrapper `Card`. Les 3 items restent en grille.

### 3. Améliorations de cohérence des données

- **Ajouter la note moyenne et la distribution des notes** dans le bloc Lecture (déjà un composant `StatsRatingChart` existant mais non utilisé)
- **Bibliothèque** : Renommer "Livres achetés" en "Livres acquis" (plus cohérent car inclut les cadeaux), ajouter "Nombre total de livres" comme stat
- **Objectifs** : Ajouter "Objectifs en cours" et "Objectifs créés" en plus de "réalisés"

### 4. Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `StatistiquesContent.tsx` | Filtres avec navigation libre + ajout rating data + objectifs enrichis |
| `StatsLectureBlock.tsx` | Wrapper Card, sous-sections, ajout rating chart |
| `StatsBibliothequeBlock.tsx` | Wrapper Card, icônes, stat "Total livres" |
| `StatsObjectifsBlock.tsx` | Wrapper Card, stats enrichies (en cours, créés, réalisés) |
| `StatsGamificationBlock.tsx` | Wrapper Card |
| `StatsCommunauteBlock.tsx` | Wrapper Card |

