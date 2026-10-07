# ADR-0017 — Rafraîchissement du token de session (POST /auth/refresh)

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

À l'expiration du JWT, Passport rejette la requête (401) avant la stratégie : le backoffice déconnectait l'utilisateur même s'il était en pleine activité. Il fallait pouvoir prolonger une session **encore ouverte en base** sans redemander le mot de passe, sans pour autant prolonger une session abandonnée.

## Décision

Nouvel endpoint **`POST /auth/refresh`** (anonyme vis-à-vis du garde JWT, token lu dans `x-user-claims`) :

1. Signature du JWT vérifiée (`APP_JWT_SECRET`), expiration ignorée **dans la limite de `APP_JWT_REFRESH_GRACE`** (ms, 24 h par défaut) après `exp`.
2. Même application que le token (`iss` = `x-application-id`).
3. `AuthLog` d'origine existant et non refusé ; session `AuthUser` active ; compte utilisateur actif.
4. Inactivité : si `lastAccessDate + APP_JWT_INACTIVE_SESSION_TTL` est dépassé, la session est **fermée** et le refresh refusé.
5. Sinon `lastAccessDate` est mis à jour et un **nouveau JWT de la même session** (`sub`, `aud`, `iss`, `jti` conservés, `iat`/`exp` recalculés) est renvoyé avec `{ token, session, abilities }`, comme au login.

Le backoffice n'appelle cet endpoint que si l'utilisateur est actif (ADR-0016 du backoffice).

## Conséquences

- Pas de second secret ni de refresh token à stocker : la session en base sert de référence et reste révocable (`logout`, changement de mot de passe, compte désactivé).
- Un token volé reste rafraîchissable tant que la session est ouverte et active : HTTPS et la révocation restent indispensables.
- Les anciens tokens de la session restent valides jusqu'à leur propre expiration.
- Nouvelle variable : `APP_JWT_REFRESH_GRACE` (optionnelle).

## Alternatives écartées

- Refresh token opaque distinct : plus sûr contre le vol d'un seul token, mais demande une table et une rotation ; à envisager si l'API est exposée sur Internet.
- Allonger simplement `APP_JWT_SESSION_EXPIRES_IN` : ne distingue pas un utilisateur actif d'un poste abandonné.
