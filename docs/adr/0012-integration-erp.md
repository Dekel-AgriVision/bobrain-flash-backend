# ADR-0012 — Intégration avec l'ERP

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les pesées validées doivent alimenter l'ERP de chaque succursale, dont l'adresse et les identifiants diffèrent d'un site à l'autre.

## Décision

- Paramètres de connexion **par succursale** en base (`ErpConnection` : `baseUrl`, `port`, `apiUri`, `authUri`, `wsUri`, `login`, `password`, `isDefault`), gérés depuis le backoffice.
- **Push** : à réception d'un flash, le gateway charge la configuration de la succursale, obtient un token ERP (`POST` sur l'URI d'authentification) puis émet `new_Item_to_erp` sur le socket de l'ERP.
- **Pull** : l'ERP peut lire le dernier poids valide via `GET /flash/:branch/sendweight/:station` (refus si trame absente ou poids ≤ 0).

## Conséquences

- Ajout d'un site sans redéploiement.
- **Le mot de passe ERP est stocké en clair** : à chiffrer (clé applicative) avant la mise en production.
- Le client socket ERP est partagé dans le gateway et reconnecté à chaque flash : à revoir (un client par succursale, reconnexion maîtrisée).

## Alternatives écartées

- Variables d'environnement ERP uniques (`API_ERP_*`, encore lues au démarrage) : un seul ERP possible.
