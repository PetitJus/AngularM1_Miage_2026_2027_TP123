# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le maitre; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Mission 0 — Cartographier l'application

**Objectif** : retrouver le composant racine, les routes, l'enregistrement de `HttpClient`, les modèles/services/pages et le mécanisme d'ajout du JWT.

**Réalisation** : cartographie faite par le maitre (voir `COMPTE_RENDU_TP1.docx`), puis relue avec l'agent pendant la mission 1.

**Erreurs corrigées lors de la relecture** :
- `HttpClient` est enregistré dans `src/main.ts` (`provideHttpClient(withInterceptors([authInterceptor]))`), pas dans l'intercepteur ;
- le JWT est ajouté par `auth.interceptor.ts` ; `auth.guard.ts` ne fait que bloquer l'accès aux routes Angular sans token ;
- chemin exact du composant racine : `frontend-starter/src/app/components/app/app.ts`.

Version corrigée : [docs/tp1/LIVRABLES_TP1.md § 2](docs/tp1/LIVRABLES_TP1.md#2-cartographie-de-lapplication-mission-0).

## Mission 1 — Inscription, connexion et profil

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

**Objectif** : compléter la partie utilisateur du frontend (formulaires réactifs, validations, JWT, Signal `currentUser`, déconnexion, profil, gestion du 401).

**Prompt principal** : demande de réaliser la mission 1 à partir du sujet `SUJET_ETUDIANT_TP1.md`, en précisant que la mission 0 était déjà terminée par le maitre. Le prompt contenait le texte intégral de la consigne, soit :
- les 10 exigences fonctionnelles, détaillées dans le tableau ci-dessous ;
- les contraintes d'architecture : aucun appel à `HttpClient` dans les composants (tout passe par `AuthService`), injection avec `inject()`, séparation claire entre interface, service et API ;
- les questions du sujet : modèle d'IA utilisé, suivi des tokens, routes du backend, localisation de la mise à jour du profil.

**Tâches demandées et réalisation (dans l'ordre de la conversation)** :

| # | Demande du maitre | Ce qui a été effectué | Fichiers |
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
- l'agent avait retiré les identifiants de démo pré-remplis (pas de mot de passe dans le code Angular) ; **choix du maitre : les remettre** pour se connecter plus vite pendant le TP (compte de démo public, à retirer avant une vraie mise en production) ;
- les `console.error` ne loguent plus l'objet d'erreur complet, seulement le statut HTTP ;
- le token n'est pas envoyé sur `/api/auth/*`.

**Vérifications réalisées** :
- `npm run build` : OK ;
- formulaire vide → messages « L’email est obligatoire », « Le mot de passe est obligatoire » ;
- faux token dans `localStorage` puis `/profile` → `GET /api/users/me` renvoie 401 → retour sur `/login?expired=1`, token supprimé ;
- `/tracks` sans token → guard → `/login?returnUrl=%2Ftracks`.
- Scénario complet dans le navigateur (24/09/2026) : `POST /api/auth/login` → 401 (email inconnu), puis 200 (compte démo) → redirection `/tracks` → `GET /api/users/me` 200 → `PUT /api/users/me` 200 (nom modifié puis restauré). Tableau détaillé et logs backend : [docs/tp1/LIVRABLES_TP1.md § 4](docs/tp1/LIVRABLES_TP1.md#4-preuves-network).

**Preuves** :
- schéma du flux : [docs/tp1/schema-flux-connexion.svg](docs/tp1/schema-flux-connexion.svg) (produit avec l'agent, vérifié par le maitre contre le code) ;
- capture Network connexion réussie : [docs/tp1/captures/network-login-200.png](docs/tp1/captures/network-login-200.png) ;
- capture Network connexion refusée : [docs/tp1/captures/network-login-401.png](docs/tp1/captures/network-login-401.png) ;
- capture Network `/api/users/me` : [docs/tp1/captures/network-users-me.png](docs/tp1/captures/network-users-me.png).

Les trois captures ont été faites le 16/10/2026 par l'agent, à la demande du maitre (« finis le doc TP1 »). L'agent a piloté Edge sans fenêtre avec les DevTools ouvertes (protocole DevTools) et le compte démo. Avant chaque capture, il a remplacé le JWT par `<JWT masqué>` dans l'affichage des DevTools, puis vérifié qu'aucun JWT ni mot de passe ne restait visible.

**Routes backend utilisées par la mission** : `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me` (+ `GET /api/tracks` après redirection).

**Où s'effectue la mise à jour du profil ?**
- Front : `profile-page.html` (formulaire) → `profile-page.ts` `save()` → `auth.service.ts` `update(name)` (`PUT /api/users/me`, met à jour le Signal `currentUser`) → `auth.interceptor.ts` (ajoute `Authorization: Bearer …`).
- Back : `backend/src/app.js`, route `app.put("/api/users/me", auth, …)` → middleware `auth` (vérifie le JWT) → `User.findByIdAndUpdate` avec `runValidators` → schéma dans `backend/src/models/User.js` (`name` requis, ≥ 2 caractères).

**Ce que je sais expliquer sans l'agent (travail individuel)** : _à confirmer par le maitre_. Points attendus :
- le trajet d'un clic sur « Se connecter » : composant → `AuthService.login()` → `HttpClient` → proxy → Express → MongoDB, puis `tap` qui enregistre le token ;
- le rôle de l'intercepteur (ajouter le JWT, gérer le 401) et celui du guard (bloquer la navigation sans token) ;
- la différence entre le Signal `currentUser` et `localStorage` ;
- pourquoi le composant n'appelle jamais `HttpClient` directement.

---

# Rapport d'usage de l'IA - TP2

## Mission 2 — Bibliothèque paginée

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

**Objectif** : afficher les pistes avec une pagination serveur (`GET /api/tracks?page=&limit=`), représentée par des Signals, avec états de chargement, vide et erreur.

**Prompt principal** (rédigé par le maitre, envoyé tel quel) :

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

**Suivi des étapes** (le maitre valide chaque étape avant la suivante) :

| # | Étape | Résultat | Validée par le maitre |
|---|---|---|---|
| 1 | Audit de l'existant | `list(page, limit)` envoie déjà `page`/`limit` ; Signals `tracks`, `page`, `pages`, `loading` présents ; `@for`/`@empty`/`@if` présents. **Manquants** : Signal `error` et son affichage, `limit` non explicite dans le composant, boutons actifs pendant le chargement, pas de garde de bornes dans `go()`, « Aucune piste » affiché pendant le chargement, libellés « Préc. / Suiv. » | ☑ |
| 2 | `TrackService.list(page, limit)` | Vérifié, **aucune modification nécessaire** : `http.get('/api/tracks', { params: { page, limit } })` produit `GET /api/tracks?page=N&limit=5`. Côté backend, `page` est ramené à ≥ 1 et `limit` à [1, 20]. Le passage explicite de `limit` depuis le composant est reporté à l'étape 3 | ☐ |
| 3 | Signals du composant | Fait le 16/10 (session « finis les docs », voir plus bas) : Signal `listError`, constante `PAGE_SIZE` passée à `list()`, garde de bornes dans `go()` | ☐ |
| 4 | Template | Fait le 16/10 : erreur avec « Réessayer », `@empty` masqué pendant le chargement, boutons « Précédent » / « Suivant » désactivés aussi pendant le chargement | ☐ |
| 5 | Build + test navigateur | `npm run build` OK ; 3 tests unitaires de pagination ; scénario Edge à 7 pistes : `page=2&limit=5` → 200, boutons désactivés aux bornes | ☐ |
| 6 | Explication du clic « Suivant » | Rédigée dans [COMPTE_RENDU_TP2.md, mission 2](docs/tp2/COMPTE_RENDU_TP2.md#mission-2--bibliothèque-paginée) | ☐ |

Les étapes 3 à 6 n'ont pas été validées une par une : elles ont été faites d'un bloc le 16/10, à la demande « finis le doc TP2 ».

**Fichiers modifiés** : `frontend-starter/src/app/components/tracks-page/tracks-page.ts`, `tracks-page.html`, `tracks-page.spec.ts`.

**Preuves** : [capture DevTools de la pagination](docs/tp2/captures/network-pagination.png), [capture de l'erreur de liste](docs/tp2/captures/liste-erreur.png), [trace réseau](docs/tp2/captures/network-trace-verification.txt).

**Ce que je sais expliquer sans l'agent (travail individuel)** : _à compléter par le maitre_.

## Mission 3 — Analyse et amélioration de l'upload et de la lecture audio

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

### Objectif

Comprendre le mécanisme existant d'upload et de lecture audio authentifiée (fichiers, méthodes, JWT, contrôles du backend), puis compléter uniquement ce qui manque côté frontend, sans modifier le backend ni le contrat HTTP.

### Prompt principal

Prompts envoyés par le maitre, dans l'ordre (orthographe corrigée).

**Prompt 1 — Partie A (analyse) :**

```text
Effectue l'analyse (sans modifier de code).
Cartographie l'upload en indiquant les fichiers et méthodes.
Puis la lecture.
Ensuite, Intercepteur et JWT : montrer où le JWT est ajouté à la requête audio et
expliquer pourquoi une URL placée directement dans src ne l'envoie pas.
Contrôles du backend : repérer dans app.js le fichier audio obligatoire, le champ
title, les types MIME autorisés et la limite de 25 Mo. Vérifier que le FormData du
frontend correspond exactement.
Renseigne aussi avec les fichiers méthodes AI etc, et mets dans le compte rendu.
```

**Prompt 2 — Contrôles du backend (extrait du sujet collé) :**

```text
Fais la seconde partie :
Le backend vérifie déjà que le multipart contient le fichier `audio`, lit le champ
`title`, accepte les formats audio prévus et refuse les fichiers de plus de 25 Mo.
Identifiez ces contrôles dans le code backend et vérifiez que le frontend construit
bien le `FormData` avec exactement `audio` et `title`.
```

**Prompt 3 — Vérification réelle + interface pendant l'envoi (extrait du sujet collé) :**

```text
Vérifie et :
Ajoutez ou complétez uniquement les éléments d'interface manquants pendant l'envoi :
- afficher un état de chargement ;
- désactiver le bouton et empêcher les doubles soumissions ;
- afficher les erreurs du serveur ;
- afficher un message de succès ;
- vider le formulaire et recharger la première page après succès.
```

**Prompt 4 — Question de compréhension :** « Il manquait quoi ? »

**Prompt 5 :** « Mets à jour dans le fichier AI, ce qui a été demandé et effectué. »

**Prompt 6 (16/10/2026, envoyé tel quel) :**

```text
yo, tu peux finir le doc TP1 stp ? puis le TP2 et 3 séparemment
```

L'agent a jugé que le doc TP2 ne pouvait pas être « fini » sans le code qui manquait encore. Il a donc codé les étapes 3-4 de la mission 2 et les étapes 5, 8, 9 et 10 de la mission 3, puis ajouté les tests et les captures.

### Plan proposé par l'agent

Découpage de la mission en 12 étapes, validé par le maitre :

| Partie | # | Étape |
|---|---|---|
| A. Analyse (sans code) | 1 | Cartographier l'upload (fichiers et méthodes) |
| | 2 | Cartographier la lecture |
| | 3 | Intercepteur et JWT ; pourquoi `src` n'envoie pas le token |
| | 4 | Contrôles du backend et cohérence du `FormData` |
| B. Upload | 5 | Validation avant l'envoi (format et taille) |
| | 6 | États d'envoi : chargement, anti double envoi, erreur, succès, réinitialisation |
| C. Affichage | 7 | Cards responsives et accessibles |
| D. Lecture | 8 | Affichage du morceau en cours |
| | 9 | Erreur audio compréhensible |
| | 10 | Révocation de l'`ObjectURL` à la destruction du composant |
| E. Vérification | 11 | Build et tests dans le navigateur, requêtes à capturer |
| | 12 | Réponses écrites (mémoire, buffering, streaming, `Blob` / `ObjectURL`) |

Ce qui a été demandé et effectué (détail dans [docs/tp2/COMPTE_RENDU_TP2.md](docs/tp2/COMPTE_RENDU_TP2.md), sections A.1 à A.5) :

| # | Étape | Prompt | Résultat | Validée par le maitre |
|---|---|---|---|---|
| 1 | Cartographie de l'upload | 1 | 14 étapes tracées, du `<input type="file">` jusqu'à `Track.create`, puis le rechargement de la page 1 | ☐ |
| 2 | Cartographie de la lecture | 1 | 10 étapes tracées : `play()` → `audio(id)` (`responseType: 'blob'`) → `findOne({ _id, ownerId })` → `sendFile` → `createObjectURL` → `<audio>` | ☐ |
| 3 | Intercepteur et JWT | 1 | JWT ajouté dans `auth.interceptor.ts` l. 16-18 pour toute requête `HttpClient` hors `/api/auth/*`. Une URL dans `src` est chargée par le navigateur, sans `HttpClient` ni intercepteur, et le HTML ne permet pas d'ajouter d'en-tête : le backend répond 401 | ☐ |
| 4 | Contrôles du backend et `FormData` (lecture du code) | 1, 2 | `auth` avant Multer ; `upload.single("audio")` + `!req.file` → 400 ; `title` facultatif (repli sur `originalname`) ; 6 types MIME (l. 34-40) ; 25 Mo (l. 31 et 108) → 400. Le `FormData` du frontend (`audio` + `title`) est **conforme**. Le prompt 2 demandait cette même étape : l'agent a renvoyé à la section A.4 déjà rédigée | ☐ |
| 4 bis | Contrôles du backend testés en conditions réelles | 3 | 8 requêtes `POST /api/tracks` envoyées avec `fetch` depuis la page connectée : sans token → 401 ; sans fichier → 400 ; champ `file` → 400 ; `text/plain` → 400 ; `audio/flac` → 400 ; 25 Mo + 1 octet → 400 ; MP3 avec `title` → 201 ; MP3 sans `title` → 201 (titre = nom du fichier). Les 2 pistes de test ont été supprimées (`DELETE` → 204) | ☐ |
| 5 | Validation avant l'envoi | 6 | Fait le 16/10 : `validateAudioFile()` (mêmes 6 types MIME et même limite de 25 Mo que le backend), appelée au choix du fichier et avant l'envoi ; `accept` restreint ; message `role="alert"` ; aucune requête pour un fichier refusé | ☐ |
| 6 | Interface pendant l'envoi | 3 | **Avant** : seul le retour à la page 1 existait. Il n'y avait ni état de chargement, ni message de succès ; le double envoi était possible ; les erreurs n'allaient que dans la console ; le champ fichier n'était pas vidé. **Après** : Signals `uploading`, `uploadError`, `uploadSuccess` ; bouton « Envoi en cours… » ; bouton, champ fichier et titre désactivés ; garde contre le double envoi dans `upload()` ; message d'erreur du serveur via `apiErrorMessage()` ; message de succès ; titre et champ fichier vidés (`viewChild`) ; rechargement de la page 1 | ☐ |
| — | Explication de ce qui manquait | 4 | Tableau « avant / il manquait » fourni au maitre (repris dans la ligne 6) | — |
| 7 | Cards responsives et accessibles | — | Fait le 02/10 (avant le commit `29fea2e`) : voir la section C du compte rendu | ☐ |
| 8 | Morceau en cours | 6 | Fait le 16/10 : Signals `currentTrack` et `audioLoading`, « Chargement de… » puis « En cours de lecture » | ☐ |
| 9 | Erreur audio compréhensible | 6 | Fait le 16/10 : message selon le statut HTTP (le corps d'erreur est un `Blob`) et `(error)` sur `<audio>` | ☐ |
| 10 | Révocation de l'`ObjectURL` finale | 6 | Fait le 16/10 : `DestroyRef.onDestroy(() => revokeAudioUrl())` | ☐ |
| 11 | Build et tests | 6 | Build OK ; 10 tests unitaires TP2 (34 sur 34 au total) ; scénario Edge à 22 vérifications sur 22, dont le test du propriétaire avec un second compte | ☐ |
| 12 | Réponses écrites | 1 | Sections E et F du compte rendu (rédigées le 02/10, mises à jour le 16/10) | ☐ |

### Vérifications réalisées par le maitre

- Relecture des tableaux A.1 à A.4 en ouvrant les fichiers et lignes cités : _à faire_ ;
- Network, `GET /api/tracks/:id/audio` : présence de `Authorization: Bearer …` et `Content-Type` audio dans la réponse : _à faire_ ;
- Network, `POST /api/tracks` : `multipart/form-data` avec les champs `audio` et `title` : _à faire_ ;
- Étape 6, à refaire à la main dans l'interface : envoyer `song1.mp3` (succès, formulaire vidé), puis un fichier non audio (message d'erreur), puis double-cliquer sur « Envoyer » (une seule requête dans Network) : _à faire_.

Vérifications déjà effectuées par l'agent (étape 6), dans le navigateur avec le compte démo :
- erreur : fichier `text/plain` → bouton « Envoi en cours… » et champ désactivé pendant l'envoi, puis « Format audio non accepté » ;
- succès : MP3 de test + titre « verif-ui » → « « verif-ui » a bien été ajoutée. », titre et champ fichier vidés, piste en tête de la page 1 ;
- double clic : une seule requête `POST /api/tracks` (confirmée par les logs du backend : un seul `201`) ;
- `npm run build` : OK ;
- **non vérifié** : retour à la page 1 depuis une autre page (la bibliothèque ne contient qu'une page).

### Erreurs ou propositions rejetées

- Aucune proposition rejetée.
- Limites constatées, non traitées :
  - les messages « Unexpected field » et « File too large » viennent directement de Multer et restent en anglais dans l'interface ;
  - le type vérifié par le backend est celui que déclare le navigateur, pas le contenu réel du fichier.
- Faiblesses de l'existant relevées par l'analyse :
  - corrigées à l'étape 6 : double envoi possible, erreurs seulement dans la console, champ fichier non vidé ;
  - corrigées ensuite :
    - taille affichée en « Ko » alors qu'elle est en octets (étape 7, le 02/10) ;
    - `accept="audio/*"` plus large que les formats acceptés par le backend (étape 5, le 16/10) ;
    - aucune validation avant l'envoi (étape 5, le 16/10) ;
    - pas de révocation de la dernière `ObjectURL` (étape 10, le 16/10).

### Fichiers effectivement modifiés

- Partie A (étapes 1 à 4 bis) : **aucun fichier de code modifié**.
- Étape 6 :
  - `frontend-starter/src/app/components/tracks-page/tracks-page.ts` :
    - `file` transformé en Signal ;
    - Signals `uploading`, `uploadError`, `uploadSuccess` ;
    - `viewChild` sur le champ fichier ;
    - `upload()` réécrit, avec la garde contre le double envoi et la gestion des erreurs ;
    - nouvelle méthode `resetUploadForm()` ;
  - `frontend-starter/src/app/components/tracks-page/tracks-page.html` : carte « Importer » (référence `#fileInput`, bouton à libellé dynamique, `aria-busy`, messages de chargement, d'erreur et de succès).
- Fichiers consultés en lecture seule :
  - frontend : `components/tracks-page/tracks-page.ts`, `tracks-page.html`, `shared/services/track.service.ts`, `shared/interceptors/auth.interceptor.ts`, `main.ts`, `proxy.conf.json` ;
  - backend : `backend/src/app.js`.
- Documentation produite : [docs/tp2/COMPTE_RENDU_TP2.md](docs/tp2/COMPTE_RENDU_TP2.md) et cette section du rapport.

### Preuve de fonctionnement

- Partie A (analyse) : références précises aux fichiers et numéros de ligne dans le compte rendu, sections A.1 à A.4.
- Contrôles du backend : tableau des 8 requêtes de test dans le compte rendu (section A.4, « Vérification en conditions réelles »).
- Logs du backend pendant les tests de l'étape 6 (erreur, puis succès malgré le double clic, puis nettoyage) :

```text
[http] POST /api/tracks -> 400 (3 ms)
[http] POST /api/tracks -> 201 (29 ms)
[http] DELETE /api/tracks/6abfc3e3aa62a127cbdcaf7f -> 204 (23 ms)
```

- Captures de l'interface : `upload-en-cours.png`, `upload-succes.png`, `upload-erreur.png`, `cards-bibliotheque.png`, `cards-mobile.png` (02/10).
- Captures page + DevTools du 16/10 : [`network-upload-multipart.png`](docs/tp2/captures/network-upload-multipart.png), [`network-audio-authorization.png`](docs/tp2/captures/network-audio-authorization.png), [`network-pagination.png`](docs/tp2/captures/network-pagination.png), [`validation-fichier-refuse.png`](docs/tp2/captures/validation-fichier-refuse.png), [`lecture-erreur-404.png`](docs/tp2/captures/lecture-erreur-404.png), [`liste-erreur.png`](docs/tp2/captures/liste-erreur.png).

### Session du 16/10/2026 : fin du TP2

- **Fichiers modifiés** :
  - `shared/utils/track-format.ts` : `MAX_AUDIO_SIZE`, `AUDIO_ACCEPT`, `validateAudioFile()` ;
  - `components/tracks-page/tracks-page.ts` : `PAGE_SIZE`, `listError`, `fileError`, `currentTrack`, `audioLoading`, `audioError`, `go()` avec garde de bornes, `choose()` et `upload()` avec validation, `play()`, `onAudioError()`, `revokeAudioUrl()`, `DestroyRef` ;
  - `tracks-page.html` et `.css` : aide et erreur du champ fichier, erreur de liste + « Réessayer », pagination, bloc « Lecteur audio » ;
  - `tracks-page.spec.ts` : 10 tests.
- **Vérifications** :
  - `npm run build` OK ;
  - `npm test` : 34 sur 34 ;
  - test volontairement cassé (révocation retirée) → 1 échec, puis code rétabli ;
  - scénario Edge (backend et MongoDB réels) : 22 vérifications sur 22.
- **Données de test** :
  - 4 pistes « Test pagination » et 1 piste « Démo multipart », toutes supprimées ensuite ; la bibliothèque du compte démo est revenue à `song1`, `song2` ;
  - un compte `verif-proprietaire-…@example.com`, créé pour le test du propriétaire, reste en base, sans piste (l'API ne permet pas de supprimer un compte).
- **Limite** : le scénario a été joué deux fois. Le premier passage a révélé des défauts de cadrage dans les captures (le code n'était pas en cause). Les captures viennent du second passage, et le test du propriétaire du premier, pour ne pas créer un deuxième compte de test.

---

# Rapport d'usage de l'IA - TP3

**Outil / modèle** : Claude Code (extension VS Code), modèle Claude Opus 5.5 (`claude-opus-5-5`).

Détail technique, tableaux de tests et captures : [docs/tp3/COMPTE_RENDU_TP3.md](docs/tp3/COMPTE_RENDU_TP3.md).

## Mission 5 — Suppression d'une piste

**Objectif** : ajouter la suppression d'une piste (confirmation, état anti double clic, SnackBar, rafraîchissement, cas du 404) en passant par `TrackService`.

**Prompt principal** : _à compléter par le maitre (session du 02/10/2026)_.

**Réalisation** : `TrackService.delete(id)`, méthode `remove()` et Signal `deletingIds` dans `TracksPageComponent`, bouton « Supprimer » dans chaque card, messages avec `MatSnackBar` (Angular Material ajouté au projet). Voir les sections 5.1 à 5.5 du compte rendu.

**Fichiers modifiés** : `tracks-page.ts`, `tracks-page.html`, `tracks-page.css`, `track.service.ts`, `styles.css`, `angular.json`, `package.json`.

**Preuve de fonctionnement** : scénario de bout en bout dans Edge, 11 vérifications sur 11 (section 5.3) ; trace réseau `DELETE → 204`, `404` et `401` (section 5.5).

**Ce que je sais expliquer sans l'agent (travail individuel)** : _à compléter par le maitre_.

## Missions 6 et 7 — Progression de l'upload et tests automatisés

**Objectif** : afficher la progression de l'upload avec les événements HTTP d'Angular (quatre états distincts), puis écrire des tests frontend reproductibles sans backend.

### Prompt principal

Deux messages, envoyés tels quels le 08/10/2026 :

```text
le TP2 est fini ?
```

```text
commit push , puis fais le TP3
```

Contrairement aux missions précédentes, le maitre n'a pas demandé de validation étape par étape : l'agent a enchaîné les missions 6 et 7 seul.

### Plan suivi par l'agent

| # | Étape | Résultat |
|---|---|---|
| 1 | État du TP2 (réponse à la première question) | TP2 **non terminé** : 4 exigences de code manquantes (Signal d'erreur de la liste, validation avant l'envoi, morceau en cours et erreur audio, révocation de la dernière `ObjectURL`) et éléments de rendu à compléter. Ces points **n'ont pas été traités** dans cette session |
| 2 | Commit et push de l'existant | Commit `29fea2e` « TP2 Mission3 et TP3 Mission5 » poussé sur `main`, après vérification qu'aucun JWT ne figurait dans les fichiers ajoutés |
| 3 | Lecture du sujet TP3 et de l'existant | Mission 5 déjà faite ; missions 6 et 7 à faire ; aucun test frontend, `ng test` non fonctionnel |
| 4 | Mission 6 : service | `upload()` avec `reportProgress: true` et `observe: 'events'` |
| 5 | Mission 6 : composant et template | Signals `uploadStatus` et `uploadProgress`, tri des événements par `event.type`, barre `<progress>` |
| 6 | Mission 7 : configuration des tests | `jsdom`, `buildTarget` dans `angular.json`, `tsconfig.spec.json` |
| 7 | Mission 7 : 24 tests frontend | Service de pistes, service d'authentification, intercepteur, guard, composant |
| 8 | Extension facultative : 6 tests backend | 401 sans JWT ou avec JWT invalide, upload sans fichier, type MIME refusé |
| 9 | Vérification dans un vrai navigateur | A révélé le défaut décrit ci-dessous, corrigé avec `withXhr()` |
| 10 | Build, compte rendu, ce rapport | `npm run build` OK |

### Vérifications réalisées par le maitre

- Relire les 5 fichiers `*.spec.ts` et pouvoir dire ce que vérifie chaque `expect` : _à faire_ ;
- Lancer soi-même `npm test` (frontend et backend) et `npm run build` : _à faire_ ;
- Refaire un upload à la main avec le réseau ralenti dans DevTools et observer le pourcentage : _à faire_ ;
- Captures DevTools de la requête `DELETE` et de la requête d'upload : faites par l'agent le 16/10 (voir ci-dessous). Reste à les relire.

Vérifications déjà effectuées par l'agent :

- `npm test` dans `frontend-starter/` : 24 tests réussis sur 24 ;
- `npm test` dans `backend/` : 8 tests réussis sur 8 ;
- `npm run build` : OK ;
- scénario réel dans Edge (compte démo, backend et MongoDB réels, débit d'envoi limité) : 13 vérifications sur 13, pourcentage de 0 % à 100 %, un seul `POST` malgré un double clic, message d'erreur pour un fichier refusé ;
- contrôle des tests par une erreur volontaire : avec `50 * event.loaded` au lieu de `100 * event.loaded`, le test de progression échoue bien ; le code a été rétabli ;
- console du navigateur : aucun JWT ni mot de passe journalisé.

### Erreurs ou propositions rejetées

- **Erreur de l'agent, détectée par sa propre vérification** : la première version affichait « 0 % » pendant tout l'envoi. Les 24 tests unitaires passaient pourtant, car ils simulent les événements de progression. La cause : Angular 22 utilise `fetch` par défaut, qui ne rapporte pas la progression d'un envoi. Correction : `withXhr()` dans `main.ts`. Leçon : un test unitaire vert ne prouve pas que la fonctionnalité marche dans le navigateur.
- **Erreur du script de vérification** (pas de l'application) : le contrôle « aucune erreur inattendue dans la console » échouait à cause de `favicon.ico`, absent du projet depuis le début. Le script a été ajusté et la remarque notée dans le compte rendu.
- **Non réalisé** : les tests backend de pagination et d'accès à la piste d'un autre utilisateur, qui demandent une base MongoDB de test.
- **Écart avec les consignes du dépôt** : `frontend-starter/AGENTS.md` demande de ne jamais modifier `backend/`. L'agent a tout de même ajouté des tests dans `backend/test/api.test.js`, parce que le sujet du TP3 propose explicitement cette extension. Aucune route ni aucun code applicatif du backend n'a été modifié. À valider par le maitre.

### Fichiers effectivement modifiés

- Mission 6 :
  - `frontend-starter/src/app/shared/services/track.service.ts` : options de `upload()` ;
  - `frontend-starter/src/app/components/tracks-page/tracks-page.ts` : type `UploadStatus`, Signals `uploadStatus` et `uploadProgress`, `upload()` ;
  - `frontend-starter/src/app/components/tracks-page/tracks-page.html` et `.css` : barre de progression ;
  - `frontend-starter/src/main.ts` : `withXhr()`.
- Mission 7 :
  - nouveaux : `track.service.spec.ts`, `auth.service.spec.ts`, `auth.interceptor.spec.ts`, `auth.guard.spec.ts`, `tracks-page.spec.ts`, `frontend-starter/tsconfig.spec.json` ;
  - configuration : `frontend-starter/angular.json`, `tsconfig.json`, `tsconfig.app.json`, `package.json` et `package-lock.json` (`jsdom`) ;
  - `backend/test/api.test.js` : 6 tests ajoutés.
- Documentation : `docs/tp3/COMPTE_RENDU_TP3.md`, `docs/tp3/captures/` (3 captures, trace réseau, résultats), ce rapport.

### Preuve de fonctionnement

- Rapport des tests, attendus et observés : compte rendu, sections 7.2 et 7.3.
- Scénario navigateur et captures : compte rendu, section 6.4.
- Trace réseau : [docs/tp3/captures/network-trace-upload.txt](docs/tp3/captures/network-trace-upload.txt).

### Ce que je sais expliquer sans l'agent (travail individuel)

_À compléter par le maitre._ Les six questions de la restitution orale ont des éléments de réponse dans le compte rendu (section « Restitution orale »).

## Session du 16/10/2026 — fin des livrables TP3

**Prompt** : « yo, tu peux finir le doc TP1 stp ? puis le TP2 et 3 séparemment ».

**Ce qui manquait au TP3** :
- les deux captures DevTools (`DELETE` après confirmation, upload pendant la progression) ;
- le test de suppression de la piste d'un autre utilisateur.

**Ce que l'agent a fait** :
- Pour les captures, Edge a été piloté sans fenêtre par le protocole DevTools, avec les DevTools ouvertes sur Network :
  - **upload** : débit limité avec le profil « Slow 4G » des DevTools, capture vers 35 % pendant que le `POST` est encore en cours ;
  - **suppression** : la vraie boîte `confirm()` est acceptée, puis la capture montre `DELETE → 204` et le SnackBar.
- Avant chaque capture, le JWT est remplacé par `<JWT masqué>` dans l'affichage des DevTools, puis le script vérifie qu'aucun JWT ni mot de passe n'est encore visible.
- Résultat : 11 vérifications sur 11, et la piste de test est supprimée.
- Le test du propriétaire a été fait pendant la session TP2 avec un second compte : `DELETE` de `song1` → 404.
- `npm test` relancé : frontend 34 / 34, backend 8 / 8 ; `npm run build` OK.

**Erreurs de l'agent, corrigées avant de garder les captures** :
- Premier essai : la limitation de débit, réglée en dehors du menu, n'apparaissait pas dans les DevTools (« No throttling »). L'agent a utilisé à la place un profil prédéfini, visible dans le menu.
- Le SnackBar avait disparu avant la capture : la page est désormais capturée juste après le clic.
- Une première étiquette parlait de « 3G » alors que le profil appliqué était « Slow 4G ». Elle a été corrigée et la capture refaite.

**Fichiers** :
- `docs/tp3/captures/network-delete.png`, `network-upload-progression.png`, `network-trace-captures-devtools.txt`, `resultats-captures-devtools.json` ;
- `docs/tp3/COMPTE_RENDU_TP3.md` : sections 5.3, 5.5, 6.4, « Vérifications finales » et « Livrables ».
