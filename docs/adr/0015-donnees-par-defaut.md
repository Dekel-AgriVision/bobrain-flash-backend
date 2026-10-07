# ADR-0015 — Données par défaut au démarrage

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Une installation neuve doit être utilisable immédiatement : une succursale, un rôle, un compte administrateur, des paramètres et des stations de base.

## Décision

- `DefaultDataService.createDefaultData()` est exécuté au démarrage (`CoreModule`) et crée, s'ils n'existent pas : succursales, accès, rôles, utilisateurs, stations, paramètres, connexions ERP (`src/common/data/*.json.ts`).
- Le compte par défaut (`DEFAULT_USER` / `DEFAULT_USER_PASSWORD`) est rattaché au rôle `manager` et à la succursale `DEFAULT_BRANCH_CODE`.
- Le rôle `manager` est créé en accès complet et corrigé s'il existe sans permission (ADR-0006).
- La même opération est exposée en `POST /app/sync-default-data`.

## Conséquences

- Installation et environnements de test reproductibles.
- **`POST /app/sync-default-data` est public et anonyme** : à protéger ou retirer en production.
- Le mot de passe par défaut doit être changé dès la première connexion.

## Alternatives écartées

- Script SQL d'initialisation : à maintenir séparément des entités.
