# ADR-0011 — Journal d'activité des stations (START / STOP)

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

L'exploitation doit savoir quand et pourquoi une station a été arrêtée (coupure, désactivation, arrêt du service) et calculer les durées d'indisponibilité.

## Décision

- Entité `StationActivity` : `type` (`START`, `STOP`, `PAUSE`), `isActive`, `startAt`, `endAt`, `reasoncode`, `reason`.
- Une seule activité active par station : `startActivity` ferme le STOP actif et ouvre un START ; `stopActivity` ferme le START actif et ouvre un STOP, sauf si un STOP actif a déjà le même motif.
- Toutes les transitions sont faites **dans une transaction** (`RunInTransactionService`).
- Les motifs viennent de `eventReasonCodeActivityFlashEnum` (stale, arrêt automatique après stale, station désactivée…).

## Conséquences

- Historique fiable des arrêts, exploitable dans l'écran Activités.
- La création manuelle d'activité n'est pas exposée (le DTO ne porte pas `type`).

## Alternatives écartées

- Déduire les arrêts de l'historique des flashs : calcul coûteux et ambigu.
