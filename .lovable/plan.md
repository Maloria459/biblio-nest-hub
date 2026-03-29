

## Plan révisé : Tableau de bord + Statistiques

Deux corrections par rapport au plan approuvé :

1. **Calendrier** : Les jours avec une sortie littéraire affichent le numéro du jour ET la couverture miniature en arrière-plan (ou en vignette sous le numéro), au lieu de remplacer le numéro.

2. **Layout banner** : Le bloc profil (avatar, pseudo, club, rang, Éclats d'Encre) et le calendrier occupent chacun exactement 50% de la largeur et partagent la même hauteur (via `grid grid-cols-2` avec `items-stretch` ou hauteur min commune).

Tout le reste du plan approuvé reste inchangé (streak, suppression des 3 cartes événements, refonte statistiques avec les 5 blocs catégorisés, filtre Semaine/Mois/Année/Global).

### Détail technique du calendrier

- Grille 7 colonnes (Lun→Dim), chaque cellule contient le numéro du jour
- Si une sortie littéraire tombe ce jour : la couverture du livre s'affiche en fond de la cellule (petit `img` positionné en absolute, opacité réduite ou taille réduite) avec le numéro par-dessus
- Événements littéraires et club : petit point coloré sous le numéro
- Tooltip au survol pour le détail

### Layout banner (CSS)

```text
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card class="h-full">  ← Profil  </Card>
  <Card class="h-full">  ← Calendrier  </Card>
</div>
```

Les deux cartes s'étirent à la même hauteur grâce à `items-stretch` (défaut de CSS grid).

