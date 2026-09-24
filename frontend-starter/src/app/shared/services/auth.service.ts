import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'gpc_token';

/** Handles authentication and the current user's profile. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Utilisateur courant, partagé par toute l'application (en mémoire uniquement). */
  readonly currentUser = signal<User | null>(null);
  /** JWT : initialisé depuis localStorage pour survivre à un rechargement de page. */
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { name, email, password })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  profile() {
    return this.http
      .get<User>('/api/users/me')
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  update(name: string) {
    return this.http
      .put<User>('/api/users/me', { name })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Efface tout l'état local d'authentification (localStorage + Signals). */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    console.debug('[AuthService] Déconnexion : état local nettoyé');
  }

  /** Appelé par l'intercepteur quand l'API répond 401 : token invalide ou expiré. */
  handleUnauthorized(): void {
    console.warn('[AuthService] 401 reçu : session expirée ou invalide');
    this.logout();
    void this.router.navigate(['/login'], { queryParams: { expired: 1 } });
  }

  private storeAuthentication(response: AuthResponse): void {
    // Le token est stocké mais jamais affiché dans la console.
    localStorage.setItem(TOKEN_KEY, response.token);
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }
}
