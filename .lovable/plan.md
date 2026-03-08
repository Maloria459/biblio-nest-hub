
Objectif
- Corriger définitivement la sélection des livres dans “Créer une nouvelle collection” tout en conservant la possibilité d’ajouter un même livre dans plusieurs collections.

Diagnostic confirmé
- Le bug vient d’un double déclenchement dans `CreateCollectionModal` :
  - clic sur la ligne (`onClick` du conteneur) + clic/état du `Checkbox` (`onCheckedChange`)
  - résultat : l’état passe à “sélectionné” puis “désélectionné” immédiatement (visible dans la session replay).
- Côté base de données, la contrainte est correcte (`UNIQUE(collection_id, book_id)`), donc un livre peut bien exister dans plusieurs collections différentes.

Plan d’implémentation
1) Stabiliser la logique de sélection dans `src/components/CreateCollectionModal.tsx`
- Remplacer la logique “toggle partout” par une logique explicite :
  - `setBookSelection(bookId, checked: boolean)` pour forcer l’état (ajout/suppression dans `Set`).
- Garder le clic sur la ligne pour l’ergonomie, mais empêcher le conflit :
  - `onClick` de la ligne = toggle une seule fois
  - sur le `Checkbox`, stopper la propagation du clic (`event.stopPropagation`) pour éviter le second toggle.
- Utiliser `onCheckedChange` avec la valeur `checked` Radix au lieu d’un toggle aveugle.

2) Vérifier le flux création/édition sans régression
- Créer : sélectionner plusieurs livres, désélectionner, puis créer.
- Éditer : ouvrir une collection existante avec pré-sélection, modifier puis enregistrer.
- Confirmer que les compteurs (`Créer (X livre[s])`) restent cohérents.

3) Renforcer le feedback utilisateur sur la sauvegarde
- Quand l’insertion des liens `collection_books` échoue, afficher un toast d’erreur (pas seulement `console.error`) pour respecter la règle de notification en cas d’échec de sauvegarde backend.

4) Correction accessibilité secondaire (warning console)
- Ajouter une `DialogDescription` dans le modal pour supprimer l’avertissement Radix “Missing Description”.
- Vérifier que cela n’impacte pas le comportement fonctionnel.

Détails techniques
- Fichier principal : `src/components/CreateCollectionModal.tsx`
- Ajustements ciblés :
  - Introduire une fonction utilitaire de mise à jour du `Set<string>` par état explicite.
  - Modifier le rendu de chaque item livre :
    - conteneur cliquable (sélection ligne)
    - `Checkbox` contrôlé + `onClick` avec stopPropagation
    - `onCheckedChange` piloté par la valeur reçue.
- Aucun changement de schéma base de données requis.

Plan de validation (E2E)
1. Ouvrir “Créer une nouvelle collection”.
2. Cliquer sur la checkbox d’un livre : elle doit rester cochée.
3. Cliquer sur la ligne (titre/auteur) du même livre : alternance propre (1 seul changement par clic).
4. Créer deux collections différentes avec le même livre : succès dans les deux cas.
5. Recharger la page : la présence du livre dans les deux collections est conservée.
6. Vérifier qu’aucun warning React/Radix critique ne reste en console sur ce flux.
