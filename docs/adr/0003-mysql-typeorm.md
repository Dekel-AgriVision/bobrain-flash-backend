# ADR-0003 — MySQL et TypeORM (Active Record + Repository)

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les données (succursales, stations, utilisateurs, flashs, historique) sont relationnelles et déjà hébergées sur un serveur MySQL de l'entreprise.

## Décision

- **MySQL** via `mysql2`, jeu de caractères `utf8mb4_unicode_ci`, 3 tentatives de connexion espacées de 5 s.
- **TypeORM 0.3** avec `autoLoadEntities`. Les entités héritent de `CoreEntity` / `BaseCoreEntity` (id UUID, dates, auteur de création / modification / suppression).
- Accès via les repositories dans les services (`AbstractService` : lecture paginée, création, mise à jour, suppression avec traçage de l'auteur) et, ponctuellement, en Active Record (`Station.find`, `Flash.query`).
- Les opérations multi-tables (activités des stations) passent par `RunInTransactionService`.
- `synchronize` est actif **hors production** (`NODE_ENV !== 'production'`).

## Conséquences

- Démarrage rapide en développement : le schéma suit les entités.
- **En production, `synchronize` est désactivé : chaque évolution de schéma doit être appliquée par migration** (pas encore en place — à prévoir).
- Le mélange Active Record / Repository complique les tests unitaires.

## Alternatives écartées

- Prisma : changement de socle trop important.
- `synchronize: true` en production : risque de perte de données.
