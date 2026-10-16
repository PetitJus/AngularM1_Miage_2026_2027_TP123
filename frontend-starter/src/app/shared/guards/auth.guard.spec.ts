import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';

/** Exécute le guard pour l'URL demandée, avec ou sans token dans localStorage. */
function runGuard(token: string | null, url: string) {
  localStorage.clear();
  if (token) localStorage.setItem('gpc_token', token);

  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const result = TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
  return { result, router: TestBed.inject(Router) };
}

describe('authGuard', () => {
  afterEach(() => localStorage.clear());

  it('redirige un utilisateur sans token vers /login en conservant l’URL demandée', () => {
    const { result, router } = runGuard(null, '/tracks');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Ftracks');
  });

  it('laisse passer un utilisateur qui possède un token', () => {
    const { result } = runGuard('jeton-de-test', '/tracks');

    expect(result).toBe(true);
  });
});
