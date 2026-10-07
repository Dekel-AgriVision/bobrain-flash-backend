# ADR-0001 — Enregistrer les décisions d'architecture

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

L'API BOBRAINFLASHAPI porte la logique critique de la pesée : réception des flashs des ponts bascules, détection des coupures, droits d'accès, liaison avec l'ERP. Plusieurs corrections récentes (expiration JWT, contrôle du User-Agent, CORS, permissions) n'étaient documentées que par des commentaires dans le code.

## Décision

Chaque décision d'architecture significative de l'API est consignée dans un ADR au format de Michael Nygard, dans `docs/adr/`, numéroté `NNNN-titre.md`, avec un index `README.md` et une page de lecture `docs/index.html` (régénérée par `node docs/generate-index.mjs`).

- Statuts : **Proposé**, **Accepté**, **Déprécié**, **Remplacé par ADR-NNNN**.
- Les décisions qui touchent aussi le front sont rappelées dans les ADR du backoffice (`brainflash-backoffice-v2/docs/adr`).

## Conséquences

- Le *pourquoi* des choix et des correctifs est conservé hors du code.
- Les points de vigilance (sécurité, production) sont visibles au même endroit.

## Alternatives écartées

- Commentaires « CORRECTION » dans le code : utiles mais dispersés et sans vue d'ensemble.
