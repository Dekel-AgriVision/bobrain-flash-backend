# Décisions d'architecture (ADR) — API

Décisions structurantes de l'API BOBRAINFLASHAPI (NestJS). Les décisions côté backoffice sont dans `brainflash-backoffice-v2/docs/adr` ; celles qui concernent le backoffice `bobrain-flash-backoffice` et l'authentification sont regroupées ici (ADR-0019).

Lecture dans le navigateur : ouvrir [`docs/index.html`](../index.html) (régénérer avec `node docs/generate-index.mjs`).

Format : [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — voir ADR-0001.

| N° | Décision | Statut |
| --- | --- | --- |
| [0001](0001-enregistrer-les-decisions-d-architecture.md) | Enregistrer les décisions d'architecture | Accepté |
| [0002](0002-nestjs-monorepo-librairies-internes.md) | NestJS 10 en monorepo avec librairies internes | Accepté |
| [0003](0003-mysql-typeorm.md) | MySQL et TypeORM (Active Record + Repository) | Accepté |
| [0004](0004-conventions-api-rest.md) | Conventions de l'API REST | Accepté |
| [0005](0005-authentification-jwt-session.md) | Authentification : stratégie locale, JWT et session en base | Accepté |
| [0006](0006-autorisations-casl-permissions-explicites.md) | Autorisations CASL à partir des rôles, sans « manage all » | Accepté |
| [0007](0007-cloisonnement-par-succursale.md) | Cloisonnement des données par succursale | Accepté |
| [0008](0008-flash-courant-et-historique.md) | Flash « courant » et historique d'audit séparés | Accepté |
| [0009](0009-ingestion-pesees-socket-io.md) | Réception des pesées par Socket.IO | Accepté |
| [0010](0010-detection-stale-et-arret.md) | Détection des stations muettes (STALE) et arrêt du service | Accepté |
| [0011](0011-journal-activite-stations.md) | Journal d'activité des stations (START / STOP) | Accepté |
| [0012](0012-integration-erp.md) | Intégration avec l'ERP | Accepté |
| [0013](0013-validation-et-format-erreurs.md) | Validation des entrées et format des erreurs | Accepté |
| [0014](0014-journalisation-donnees-sensibles.md) | Journalisation et masquage des données sensibles | Accepté |
| [0015](0015-donnees-par-defaut.md) | Données par défaut au démarrage | Accepté |
| [0016](0016-configuration-et-securite-deploiement.md) | Configuration et sécurité du déploiement | Accepté |
| [0017](0017-rafraichissement-du-token.md) | Rafraîchissement du token de session (POST /auth/refresh) | Accepté |
| [0018](0018-corrections-authentification-et-droits-utilisateurs.md) | Corrections de l'authentification et des droits sur les utilisateurs | Accepté |
| [0019](0019-backoffice-session-acl-et-renouvellement.md) | Backoffice : ACL par défaut et renouvellement de la session | Accepté |

## Ajouter un ADR

1. Copier `template.md` en `NNNN-titre-court.md` (numéro suivant).
2. Renseigner contexte, décision, conséquences et alternatives.
3. Ajouter la ligne dans le tableau ci-dessus.
4. Régénérer la page HTML : `node docs/generate-index.mjs`.
5. Pour revenir sur une décision : nouvel ADR, et passer l'ancien en « Remplacé par ADR-NNNN ».
