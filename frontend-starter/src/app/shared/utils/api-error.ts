import { HttpErrorResponse } from '@angular/common/http';

/**
 * Transforme une erreur HTTP en message lisible pour l'utilisateur.
 * Le message renvoyé par l'API est prioritaire ; sinon on se base sur le statut.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  const message = (error.error as { message?: unknown } | null)?.message;
  if (typeof message === 'string' && message) return message;

  switch (error.status) {
    case 0:
      return 'Serveur injoignable : vérifiez que le backend est démarré.';
    case 400:
      return 'Données invalides.';
    case 401:
      return 'Authentification requise.';
    case 409:
      return 'Cet email est déjà utilisé.';
    default:
      return fallback;
  }
}
