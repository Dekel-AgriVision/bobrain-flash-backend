# ADR-0018 — Corrections de l'authentification et des droits sur les utilisateurs

- **Statut** : Accepté
- **Date** : 2026-10-07
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Le compte administrateur par défaut se connectait, mais les autres comptes posaient problème. Les tests de bout en bout (login, profil, refresh, logout, changement de mot de passe, désactivation, comptes avec ou sans rôle ou succursale) ont révélé ces anomalies :

- **Compte créé sans mot de passe** : `newPassword` était facultatif à la création. Le compte était enregistré mais **ne pouvait jamais se connecter** (« Nom d'utilisateur ou mot de passe incorrect »).
- **Compte sans rôle** : le login réussissait, puis **chaque requête protégée renvoyait 500** (`Cannot read properties of null (reading 'buildAbility')`).
- **Compte sans succursale** : `toAuthUser()` lisait `user.branch.id` ; un compte sans succursale faisait planter le login (TypeError, 500).
- **Aucun contrôle de droits** sur `POST/PATCH/DELETE /user`, `/role` et `/access` : n'importe quel compte connecté (même en lecture seule) pouvait créer un administrateur, se donner un rôle à accès complet, changer le mot de passe d'un autre compte ou le supprimer.
- **Limitation des tentatives désactivée** : le code de `throttleByUsername` était en commentaire, alors qu'ADR-0005 le présente comme actif.
- **Secrets dans la console** : le mot de passe du compte par défaut (`default-data.service`) et la réponse complète du login, JWT compris (`AuthService.confirmLogin`), étaient écrits avec `console.log`.

## Décision

1. **Mot de passe obligatoire à la création** (`CreateUserDto.newPassword` : `@IsNotEmpty`, 5 caractères minimum, comme le formulaire de login). Il reste facultatif en modification (`UpdateUserDto`, `PartialType`) : on ne le change que s'il est fourni.
2. **Compte sans rôle = aucun droit, pas d'erreur** : `AuthUser.getAbility()` construit une ability vide si `role` est absent. Résultat : 403 « Accès réfusé » au lieu de 500.
3. **Compte sans succursale** : `UserService.toAuthUser()` utilise `user.branch?.id ?? user.branchId`. La connexion fonctionne, et les règles de succursale (ADR-0007) limitent l'accès.
4. **Contrôle des droits sur la gestion des comptes** avec le nouvel utilitaire `assertCan(authUser, action, Sujet)` (`src/modules/auth/helpers/assert-can.ts`). Il renvoie 401 sans session, contrairement à `authUser?.throwUnlessCan`, qui laissait passer la requête :
   - `POST /user` → `create User` ; `PATCH /user/:id` → `edit User` ; `DELETE /user/:id` → `delete User`.
   - **Exception profil** : sans droit `edit User`, un compte peut modifier **sa propre fiche**, et seulement `firstName`, `lastName`, `email`, `phoneNumber`. Le rôle, la succursale, le statut, l'identifiant et le mot de passe sont ignorés. Le mot de passe se change par `POST /auth/change-password`.
   - `POST/PATCH/DELETE /role` et `/access` → `create|edit|delete Role`.
   - Les lectures (`GET /role`) restent ouvertes aux comptes connectés : les listes déroulantes du backoffice en ont besoin.
5. **Limitation des tentatives réactivée** : au-delà de `APP_AUTH_THROTTLE_LIMIT` échecs (10) en `APP_AUTH_THROTTLE_TTL` secondes (15 min) pour un même identifiant et une même application, le login est refusé (401, « nombre maximum d'essais »).
6. **Suppression des `console.log` sensibles** : mot de passe par défaut, réponse du login avec le token, log de debug dans `LocalAuthGuard`.

## Conséquences

- Tous les comptes créés depuis le backoffice peuvent se connecter. Les comptes déjà créés **sans mot de passe** doivent recevoir un mot de passe (modification de l'utilisateur, champ « Mot de passe »).
- Un compte sans rôle se connecte mais ne voit rien. Il faut lui attribuer un rôle.
- Un rôle doit avoir le droit `create/edit/delete` sur `User` (ou `adminPermission`) pour gérer les comptes, et sur `Role` pour gérer les rôles. Le rôle `manager` par défaut a l'accès complet.
- Après 10 échecs, l'identifiant est bloqué 15 minutes. En cas de besoin, on peut le débloquer en supprimant les lignes `auth_log` refusées de cet identifiant.
- Vérifié de bout en bout sur une base MySQL/MariaDB vierge (27 cas : login, refus sans mot de passe, comptes sans rôle ou sans succursale, 403 sur création, modification ou suppression sans droit, profil sans escalade de rôle, changement de mot de passe, désactivation, logout, refresh d'un token expiré, blocage après 10 échecs).
- Points restants (hors périmètre) : les routes de création, modification et suppression de `branch`, `station`, `setting`, `stationActivity` et `flash` ne vérifient toujours pas les droits (voir ADR-0006). Un compte qui a `create User` peut attribuer n'importe quel rôle, y compris à accès complet.

## Alternatives écartées

- Garde globale CASL par décorateur (`@Can`) sur toutes les routes : plus propre, mais elle touche tous les contrôleurs. Elle reste à faire en suivant le même principe.
- Envoi d'un mot de passe provisoire par e-mail à la création : le module mail est désactivé aujourd'hui.
