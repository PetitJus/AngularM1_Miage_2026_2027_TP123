import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adds the bearer token to protected API requests and handles 401 responses.
 * A 401 from /api/auth/* means wrong credentials, not an expired session,
 * so those requests are left to the login/register pages.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isAuthRoute = request.url.startsWith('/api/auth/');

  const authorized = token && !isAuthRoute
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRoute) {
        auth.handleUnauthorized();
      }
      return throwError(() => error);
    }),
  );
};
