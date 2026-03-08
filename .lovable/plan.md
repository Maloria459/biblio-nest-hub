
Objectif: supprimer le décalage visuel de l’icône “Éclat d’Encre” sur le tableau de bord, pour qu’elle soit prête au premier rendu utilisateur.

Plan d’implémentation

1) Préchargement plus tôt dans le cycle applicatif
- Déplacer le préchargement de l’image hors du `useEffect` local du Dashboard.
- Créer un petit utilitaire de préchargement partagé (promise singleton) lancé dès le démarrage de l’app (avant affichage du Dashboard).

2) Attendre le décodage réel (pas seulement le téléchargement)
- Dans l’utilitaire, utiliser `Image()` + `decode()` (quand disponible) pour garantir que l’image est décodée avant affichage.
- Garder un fallback `onload/onerror` pour compatibilité.

3) Prioriser l’image dans le rendu Dashboard
- Sur la balise `<img>` du badge, définir explicitement:
  - `loading="eager"`
  - `fetchPriority="high"`
  - `decoding="sync"` (ou `auto` selon compatibilité souhaitée)
- Conserver dimensions fixes existantes pour éviter tout layout shift.

4) Garder l’affichage synchronisé sans blocage excessif
- Le Dashboard continue d’attendre `pseudoLoaded` + `imgReady`, mais `imgReady` viendra désormais d’un préchargement global (déjà en cours avant entrée sur la page), donc quasi instantané au moment du rendu.

5) Vérification fonctionnelle
- Tester sur premier chargement (hard refresh) puis navigation interne.
- Vérifier que l’icône apparaît en même temps que le reste du header, sans “pop-in” tardif.
- Vérifier que le spinner global ne reste pas bloqué en cas d’échec image (fallback error).

Détails techniques (cause probable)
- Aujourd’hui, le préchargement démarre dans `Dashboard.tsx` après le montage du composant.
- `onload` peut se déclencher avant que le navigateur ait complètement décodé l’image pour le paint final.
- Résultat: malgré la garde `imgLoaded`, l’image peut encore apparaître légèrement après le reste.
- Solution: précharger plus tôt + attendre le décodage + priorité de fetch/rendu.

Fichiers ciblés
- `src/pages/Dashboard.tsx` (consommation de l’état prêt + attributs de priorité sur l’image)
- Nouveau utilitaire front (ex: `src/lib/preloadAssets.ts`) pour centraliser la promesse de préchargement
- Optionnel: `src/main.tsx` pour déclencher le préchargement dès bootstrap
