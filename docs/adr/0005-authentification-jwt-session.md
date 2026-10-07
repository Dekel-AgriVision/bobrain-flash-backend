# ADR-0005 — Authentification : stratégie locale, JWT et session en base

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les utilisateurs du backoffice et les postes de pesée doivent s'authentifier ; il faut pouvoir révoquer une session, tracer les tentatives et bloquer les attaques par force brute.

## Décision

- **Login** `POST /auth/login` (Passport *local*) : mot de passe vérifié avec **bcrypt** (coût 13).
- Chaque tentative crée un `AuthLog` ; au-delà de `APP_AUTH_THROTTLE_LIMIT` tentatives **refusées** (10) en `APP_AUTH_THROTTLE_TTL` secondes (15 min) pour un même identifiant, la connexion est refusée (contrôle réactivé par ADR-0018 : il était en commentaire).
- Une connexion réussie crée une **session `AuthUser`** en base (utilisateur, rôle, succursale, succursale cible, IP, User-Agent) et renvoie `{ token, session, abilities }`.
- Le **JWT** (`APP_JWT_SECRET`) contient `sub` = id de session, `aud` = id de l'AuthLog, `iss` = application (`x-application-id`, défaut `bobrain-app`). Il est attendu dans l'en-tête **`x-user-claims`**.
- À chaque requête (`JwtStrategy`) : application, AuthLog, session active, compte actif, expiration (`exp` en **secondes**), inactivité (`APP_JWT_INACTIVE_SESSION_TTL`). Le User-Agent est **journalisé, pas bloquant** (navigateur et serveur Next n'ont pas le même).
- `POST /auth/logout` désactive la session ; `POST /auth/change-password` change le mot de passe puis ferme la session ; `POST /auth/switch/:branchId` change la succursale cible.

## Conséquences

- Une session peut être révoquée côté serveur malgré un JWT encore valide.
- Chaque requête lit la session en base : coût acceptable à ce volume.
- Durée de vie actuelle : JWT 30 jours (`APP_JWT_SESSION_EXPIRES_IN=2592000` s), inactivité 24 h.
- Le contrôle du User-Agent ne protège plus contre le vol de token : la protection repose sur HTTPS et la révocation.
- Mise à jour 2026-10-07 (ADR-0018) : mot de passe obligatoire à la création d'un compte, connexion possible sans rôle (aucun droit) ou sans succursale, durée actuelle du JWT 30 min (`APP_JWT_SESSION_EXPIRES_IN=1800`) renouvelé par `POST /auth/refresh` (ADR-0017, ADR-0019).

## Alternatives écartées

- JWT sans session en base : pas de révocation possible.
- Blocage sur changement de User-Agent : déconnectait les sessions légitimes (front Next.js).
