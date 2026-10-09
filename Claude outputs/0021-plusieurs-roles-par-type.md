# ADR-0021 — Plusieurs rôles du même type, sauf Gestionnaire

- **Statut** : Accepté
- **Date** : 2026-10-09
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Le champ `Role.name` représente le **type** de rôle (`manager`, `admin`, `guest`). Il devait être unique : on ne pouvait pas créer, par exemple, deux rôles « invité » aux permissions différentes (« Opérateur pont A » avec `stream`, « Opérateur pont B » en lecture seule).

## Décision

- `name` (le type) **n'est plus unique**. Plusieurs rôles peuvent partager un même type et avoir des permissions différentes.
- **Exception : le type `manager` (Gestionnaire) reste unique.** Si on tente d'en créer un second, l'API répond 409 `name: « Il existe déjà un rôle Gestionnaire : un seul est autorisé »`.
- Les rôles se distinguent par leur libellé `displayName`. Il est **obligatoire et unique**, à la création comme à la modification (400 s'il est vide, 409 s'il existe déjà). Les espaces en début et en fin sont supprimés.
- Le type ne se modifie pas après la création (`UpdateRoleDto` omet `name`). On ne peut donc pas transformer un rôle en second Gestionnaire.
- Au démarrage (`DefaultDataService`), le rôle Gestionnaire par défaut est recherché par type avec un tri par date de création croissante. On vise ainsi toujours le rôle d'origine.

## Conséquences

- Les droits viennent toujours des `permissions` / `adminPermission` de chaque rôle (ADR-0006), et non de son type.
- La suppression reste interdite pour tous les rôles de type `admin` (comportement existant de `DELETE /role/:id`).
- Le backoffice doit envoyer `displayName` à la création d'un rôle, et afficher ce libellé (non le type) dans les listes de choix.
- Si la base de production contient un ancien index **unique** sur `role.name`, il faut le supprimer. L'entité ne déclare qu'un index simple (`@Index()`).
- Vérifié : deux rôles `guest` et deux rôles `admin` → créés ; second `manager` → 409 ; libellé en double ou vide → 409 / 400 ; renommage vers un libellé déjà pris → 409.

## Alternatives écartées

- Type unique par succursale : les rôles ne sont pas rattachés à une succursale aujourd'hui.
