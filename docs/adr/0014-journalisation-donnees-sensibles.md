# ADR-0014 — Journalisation et masquage des données sensibles

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les requêtes et erreurs doivent être tracées pour le support, sans écrire de secrets dans les journaux.

## Décision

- Logger **log4js** global (`CustomLoggerModule`) et `LoggingInterceptor` sur chaque requête.
- Règles de remplacement : `x-user-claims`, `cookie`, `authorization`, `jwt`, `token`, `password`, `currentPassword`, `confirmPassword`, `newPassword`, `secret` sont masqués.
- Journal des exceptions activable par `APP_EXCEPTION_FILTER_LOG`.

## Conséquences

- Les journaux peuvent être partagés sans exposer d'identifiants.
- Les `console.log` qui exposaient la réponse du login (token) et le mot de passe du compte par défaut ont été retirés (ADR-0018). D'autres `console.log` subsistent (gateway Socket.IO, services) : à revoir avant la production.

## Alternatives écartées

- Pas de masquage : fuite de tokens dans les fichiers de log.
