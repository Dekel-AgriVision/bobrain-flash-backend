# ADR-0019 — Backoffice : ACL par défaut et renouvellement de la session

- **Statut** : Accepté
- **Date** : 2026-10-07
- **Projet** : Brain Flash — Backoffice (bobrain-flash-backoffice, Next.js + NextAuth)

## Contexte

Côté backoffice, la connexion n'aboutissait pas à un usage normal :

- **Page 401 juste après la connexion** : les pages sans `acl` (dont l'accueil `/`, qui redirige vers `/supervision`) héritaient de `defaultACLObj = { action: 'manage', subject: 'all' }`. Depuis ADR-0006, l'API ne renvoie plus de règle `manage all`. Ce contrôle échouait donc **pour tous les comptes, administrateur compris**, et la redirection vers la supervision n'avait jamais lieu.
- **Déconnexion au bout de 30 min** : la session NextAuth stockait le JWT de l'API sans jamais le renouveler. À l'expiration (`APP_JWT_SESSION_EXPIRES_IN=1800`), toutes les requêtes tombaient en 401, alors que l'API propose `POST /auth/refresh` (ADR-0017).
- **Création de compte sans mot de passe** : le formulaire utilisateur rendait le mot de passe facultatif à la création, et ces comptes ne pouvaient pas se connecter (voir ADR-0018).
- `AclGuard` figeait les droits à la première connexion : un changement de rôle ou un nouveau token n'était pas pris en compte.

## Décision

1. **ACL par défaut = « utilisateur connecté »** (`src/configs/acl.ts`) : `defaultACLObj = { action: 'read', subject: 'authenticated' }`. `AclGuard` laisse passer le sujet spécial `authenticated` pour toute session valide. Les pages qui déclarent un `acl` restent contrôlées par CASL.
2. **`AclGuard`** reconstruit l'ability (`useMemo`) à chaque changement des `abilities` de la session. Il n'affiche plus la page 401 pendant le chargement de la session.
3. **Renouvellement du token dans NextAuth** (`src/pages/api/auth/[...nextauth].tsx`) :
   - le callback `jwt` lit `exp` du token API. Il appelle `POST /auth/refresh` (en-tête `x-user-claims`) quand le token expire dans moins de 5 min ou sur `update()`, puis remplace `{ session, abilities, token }` ;
   - si l'API refuse (session fermée, compte désactivé, inactivité), le token NextAuth est marqué `error: 'RefreshTokenError'` ; si l'API est injoignable, le token courant est conservé.
4. **Renouvellement lié à l'activité** (`AuthGuard`) : sur clic, frappe, défilement ou toucher (au plus une vérification par minute), si le token expire dans moins de 5 min, on appelle `update()`. Un poste inactif n'est donc pas prolongé : le délai d'inactivité de l'API (`APP_JWT_INACTIVE_SESSION_TTL`) reste effectif. Si la session est en erreur, `AuthGuard` déconnecte (`signOut`) et renvoie vers `/login?returnUrl=…`.
5. **Formulaire utilisateur** : mot de passe obligatoire à la création, facultatif en modification (`AddCard.tsx`).
6. Constante `URLREFRESH` corrigée en `auth/refresh`.

## Conséquences

- Après connexion, tout compte arrive sur `/supervision` s'il a `read Flash`. Sinon, il voit la page 401 de la supervision, ce qui est normal.
- Un utilisateur actif reste connecté sans ressaisir son mot de passe. Un poste abandonné est déconnecté selon les délais de l'API.
- `UserLayout` réinjecte déjà le token de la session dans Redux (`SessionAction`) à chaque changement : les appels `HttpService` utilisent automatiquement le nouveau token.
- Les appels `getServerSideProps` (`getSession({ req })`) obtiennent aussi un token renouvelé, mais ce renouvellement n'est pas réécrit dans le cookie du navigateur. Ce sont les appels côté client qui le persistent.

## Alternatives écartées

- `refetchInterval` de NextAuth : il renouvellerait aussi les onglets inactifs et contournerait le délai d'inactivité.
- Allonger la durée du JWT de l'API : ne distingue pas un utilisateur actif d'un poste abandonné (ADR-0017).
