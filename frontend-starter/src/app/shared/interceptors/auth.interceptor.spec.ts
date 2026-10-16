import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

/** Le token est lu dans localStorage à la création d'AuthService : il doit être posé avant. */
function setup(token: string | null) {
  localStorage.clear();
  if (token) localStorage.setItem('gpc_token', token);

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  return {
    client: TestBed.inject(HttpClient),
    http: TestBed.inject(HttpTestingController),
    auth: TestBed.inject(AuthService),
    router: TestBed.inject(Router),
  };
}

describe('authInterceptor', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('ajoute Authorization: Bearer <token> quand un token existe', () => {
    const { client, http } = setup('jeton-de-test');
    client.get('/api/tracks').subscribe();

    const request = http.expectOne('/api/tracks');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jeton-de-test');
    request.flush({});
  });

  it('n’ajoute pas Authorization sans token', () => {
    const { client, http } = setup(null);
    client.get('/api/tracks').subscribe();

    const request = http.expectOne('/api/tracks');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('n’ajoute pas Authorization sur /api/auth/*, même avec un token', () => {
    const { client, http } = setup('jeton-de-test');
    client.post('/api/auth/login', {}).subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('sur un 401, déconnecte, redirige vers /login et propage l’erreur', () => {
    const { client, http, auth, router } = setup('jeton-de-test');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let status = 0;
    client.get('/api/tracks').subscribe({ error: (error: { status: number }) => (status = error.status) });

    http
      .expectOne('/api/tracks')
      .flush({ message: 'Jeton invalide ou expiré' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: 1 } });
  });

  it('un 401 sur /api/auth/login ne déclenche pas la déconnexion', () => {
    const { client, http, auth, router } = setup('jeton-de-test');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    client.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Identifiants invalides' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.token()).toBe('jeton-de-test');
    expect(navigate).not.toHaveBeenCalled();
  });
});
