

## Refonte complète du système d'objectifs personnels

### Résumé
Remplacement intégral des `OBJECTIVE_TYPES` par les 39 objectifs demandés, organisés en **7 catégories**. Refonte du formulaire, du calcul de progression et des cartes d'objectifs.

---

### Nouvelles catégories et objectifs

```text
📖 LECTURE (PAGES & TEMPS)
├─ read_pages_period       Lire X pages (période sélectionnable)
├─ read_pages_session      Lire X pages pendant une session
├─ read_duration           Lire pendant X minutes/heures
├─ read_duration_day       Lire X min/h par jour
├─ read_duration_week      Lire X min/h par semaine
├─ read_duration_month     Lire X min/h par mois
├─ read_duration_streak    Atteindre X min/jour pendant Y jours d'affilée

📚 LIVRES TERMINÉS
├─ finish_books            Finir X livres (période sélectionnable)
├─ finish_books_month      Finir X livres dans le mois        → période verrouillée mois
├─ finish_books_year       Finir X livres dans l'année         → période verrouillée année
├─ read_big_book           Lire un livre de plus de X pages    → binaire (cible=1)
├─ finish_book_fast        Finir un livre en moins de X jours  → binaire (cible=1)

⏱️ SESSIONS
├─ sessions_count          Réaliser X sessions (période)
├─ session_per_day         Lire au moins une session par jour  → période verrouillée jour
├─ sessions_per_week       Lire X sessions par semaine         → période verrouillée semaine

🎯 DIVERSITÉ & DÉCOUVERTE
├─ read_genre              Lire X livres d'un genre             → filtre genre
├─ read_author             Lire X livres d'un auteur            → filtre auteur
├─ read_format             Lire X livres d'un format            → filtre format
├─ finish_series           Finir une saga/série                 → filtre série, binaire
├─ read_new_language       Lire un livre dans une autre langue  → binaire
├─ read_new_genre          Lire un livre d'un genre jamais lu   → binaire
├─ read_old_book           Lire un livre commencé depuis longtemps → binaire

🔥 RÉGULARITÉ & STREAKS
├─ read_daily_streak       Lire tous les jours pendant X jours
├─ read_weekly_streak      Lire chaque semaine pendant X semaines
├─ max_gap_one_day         Ne pas sauter plus d'un jour (période)
├─ read_every_weekday      Lire chaque jour de la semaine       → période verrouillée semaine

📦 BIBLIOTHÈQUE & FICHES
├─ finish_in_progress      Finir les livres en cours            → binaire
├─ clear_pal               Vider X livres de ma PAL
├─ write_reviews           Rédiger X avis
├─ add_citations           Ajouter X citations
├─ fill_book_sheets        Remplir X fiches complètes
├─ buy_from_wishlist       Acheter X livres de ma wishlist
├─ budget_max              Dépenser moins de X € (période)      → inversé

🏆 RECORDS & DÉFIS
├─ beat_daily_pages        Battre son record de pages en un jour    → binaire
├─ beat_reading_minutes    Battre son record de minutes lues        → binaire
├─ read_more_than_last_month  Lire plus que le mois précédent      → mois verrouillé
├─ read_more_than_last_year   Lire plus que l'an dernier           → année verrouillée
├─ cumulative_pages        Atteindre X pages cumulées              → pas de période
├─ cumulative_books        Atteindre X livres finis                → pas de période
```

---

### Changements par fichier

#### 1. `src/hooks/usePersonalObjectives.ts`
- **Remplacer** `OBJECTIVE_TYPES` par les 39 nouveaux types avec nouvelles propriétés :
  - `periodLocked?: string` — période imposée (masque le sélecteur)
  - `binary?: boolean` — objectif 0/1 (cible fixée à 1, masque le champ valeur)
  - `noPeriod?: boolean` — pas de période (cumulatif ou one-shot)
  - `needsSecondTarget?: boolean` — pour `read_duration_streak` (X min + Y jours)
  - `timeUnit?: boolean` — affiche un sélecteur minutes/heures
- **Ajouter les calculs de progression** pour chaque nouveau type :
  - Streaks : analyser les dates de sessions pour compter jours/semaines consécutifs
  - Records : calculer le max historique (pages/jour, minutes/session) et comparer
  - `finish_book_fast` : vérifier `endDate - startDate < X jours`
  - `read_old_book` : vérifier si un livre "En cours" depuis > 6 mois a été terminé
  - `fill_book_sheets` : compter les livres avec synopsis + note + avis + citations + passages + personnages tous remplis
  - `buy_from_wishlist` : livres passés de Wishlist à Acheté
  - `read_more_than_last_month/year` : comparer avec la période précédente
- **Supprimer** les anciens types absents de la nouvelle liste et les queries inutiles (collections, literary_events, book_club_events)
- **Adapter le label** : remplacer dynamiquement X, filtre, période

#### 2. `src/components/CreateObjectiveModal.tsx`
- **7 catégories** avec icônes (BookOpen, BookCheck, Timer, Compass, Flame, Archive, Trophy)
- **Masquer** le sélecteur de période quand `periodLocked` ou `noPeriod`
- **Masquer** le champ valeur cible quand `binary` (cible auto = 1)
- **Ajouter** un sélecteur minutes/heures pour les types `timeUnit`
- **Ajouter** un champ "Nombre de jours" pour `read_duration_streak`
- **Adapter** les descriptions contextuelles pour chaque type
- **Stocker** l'unité de temps et le second target dans `filter_value` (format JSON si nécessaire, ex: `{"unit":"hours","secondTarget":7}`)

#### 3. `src/components/ObjectiveCard.tsx`
- Afficher une **icône check** au lieu d'une barre de progression pour les objectifs binaires
- Adapter l'affichage du compteur (masquer "0/1" pour les binaires, afficher "Réalisé" / "Non réalisé")

#### 4. Pas de migration SQL nécessaire
Les colonnes `objective_type` (text), `filter_value` (text), `target_value` (numeric) existantes suffisent.

