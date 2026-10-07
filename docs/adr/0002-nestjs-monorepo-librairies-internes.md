# ADR-0002 — NestJS 10 en monorepo avec librairies internes

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

L'API reprend un socle commun aux projets « BoBrain » : démarrage standardisé, journalisation, filtre d'exceptions, pagination et filtres de recherche génériques. Ces briques sont réutilisées d'un projet à l'autre.

## Décision

- **NestJS 10** (Express) en TypeScript, construit avec le CLI Nest en mode **webpack**.
- Monorepo Nest avec trois librairies dans `libs/`, importées par alias :
  - `@app/core` : utilitaires (`toNumber`, `toBoolean`…), logger log4js, compression ;
  - `@app/nestjs` : `bootstrapNestApp` (préfixe, CORS, helmet, Swagger), `AllExceptionsFilter`, `CustomValidationPipe`, `LoggingInterceptor`, `Paginated`, décorateurs de recherche ;
  - `@app/typeorm` : `buildFilterFromApiSearchParams`, `PaginatedService`, validateurs `exists` / `isUnique`.
- Le code métier est dans `src/core` (entités, DTO, services, contrôleurs), l'authentification dans `src/modules/auth`, le temps réel dans `src/gateway`.

## Conséquences

- Comportement homogène entre projets (erreurs, pagination, logs).
- Une évolution des librairies doit être recopiée dans chaque projet qui les embarque.
- Le plugin Swagger lit les commentaires JSDoc des contrôleurs (`introspectComments`).

## Alternatives écartées

- Paquets npm privés pour les librairies : plus propre mais demande un registre privé.
