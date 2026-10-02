# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Mission 0 — Cartographier l'application

**Objectif** : retrouver le composant racine, les routes, l'enregistrement de `HttpClient`, les modèles/services/pages et le mécanisme d'ajout du JWT.

**Réalisation** : cartographie faite par le binôme (voir `COMPTE_RENDU_TP1.docx`), puis relue avec l'agent pendant la mission 1.

**Erreurs corrigées lors de la relecture** :
- `HttpClient` est enregistré dans `src/main.ts` (`provideHttpClient(withInterceptors([authInterceptor]))`), pas dans l'intercepteur ;
- le JWT est ajouté par `auth.interceptor.ts` ; `auth.guard.ts` ne fait que bloquer l'accès aux routes Angular sans token ;
- chemin exact du composant racine : `frontend-starter/src/app/components/app/app.ts`.

Version corrigée : [docs/tp1/LIVRABLES_TP1.md § 2](docs/tp1/LIVRABLES_TP1.md#2-cartographie-de-lapplication-mission-0).

## Mission 1 — Inscription, connexion et profil

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

**Objectif** : compléter la partie utilisateur du frontend (formulaires réactifs, validations, JWT, Signal `currentUser`, déconnexion, profil, gestion du 401).

**Prompt principal** : demande de réaliser la mission 1 à partir du sujet `SUJET_ETUDIANT_TP1.md`, en précisant que la mission 0 était déjà terminée par le binôme. Le prompt contenait le texte intégral de la consigne, soit :
- les 10 exigences fonctionnelles, détaillées dans le tableau ci-dessous ;
- les contraintes d'architecture : aucun appel à `HttpClient` dans les composants (tout passe par `AuthService`), injection avec `inject()`, séparation claire entre interface, service et API ;
- les questions du sujet : modèle d'IA utilisé, suivi des tokens, routes du backend, localisation de la mise à jour du profil.

**Tâches demandées et réalisation (dans l'ordre de la conversation)** :

| # | Demande du binôme | Ce qui a été effectué | Fichiers |
|---|---|---|---|
| 1 | Formulaires réactifs pour l'inscription et la connexion | `FormGroup` / `FormControl` typés `nonNullable`, soumission via `(ngSubmit)`, arrêt + `markAllAsTouched()` si invalide | `login-page.*`, `register-page.*` |
| 2 | Validations et messages d'erreur compréhensibles | Validateurs alignés sur le backend (`email`, nom ≥ 2, mot de passe ≥ 8) ; message sous chaque champ (`@if` + `touched` + `hasError`) ; erreurs API traduites par `apiErrorMessage()` (0, 400, 401, 409) ; bouton désactivé pendant l'envoi | `login-page.html`, `register-page.html`, `profile-page.html`, `shared/utils/api-error.ts` (nouveau) |
| 3 | Appels de `/api/auth/register` et `/api/auth/login` | Méthodes `register()` / `login()` de `AuthService` conservées, appelées par les composants | `auth.service.ts` |
| 4 | Sauvegarde du JWT sans l'afficher dans les logs | `localStorage['gpc_token']` via `storeAuthentication()` ; les `console.error` n'affichent plus que le statut HTTP (plus l'objet d'erreur complet) | `auth.service.ts`, pages |
| 5 | Mise à jour du Signal `currentUser` | Mis à jour par `login`, `register`, `profile`, `update` ; ajout de `isAuthenticated` (`computed`) ; nom affiché dans l'en-tête | `auth.service.ts`, `app.html` |
| 6 | Redirection après connexion ou inscription | Connexion → `returnUrl` (fourni par le guard) ou `/tracks` ; inscription → `/profile` | `login-page.ts`, `register-page.ts`, `auth.guard.ts` |
| 7 | Bouton de déconnexion avec nettoyage de l'état local | Bouton dans l'en-tête → `logout()` vide `localStorage` + Signals → `/login` ; liens de navigation selon l'état connecté | `app.ts`, `app.html`, `auth.service.ts`, `styles.css` |
| 8 | Chargement de `/api/users/me` quand le profil est demandé | Chargement automatique dans `ngOnInit()` (plus besoin du bouton), indicateur de chargement | `profile-page.ts`, `profile-page.html` |
| 9 | Modification du nom avec `PUT /api/users/me` | Formulaire validé (≥ 2 caractères, `trim()`), message « Nom mis à jour », bouton inactif si rien n'a changé | `profile-page.*` |
| 10 | Gestion d'un `401` avec retour vers `/login` | `catchError` dans l'intercepteur → `handleUnauthorized()` → `logout()` + `/login?expired=1` + bandeau « session expirée ». Exception pour `/api/auth/*` (un 401 y signifie « mauvais identifiants ») | `auth.interceptor.ts`, `auth.service.ts`, `login-page.*` |
| 11 | « Quel modèle ? tokens ? qui conseille ? » + « routes backend ? où se fait la mise à jour du profil ? » | Réponses rédigées | [LIVRABLES_TP1.md § 6](docs/tp1/LIVRABLES_TP1.md#6-réponses-aux-questions-du-sujet) |
| 12 | « C'est toi qui as mis le fait d'enregistrer une adresse mail ? » | Explication : ce sont les attributs `autocomplete` (le navigateur propose de mémoriser) ; l'appli ne stocke que le JWT | — |
| 13 | « Je veux que ça connecte plus facilement, mets un auto-remplissage » | Compte de démo pré-rempli dans le formulaire de connexion (tentative via `isDevMode()` abandonnée : `ng serve` tourne ici en mode production) | `login-page.ts` |
| 14 | Produire les livrables du TP1 | Schéma annoté, tableau des requêtes Network observées, explication Signal / `localStorage`, relecture de la mission 0, mise à jour de ce rapport | `docs/tp1/*`, `RAPPORT_IA_MODELE.md` |

**Plan proposé par l'agent** :
1. Lire le sujet, `API_CONTRACT.md`, `backend/src/app.js` (règles de validation : nom ≥ 2, mot de passe ≥ 8, 409 si email pris) et le code Angular existant.
2. Centraliser la gestion du 401 dans l'intercepteur (sauf pour `/api/auth/*`, où 401 = mauvais identifiants).
3. Ajouter à `AuthService` : `isAuthenticated` (computed), `handleUnauthorized()`.
4. Réécrire les pages login / register / profile : validations alignées sur le backend, messages d'erreur, état « en cours », logs sans données sensibles.
5. En-tête : liens selon l'état de connexion, nom de l'utilisateur, bouton Déconnexion.

**Fichiers modifiés** :
- `frontend-starter/src/app/shared/services/auth.service.ts`
- `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts`
- `frontend-starter/src/app/shared/guards/auth.guard.ts`
- `frontend-starter/src/app/shared/utils/api-error.ts` (nouveau)
- `frontend-starter/src/app/components/{app,login-page,register-page,profile-page}/*`
- `frontend-starter/src/styles.css`

**Propositions / corrections notables** :
- l'agent avait retiré les identifiants de démo pré-remplis (pas de mot de passe dans le code Angular) ; **choix du binôme : les remettre** pour se connecter plus vite pendant le TP (compte de démo public, à retirer avant une vraie mise en production) ;
- les `console.error` ne loguent plus l'objet d'erreur complet, seulement le statut HTTP ;
- le token n'est pas envoyé sur `/api/auth/*`.

**Vérifications réalisées** :
- `npm run build` : OK ;
- formulaire vide → messages « L’email est obligatoire », « Le mot de passe est obligatoire » ;
- faux token dans `localStorage` puis `/profile` → `GET /api/users/me` renvoie 401 → retour sur `/login?expired=1`, token supprimé ;
- `/tracks` sans token → guard → `/login?returnUrl=%2Ftracks`.
- Scénario complet dans le navigateur (24/09/2026) : `POST /api/auth/login` → 401 (email inconnu), puis 200 (compte démo) → redirection `/tracks` → `GET /api/users/me` 200 → `PUT /api/users/me` 200 (nom modifié puis restauré). Tableau détaillé et logs backend : [docs/tp1/LIVRABLES_TP1.md § 4](docs/tp1/LIVRABLES_TP1.md#4-preuves-network).

**Preuves** :
- schéma du flux : [docs/tp1/schema-flux-connexion.svg](docs/tp1/schema-flux-connexion.svg) (produit avec l'agent, vérifié par le binôme contre le code) ;
- capture Network connexion réussie : [docs/tp1/captures/network-login-200.png](docs/tp1/captures/network-login-200.png) ;
- capture Network connexion refusée : [docs/tp1/captures/network-login-401.png](docs/tp1/captures/network-login-401.png) ;
- capture Network `/api/users/me` : [docs/tp1/captures/network-users-me.png](docs/tp1/captures/network-users-me.png).

**Routes backend utilisées par la mission** : `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me` (+ `GET /api/tracks` après redirection).

**Où s'effectue la mise à jour du profil ?**
- Front : `profile-page.html` (formulaire) → `profile-page.ts` `save()` → `auth.service.ts` `update(name)` (`PUT /api/users/me`, met à jour le Signal `currentUser`) → `auth.interceptor.ts` (ajoute `Authorization: Bearer …`).
- Back : `backend/src/app.js`, route `app.put("/api/users/me", auth, …)` → middleware `auth` (vérifie le JWT) → `User.findByIdAndUpdate` avec `runValidators` → schéma dans `backend/src/models/User.js` (`name` requis, ≥ 2 caractères).

**Ce que chaque membre sait expliquer sans l'agent** : _à compléter par le binôme_.

---

# Rapport d'usage de l'IA - TP2

## Mission 2 — Bibliothèque paginée

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

**Objectif** : afficher les pistes avec une pagination serveur (`GET /api/tracks?page=&limit=`), représentée par des Signals, avec états de chargement, vide et erreur.

**Prompt principal** (rédigé par le binôme, envoyé tel quel) :

```text
TP2, Mission 2 — Bibliothèque paginée (SUJET_ETUDIANT_TP2.md), dans frontend-starter/.
Règles : ne pas toucher au backend ; composant → TrackService → HttpClient (pas de
HttpClient dans le composant) ; une requête GET /api/tracks?page=&limit= à chaque
changement de page, jamais de découpage local.
Procède étape par étape et attends mon « OK » entre chaque :
1. Audit : ce qui existe déjà / ce qui manque pour la mission (sans rien modifier).
2. Vérifier que TrackService.list(page, limit) envoie bien page et limit.
3. Signals tracks, page, pages, loading et error dans le composant.
4. Template : @for, @empty, @if (chargement + erreur), boutons Précédent/Suivant
   désactivés aux bornes.
5. Build + test navigateur, avec la liste des requêtes à capturer dans Network.
6. M'expliquer en quelques lignes le trajet d'un clic sur « Suivant ».
```

**Suivi des étapes** (le binôme valide chaque étape avant la suivante) :

| # | Étape | Résultat | Validée par le binôme |
|---|---|---|---|
| 1 | Audit de l'existant | `list(page, limit)` envoie déjà `page`/`limit` ; Signals `tracks`, `page`, `pages`, `loading` présents ; `@for`/`@empty`/`@if` présents. **Manquants** : Signal `error` et son affichage, `limit` non explicite dans le composant, boutons actifs pendant le chargement, pas de garde de bornes dans `go()`, « Aucune piste » affiché pendant le chargement, libellés « Préc. / Suiv. » | ☐ |
| 2 | `TrackService.list(page, limit)` | _en attente_ | ☐ |
| 3 | Signals du composant | _en attente_ | ☐ |
| 4 | Template | _en attente_ | ☐ |
| 5 | Build + test navigateur | _en attente_ | ☐ |
| 6 | Explication du clic « Suivant » | _en attente_ | ☐ |

**Fichiers modifiés** : _à compléter à la fin de la mission_.

**Preuves** : _capture Network de la pagination à ajouter dans `docs/tp2/captures/`_.

**Ce que chaque membre sait expliquer sans l'agent** : _à compléter par le binôme_.
