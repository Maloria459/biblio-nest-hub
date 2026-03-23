

## Plan : Page Paramètres complète

La page `/parametres` est actuellement vide. Les paramètres de la bibliothèque (genres, formats, statuts) restent dans leur emplacement actuel (panneau latéral dans la bibliothèque) et ne sont pas dupliqués ici.

### Sections

**1. Mon compte**
- Modifier pseudo, prénom, nom, date de naissance (formulaire pré-rempli depuis `profiles`)
- Email affiché en lecture seule
- Changer le mot de passe (ancien + nouveau + confirmation, via `supabase.auth.updateUser`)
- Déconnexion

**2. Apparence**
- Toggle thème clair / sombre (applique la classe `.dark` sur `<html>`, persisté en `localStorage`)
- Les variables CSS dark existent déjà dans `index.css`

**3. Notifications** *(préparation future)*
- Toggles : rappels de lecture, objectifs atteints, événements communautaires
- Stocké dans une nouvelle table `user_preferences`

**4. Confidentialité**
- Profil public ou privé (toggle)
- Afficher/masquer les statistiques
- Afficher/masquer la bibliothèque
- Stocké dans `user_preferences`

**5. Données**
- Exporter mes données (téléchargement JSON de books, sessions, collections)
- Supprimer mon compte (confirmation en 2 étapes, appel `supabase.auth.admin.deleteUser` via edge function)

### Base de données

**Table `user_preferences`** (nouvelle, avec RLS `auth.uid() = user_id`) :

| Colonne | Type | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL, unique |
| theme | text | 'light' |
| notify_reading_reminders | boolean | true |
| notify_objectives | boolean | true |
| notify_community | boolean | true |
| profile_public | boolean | true |
| show_stats | boolean | true |
| show_library | boolean | true |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS : SELECT / INSERT / UPDATE pour `auth.uid() = user_id`.

### Fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Table `user_preferences` + RLS + trigger `updated_at` |
| `src/hooks/useUserPreferences.ts` | Créer — CRUD react-query sur `user_preferences`, upsert au premier accès |
| `src/pages/Parametres.tsx` | Refondre — layout avec navigation verticale (liste de sections à gauche, contenu à droite) |
| `src/components/settings/AccountSettings.tsx` | Créer — formulaire profil + changement mot de passe |
| `src/components/settings/AppearanceSettings.tsx` | Créer — toggle dark mode |
| `src/components/settings/NotificationSettings.tsx` | Créer — toggles notifications |
| `src/components/settings/PrivacySettings.tsx` | Créer — toggles confidentialité |
| `src/components/settings/DataSettings.tsx` | Créer — export données + suppression compte |

### Layout

Pas de titre ni de top bar. Navigation verticale à gauche avec les 5 sections. Au clic sur une section, le contenu s'affiche à droite. Chaque modification est auto-sauvegardée (même pattern que `SettingsPanel`).

