# ADR-0016 — Configuration et sécurité du déploiement

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

L'API tourne aujourd'hui sur un poste (`127.0.0.1:3336`) et doit pouvoir être déployée sur un serveur, éventuellement en conteneur (`docker-compose.yml`).

## Décision

- Configuration par variables d'environnement (`ConfigModule`, `.env` non versionné) : application (`APP_NAME`, `APP_HOST`, `APP_PORT`, `APP_KEY`), JWT, base de données, CORS, Swagger, seuils, compte par défaut.
- **CORS** activé avec la liste `APP_CORS_ORIGIN` (le backoffice v2 passe par le proxy Next et n'en dépend plus pour HTTP).
- **helmet** actif sauf `APP_DISABLE_HELMET=true` ; compression des réponses.
- Swagger désactivé en production.

## Conséquences

Liste de contrôle avant la production :

- `NODE_ENV=production` (désactive `synchronize` et Swagger) et migrations de schéma prêtes.
- Secrets forts et uniques : `APP_JWT_SECRET`, `APP_KEY`, mot de passe base, compte par défaut changé.
- HTTPS devant l'API et le Socket.IO (`wss://`).
- Retirer les `console.log` sensibles restants (ceux du login et du compte par défaut sont retirés, ADR-0018), protéger `/app/sync-default-data`, chiffrer les mots de passe ERP.
- Vérifier `APP_JWT_INACTIVE_SESSION_TTL` (en **millisecondes**) : la valeur `6000000` du `.env` actuel vaut 100 min, pas 10 min comme l'indique son commentaire.

## Alternatives écartées

- Fichier de configuration JSON versionné : risque de fuite de secrets.
