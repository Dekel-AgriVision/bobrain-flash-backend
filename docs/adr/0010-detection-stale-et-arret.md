# ADR-0010 — Détection des stations muettes (STALE) et arrêt du service

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Un pont bascule peut cesser d'émettre (réseau coupé, PC éteint) sans prévenir. Le dernier poids affiché deviendrait alors faux et pourrait être repris par l'ERP.

## Décision

- `ScheduleService` lance au démarrage **une boucle par succursale** (toutes les 2 s) qui lit le dernier flash de chaque station.
- Seuils lus dans les **paramètres** (`Setting`) dont les noms sont donnés par `MAX_DELAY_STALE_DELAY` et `MAX_DELAY_STALE_TO_SHUTDOWN_DELAY` :
  - au-delà du délai *stale* : statut **`STALE`**, poids remis à 0, latence enregistrée ;
  - au-delà de *stale + arrêt* : statut **`SERVICE_SHUTDOWN`**.
- Les statuts déjà bloquants (`SERVICE_SHUTDOWN`, `SERIAL_DISCONNECTED`, `DESABLE_STATION`) ne sont pas réévalués.
- Chaque changement émet l'événement interne `stale_flash.updated`, traité par le gateway (diffusion + activité STOP avec code motif).

## Conséquences

- Un poids périmé n'est jamais transmis comme valide.
- Les seuils se règlent sans redéploiement, dans Paramètres système.
- Les succursales créées après le démarrage ne sont surveillées qu'au redémarrage suivant.
- Si un paramètre de seuil est absent, la boucle de la station échoue silencieusement : à sécuriser (valeurs par défaut).

## Alternatives écartées

- Expiration côté client uniquement : l'ERP lirait encore l'ancien poids.
