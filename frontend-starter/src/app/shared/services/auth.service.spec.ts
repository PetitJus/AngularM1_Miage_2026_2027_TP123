import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthResponse } from '../models/auth-response.model';
import { AuthService } from './auth.service';

// Valeurs factices : aucun vrai compte ni vrai JWT dans les tests.
const RESPONSE: AuthResponse = {
  token: 'jeton-de-test',
  user: { id: 'u1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-10-08T08:00:00.000Z' },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('login() utilise POST /api/auth/login avec email et password', () => {
    service.login('ada@example.com', 'motdepasse-test').subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ada@example.com', password: 'motdepasse-test' });
    request.flush(RESPONSE);
  });

  it('login() mémorise le token et met à jour currentUser', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.login('ada@example.com', 'motdepasse-test').subscribe();
    http.expectOne('/api/auth/login').flush(RESPONSE);

    expect(service.token()).toBe('jeton-de-test');
    expect(localStorage.getItem('gpc_token')).toBe('jeton-de-test');
    expect(service.currentUser()).toEqual(RESPONSE.user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('login() ne mémorise rien si l’API répond 401', () => {
    let status = 0;
    service.login('ada@example.com', 'mauvais').subscribe({
      error: (error: { status: number }) => (status = error.status),
    });
    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Identifiants invalides' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });

  it('logout() efface le token et l’utilisateur', () => {
    service.login('ada@example.com', 'motdepasse-test').subscribe();
    http.expectOne('/api/auth/login').flush(RESPONSE);

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});
