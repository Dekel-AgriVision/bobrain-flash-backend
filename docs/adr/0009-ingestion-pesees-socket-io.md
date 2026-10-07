# ADR-0009 — Réception des pesées par Socket.IO

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les services de pesée installés près des ponts bascules envoient une mesure toutes les secondes ; le backoffice doit voir les pesées en direct.

## Décision

- Gateway **Socket.IO**, namespace **`/ws`** (CORS `*`). Le *handshake* exige un JWT valide dans `auth.token` (vérifié avec `APP_JWT_SECRET`).
- Le service de pesée émet l'événement d'envoi de poids ; l'API :
  1. vérifie que la succursale (par code) et la station existent, sinon ignore ;
  2. si la station est désactivée, enregistre un flash `DESABLE_STATION` à poids 0 et arrête l'activité ;
  3. sinon enregistre le flash (et son audit), puis met à jour l'activité de la station.
- Diffusion : `sent_new_flash` à tous les clients, `sentWeightData` (succès / erreur) à l'émetteur, `start_flash_backend` à chaque connexion, `create_action` pour les activités.

## Conséquences

- Latence minimale entre la balance et l'écran de supervision.
- Une seule instance d'API : en cas de mise à l'échelle, il faudra un adaptateur Redis pour Socket.IO.
- Le CORS `*` du gateway est compensé par l'authentification JWT au handshake.

## Alternatives écartées

- POST HTTP à chaque mesure : plus de surcoût de connexion, pas de diffusion native.
