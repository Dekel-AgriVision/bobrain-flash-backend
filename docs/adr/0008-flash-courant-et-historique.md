# ADR-0008 — Flash « courant » et historique d'audit séparés

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les ponts bascules envoient une trame en continu. Le backoffice et l'ERP ont besoin du **dernier état** de chaque station, très souvent ; l'audit a besoin de **tout l'historique**.

## Décision

- Table **`flash`** : état courant. Après chaque enregistrement, `purgeOldPreviousFlash` ne garde que le dernier flash par couple (station, succursale).
- Table **`audit_flash`** : historique en ajout seul, alimenté à chaque création de flash (`FlashService.createRecord`).
- Une référence unique `F` + date + 3 chiffres est générée avant insertion (`FlashSubscriber`).
- Statuts normalisés (`StatusFlashEnum`) : `WEIGHT_OK`, `WEIGHT_NOT_OK`, `SERIAL_CONNECTED/DISCONNECTED`, `DISPLAY_ON/OFF`, `BRIDGE_EMPTY`, `STALE`, `SERVICE_SHUTDOWN`, `DISCONNECTED`, `DESABLE_STATION`.
- Endpoints d'audit : liste paginée, détail, `/:id/details` (précédent, suivant, chronologie, état courant, statistiques), `/station/:branch/:station[/stats]`.

## Conséquences

- Lecture du dernier poids en temps constant (`GET /flash/:branch/sendweight/:station`).
- `audit_flash` grossit indéfiniment : prévoir une politique de rétention / archivage et des index sur (`station`, `branch`, `created_at`).
- Les flashs référencent la station et la succursale par **code** (pas par clé étrangère) : le rapprochement doit normaliser la casse.

## Alternatives écartées

- Une seule table avec requête « dernier par station » : coûteuse à chaque lecture.
