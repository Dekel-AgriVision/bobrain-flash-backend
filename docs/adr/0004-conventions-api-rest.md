# ADR-0004 — Conventions de l'API REST

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Le backoffice et les services de pesée consomment l'API ; ils ont besoin de routes prévisibles et d'un format de liste unique.

## Décision

- Préfixe global `{APP_NAME}/api/v1` (aujourd'hui `flash-backend/api/v1`), port `APP_PORT`, écoute sur `APP_HOST`.
- Un contrôleur CRUD par ressource : `GET /` (liste paginée), `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (204). Les routes d'écriture relisent l'entité avec les `relations` demandées.
- Recherche au format `ApiSearchParamOptions` : `where` (JSON `[{ value, attribute, type }]`), `relations`, `order_by`, `order`, `page`, `per_page` ; réponse `Paginated` `{ total, per_page, current_page, last_page, from, to, data }`. Une `value` sans `attribute` filtre sur les `textFilterFields` du contrôleur.
- Documentation **Swagger** sur `/swagger` hors production, protégée par Basic Auth si `APP_SWAGGER_USER` / `APP_SWAGGER_PASSWORD` sont renseignés.
- Ressources : `auth`, `user`, `role`, `access`, `branch`, `station`, `stationActivity`, `flash`, `audit-flash`, `setting`, `erpconnection`.

## Conséquences

- Un seul client générique suffit côté front (`crud()`).
- Le format `where` est spécifique à `@app/typeorm` : il doit être documenté pour tout nouveau client.
- Les noms de ressources ne sont pas homogènes (`stationActivity`, `audit-flash`, `erpconnection`) : à conserver pour la compatibilité.

## Alternatives écartées

- GraphQL : surdimensionné pour des écrans CRUD.
