

## Plan : Double répartition genre & format

### Constat actuel

Les graphiques genre et format comptent **tous les livres** filtrés par date, sans distinction de statut. L'utilisateur souhaite deux vues distinctes :

1. **Livres détenus** (tous les livres, depuis l'inscription, sans filtre temporel)
2. **Livres lus** (statut "Lu" / "Lecture terminée", filtré par mois/année/inscription selon les sélecteurs)

### Modifications

**`StatistiquesContent.tsx`** — Ajouter deux jeux de données :
- `allBooks` (non filtré par date) → répartition "livres détenus"
- `filteredBooks` filtré sur statut lu → répartition "livres lus" (déjà filtré par période)

Calculer 4 datasets :
- `genreDataOwned` / `formatDataOwned` — tous les livres (depuis inscription)
- `genreDataRead` / `formatDataRead` — livres lus dans la période sélectionnée

**`StatsGenreChart.tsx`** — Accepter deux séries de données (`owned` et `read`), afficher deux donut charts côte à côte ou en onglets internes ("Livres détenus" / "Livres lus").

**`StatsFormatChart.tsx`** — Même approche : deux bar charts ou onglets ("Livres détenus" / "Livres lus").

### UX proposée

Chaque carte (genre et format) contiendra un petit toggle à 2 options en haut :
- **Livres détenus** — toujours basé sur l'ensemble des livres
- **Livres lus** — basé sur les livres terminés dans la période filtrée

### Fichiers modifiés

| Fichier | Action |
|---|---|
| `src/components/StatistiquesContent.tsx` | Calculer les 4 datasets, passer les props |
| `src/components/stats/StatsGenreChart.tsx` | Ajouter toggle owned/read + deux séries |
| `src/components/stats/StatsFormatChart.tsx` | Ajouter toggle owned/read + deux séries |

