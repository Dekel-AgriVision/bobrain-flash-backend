# ADR-0013 — Validation des entrées et format des erreurs

- **Statut** : Accepté
- **Date** : 2026-10-06
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les clients (backoffice, services de pesée, ERP) doivent recevoir des erreurs exploitables, et l'API ne doit pas accepter de champs non prévus.

## Décision

- `CustomValidationPipe` global : `class-validator` sur les DTO (`PickType` / `PartialType` des entités), **`whitelist: true`** (champs inconnus supprimés), erreur **422** en cas d'échec.
- `AllExceptionsFilter` global : réponse `{ code, message, description, errors, infoURL, timestamp }`. Pour les exceptions métier, `message` contient le texte lisible et `errors` le détail par champ.
- Attention aux validateurs : `@IsOptional()` ne tolère que `null` / `undefined` (une chaîne vide échoue sur `@IsEmail`).

## Conséquences

- Format d'erreur unique pour tous les clients.
- Les clients doivent lire `errors` puis `message` (et non `description`, souvent générique).

## Alternatives écartées

- Validation manuelle dans les services : dispersée et incomplète.
