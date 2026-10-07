# ADR-0006 — Autorisations CASL à partir des rôles, sans « manage all »

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les droits étaient calculés par `Role.buildAbilityRules()`, qui ajoutait `manage all` à tous les rôles : tout utilisateur connecté pouvait tout faire. `Sujet: true` produisait par ailleurs une action `all` inconnue de CASL.

## Décision

- Un rôle porte `permissions` (JSON `{ Sujet: true | { read, create, edit, delete, stream } }`) et `adminPermission` (« accès complet »).
- Les règles CASL sont **explicites** (sujet × action), jamais `manage` ni sujet `all` :
  - `adminPermission: true` → les 5 actions sur tous les sujets de `AbilitySubjectEnum` ;
  - `Sujet: true` → les 5 actions sur ce sujet ;
  - objet → seulement les actions à `true` ; clés inconnues ignorées.
- `AuthUser.getAbililyRules()` ajoute des **conditions de succursale** (`branchId` / `id` = succursale de l'utilisateur), sauf pour les comptes multi-succursales (ADR-0007).
- Les contrôleurs vérifient avec `authUser.throwUnlessCan(action, Sujet)` (403 « Accès refusé »). Les règles sont renvoyées au login pour le front.

## Conséquences

- Moindre privilège : un nouveau sujet n'est jamais ouvert implicitement.
- **Les rôles sans permission n'ont plus aucun droit** ; le rôle `manager` par défaut est créé (ou corrigé au démarrage) en accès complet.
- Tous les contrôleurs ne vérifient pas encore les droits sur chaque route (ex. lecture unitaire, création) : à compléter. **Fait pour `user`, `role` et `access`** (ADR-0018, utilitaire `assertCan`) ; reste `branch`, `station`, `setting`, `stationActivity`, `flash`.
- Un compte sans rôle n'a aucun droit (403), sans erreur 500 (ADR-0018).
- Côté backoffice, les pages sans `acl` ne testent plus `manage all` mais « utilisateur connecté » (ADR-0019).

## Alternatives écartées

- Rôles « en dur » (admin / manager / guest) avec droits figés : non configurables par l'écran Rôles.
