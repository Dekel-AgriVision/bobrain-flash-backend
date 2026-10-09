# ADR-0020 — Permission « stream » obligatoire pour envoyer des pesées

- **Statut** : Accepté
- **Date** : 2026-10-08
- **Projet** : Brain Flash — API (BOBRAINFLASHAPI)

## Contexte

Les postes de pesée envoient leurs pesées par Socket.IO (`sendWeight`, ADR-0009). Le handshake vérifiait seulement que le JWT était valide : **n'importe quel compte connecté**, même en lecture seule, pouvait créer ou modifier des flashs. De plus, `client.data.user` contient le **payload du JWT** (objet simple, `sub` = id de session), et non une entité `AuthUser`. Les permissions du compte n'étaient donc jamais consultées.

## Décision

- `FlashGatewayServiceFactory.createRecord()` et `updateRecord()` (mise à jour d'une station désactivée) appellent `assertCanStream()` avant toute écriture.
- `assertCanStream()` :
  1. retrouve la session à partir de `sub` (ou de l'entité, si elle est déjà fournie) ;
  2. recharge `AuthUser` en base avec `user`, `role`, `branch` et `targetBranch` ;
  3. refuse une session fermée ou un compte inactif (401) ;
  4. exige `can('stream', 'Flash')`, sinon renvoie 403 « Permission « stream » sur Flash requise pour envoyer des pesées ».
- L'erreur remonte au poste par l'accusé `sendWeight` et l'événement `sentWeightData` (`status: 'error'`, `message`). Rien n'est enregistré.
- Le `console.log` de la session dans `createRecord` est supprimé (ADR-0014).

## Conséquences

- Le compte utilisé par chaque poste de pesée doit avoir un rôle avec **Flash → stream** (ou `Flash: true`, ou `adminPermission`). Sans ce droit, ses pesées sont refusées.
- Une session fermée (logout, compte désactivé) ne peut plus envoyer de pesées, même si son JWT est encore valide.
- Une lecture en base par pesée reçue : coût acceptable au rythme des ponts bascules.
- Vérifié sur base vierge : admin (accès complet) → pesée enregistrée ; rôle `Flash: { stream: true }` → enregistrée ; rôle `Flash: { read, create }` sans `stream` → refusée avec le message ci-dessus.
- `readRecord` (lecture) et `purgeOldPreviousFlash` (nettoyage après un enregistrement autorisé) ne sont pas contrôlés.

## Alternatives écartées

- Contrôle au handshake Socket.IO : un même socket sert aussi aux écrans de supervision, qui n'ont besoin que de `read`.
- Utiliser `create Flash` : `stream` désigne déjà l'envoi en temps réel des pesées dans la matrice des droits (ADR-0006).
