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

**Routes backend utilisées par la mission** : `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me` (+ `GET /api/tracks` après redirection).

**Où s'effectue la mise à jour du profil ?**
- Front : `profile-page.html` (formulaire) → `profile-page.ts` `save()` → `auth.service.ts` `update(name)` (`PUT /api/users/me`, met à jour le Signal `currentUser`) → `auth.interceptor.ts` (ajoute `Authorization: Bearer …`).
- Back : `backend/src/app.js`, route `app.put("/api/users/me", auth, …)` → middleware `auth` (vérifie le JWT) → `User.findByIdAndUpdate` avec `runValidators` → schéma dans `backend/src/models/User.js` (`name` requis, ≥ 2 caractères).

**Ce que chaque membre sait expliquer sans l'agent** : _à compléter par le maitre_.

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
| 3 | Signals du composant | _en attente_ | ☐ |
| 4 | Template | _en attente_ | ☐ |
| 5 | Build + test navigateur | _en attente_ | ☐ |
| 6 | Explication du clic « Suivant » | _en attente_ | ☐ |

**Fichiers modifiés** : _à compléter à la fin de la mission_.

**Preuves** : _capture Network de la pagination à ajouter dans `docs/tp2/captures/`_.

**Ce que chaque membre sait expliquer sans l'agent** : _à compléter par le maitre_.

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
| 5 | Validation avant l'envoi | — | _en attente (non demandée pour l'instant)_ | ☐ |
| 6 | Interface pendant l'envoi | 3 | **Avant** : seul le retour à la page 1 existait. Il n'y avait ni état de chargement, ni message de succès ; le double envoi était possible ; les erreurs n'allaient que dans la console ; le champ fichier n'était pas vidé. **Après** : Signals `uploading`, `uploadError`, `uploadSuccess` ; bouton « Envoi en cours… » ; bouton, champ fichier et titre désactivés ; garde contre le double envoi dans `upload()` ; message d'erreur du serveur via `apiErrorMessage()` ; message de succès ; titre et champ fichier vidés (`viewChild`) ; rechargement de la page 1 | ☐ |
| — | Explication de ce qui manquait | 4 | Tableau « avant / il manquait » fourni au maitre (repris dans la ligne 6) | — |
| 7-12 | Parties C à E | — | _en attente_ | ☐ |

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
  - restant à traiter :
    - `accept="audio/*"` est plus large que les formats acceptés par le backend (étape 5) ;
    - aucune validation avant l'envoi (étape 5) ;
    - taille affichée en « Ko » alors qu'elle est en octets (étape 7) ;
    - pas de révocation de la dernière `ObjectURL` (étape 10).

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

- Captures à ajouter dans `docs/tp2/captures/` :
  - `upload-en-cours.png` et `upload-succes.png` : carte « Importer » pendant et après un envoi ;
  - `network-upload-multipart.png` : `POST /api/tracks` ;
  - `network-audio-authorization.png` : `GET /api/tracks/:id/audio` avec l'en-tête `Authorization`.



