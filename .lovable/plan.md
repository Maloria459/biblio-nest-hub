

## Plan : Composant "Mes collections"

### Contexte
L'onglet "Mes collections" existe dans la navigation mais n'a pas de contenu. Les tables `collections` et `collection_books` existent deja en base avec les bonnes RLS policies. Pas de migration necessaire.

### Architecture

**1. Composant `CollectionsContent.tsx`**
- Layout principal avec bouton "Creer une nouvelle collection" en haut a droite
- Charge les collections + leurs livres depuis la base via `collections` et `collection_books` (jointure avec `books`)
- Affiche chaque collection comme une "etagere" en bois :
  - Titre de la collection au-dessus
  - Bandeau horizontal style etagere (fond bois/marron avec ombre, bordure inferieure epaisse)
  - Les livres affiches comme des tranches verticales (rectangles fins colores, hauteur variable ~120-160px, largeur ~30-40px)
  - Titre du livre ecrit verticalement (`writing-mode: vertical-rl`) sur chaque tranche
  - Couleurs de tranche generees a partir du titre/auteur pour varier
- Actions : supprimer une collection, ajouter/retirer des livres

**2. Composant `CreateCollectionModal.tsx`**
- Dialog modal avec :
  - Champ texte pour le nom de la collection
  - Liste des livres de la bibliotheque (statut != "Wishlist") avec checkbox pour selection
  - Barre de recherche pour filtrer les livres
  - Bouton "Creer"
- A la validation : insert dans `collections` puis insert batch dans `collection_books`

**3. Integration dans `Lecture.tsx`**
- Ajouter `<CollectionsContent />` dans le `tabContent` pour l'onglet "Mes collections"

### Visuel etagere (CSS/Tailwind)
```text
┌─────────────────────────────────────────┐
│  Collection "Fantasy"            [edit] │
├─────────────────────────────────────────┤
│ ┌──┐┌──┐┌──┐┌──┐┌──┐                   │
│ │T ││T ││T ││T ││T │  ← tranches       │
│ │i ││i ││i ││i ││i │    verticales      │
│ │t ││t ││t ││t ││t │                    │
│ │r ││r ││r ││r ││r │                    │
│ │e ││e ││e ││e ││e │                    │
│ └──┘└──┘└──┘└──┘└──┘                    │
╞═════════════════════════════════════════╡ ← etagere
└─────────────────────────────────────────┘
```
- Chaque tranche = div avec `writing-mode: vertical-rl`, couleur aleatoire stable (hash du titre), coins arrondis en haut
- L'etagere = bordure inferieure epaisse avec gradient/ombre simulating du bois

### Fichiers modifies/crees
- **Creer** `src/components/CollectionsContent.tsx`
- **Creer** `src/components/CreateCollectionModal.tsx`
- **Modifier** `src/pages/Lecture.tsx` — brancher le composant

