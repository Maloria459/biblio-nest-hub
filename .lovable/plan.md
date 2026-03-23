

## Plan : "Mes statistiques" — Page complète

### Vue d'ensemble

Page de statistiques riche, sans top bar ni titre, avec un filtre temporel discret en haut. Le contenu s'organise en sections scrollables avec mini-cards chiffrées et graphiques variés.

### Sources de données

- **`books`** via `BooksContext` : statuts, genres, formats, notes, pages, dates, coups de coeur
- **`reading_sessions`** via `useReadingSessions` : durées, dates, pages par session
- **`profiles.created_at`** via requête Supabase : date d'inscription (pour le filtre)

### Filtre temporel

`ToggleGroup` horizontal en haut du contenu avec 3 options :
- **Ce mois** — filtre sur le mois en cours
- **Cette année** — filtre sur l'année en cours
- **Depuis mon inscription** — aucun filtre

Le filtre s'applique sur `session_date` des sessions et `end_date` / `start_date` des livres.

### Contenu détaillé

**1. Résumé chiffré (grille de 5 mini-cards)**
- Livres terminés
- Pages lues (somme `pagesRead`)
- Temps total de lecture (somme `duration_minutes`)
- Moyenne pages/jour
- Sessions de lecture (nombre total)

**2. Évolution de la lecture (Area chart)**
- Courbe des pages lues par semaine (filtre mois) ou par mois (filtre année/inscription)

**3. Répartition par genre (Donut chart)**
- Camembert des livres par genre, avec légende et pourcentages

**4. Répartition par format (Bar chart horizontal)**
- Barres : Poche, Broché, Numérique, Audio, etc.

**5. Distribution des notes (Bar chart vertical)**
- Histogramme des notes 1-5 étoiles + note moyenne affichée

**6. Temps de lecture par jour de la semaine (Radar ou Bar chart)**
- Répartition du temps selon les jours (lundi à dimanche)

**7. Records et faits marquants (mini-cards)**
- Plus long livre lu, session la plus longue, meilleur mois, coups de coeur, moyenne temps/session

### Structure technique

```text
src/components/StatistiquesContent.tsx            -- Conteneur + filtre
src/components/stats/StatsSummaryCards.tsx         -- 5 mini-cards
src/components/stats/StatsReadingEvolution.tsx     -- Area chart
src/components/stats/StatsGenreChart.tsx           -- Donut
src/components/stats/StatsFormatChart.tsx          -- Bar horizontal
src/components/stats/StatsRatingChart.tsx          -- Bar vertical
src/components/stats/StatsWeekdayChart.tsx         -- Radar/Bar
src/components/stats/StatsHighlights.tsx           -- Records
```

- Branchement dans `src/pages/Profil.tsx` sur l'onglet "Mes statistiques"
- Calculs côté client, graphiques via `recharts` + composants `chart.tsx` existants
- Responsive : 2 colonnes desktop, 1 colonne mobile

