# ADR-0007 — Cloisonnement des données par succursale

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Le groupe compte plusieurs succursales (sites). Un utilisateur ne doit voir que les stations, flashs, utilisateurs et connexions ERP de son site, sauf les comptes du siège.

## Décision

- Les entités métier portent `branchId` (ou le code succursale pour les flashs).
- Chaque service expose `getFilterByAuthUserBranch()` : filtre `branchId = targetBranchId` de la session, fusionné dans le `where` des listes et des lectures.
- `AuthUser.hasAllBranchesAccess()` (rôle en accès complet **ou** succursale `isParentCompany`) lève ce filtre ; il remplace l'ancien test `can('manage', 'all')`.
- La session garde la succursale d'origine (`branchId`) et la succursale **cible** (`targetBranchId`), modifiable par `POST /auth/switch/:branchId`.

## Conséquences

- Cloisonnement appliqué côté serveur, indépendamment du front.
- Un compte multi-succursales voit toutes les données, quelle que soit la succursale cible : le sélecteur ne filtre pas encore pour lui.
- Toute nouvelle ressource doit implémenter son filtre de succursale.

## Alternatives écartées

- Une base par succursale : supervision consolidée impossible.
