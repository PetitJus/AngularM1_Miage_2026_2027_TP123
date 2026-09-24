import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { apiErrorMessage } from '../../shared/utils/api-error';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal('');
  readonly submitting = signal(false);
  readonly expired = this.route.snapshot.queryParamMap.has('expired');

  // Compte de démonstration pré-rempli pour se connecter plus vite pendant le TP.
  readonly form = new FormGroup({
    email: new FormControl('demo@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('Demo1234!', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    const values = this.form.getRawValue();

    this.auth.login(values.email, values.password).subscribe({
      next: () => {
        console.debug('[LoginPage] Connexion réussie');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/tracks';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: unknown) => {
        // On ne logue que le statut : jamais le corps de la requête (mot de passe).
        console.error('[LoginPage] Échec de connexion', (error as { status?: number }).status);
        this.error.set(apiErrorMessage(error, 'Erreur de connexion'));
        this.submitting.set(false);
      },
    });
  }
}
