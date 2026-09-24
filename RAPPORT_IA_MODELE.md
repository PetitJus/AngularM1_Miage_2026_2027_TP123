# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Mission 1 — Inscription, connexion et profil

**Outil / modèle** : Claude Code (application desktop), modèle Claude Opus 5.5 (`claude-opus-5-5`).

**Objectif** : compléter la partie utilisateur du frontend (formulaires réactifs, validations, JWT, Signal `currentUser`, déconnexion, profil, gestion du 401).

**Prompt principal** : « lis le TP1, j'ai fait mission0. Il reste mission1 » + texte de la mission 1.

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
- À faire par le binôme : captures Network (connexion OK, connexion refusée, GET/PUT `/api/users/me`) → à ajouter dans `captures/` et à lier ici.

**Routes backend utilisées par la mission** : `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`, `PUT /api/users/me` (+ `GET /api/tracks` après redirection).

**Où s'effectue la mise à jour du profil ?**
- Front : `profile-page.html` (formulaire) → `profile-page.ts` `save()` → `auth.service.ts` `update(name)` (`PUT /api/users/me`, met à jour le Signal `currentUser`) → `auth.interceptor.ts` (ajoute `Authorization: Bearer …`).
- Back : `backend/src/app.js`, route `app.put("/api/users/me", auth, …)` → middleware `auth` (vérifie le JWT) → `User.findByIdAndUpdate` avec `runValidators` → schéma dans `backend/src/models/User.js` (`name` requis, ≥ 2 caractères).

**Ce que chaque membre sait expliquer sans l'agent** : _à compléter par le binôme_.
