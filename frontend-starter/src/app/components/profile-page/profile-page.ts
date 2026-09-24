import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { apiErrorMessage } from '../../shared/utils/api-error';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  ngOnInit(): void {
    // Le profil est chargé dès que la page est demandée.
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.profile().subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        // Un 401 est déjà traité par l'intercepteur (redirection vers /login).
        console.error('[ProfilePage] Chargement impossible', (error as { status?: number }).status);
        this.error.set(apiErrorMessage(error, 'Impossible de charger le profil'));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.auth.update(this.form.getRawValue().name.trim()).subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil enregistré', user.id);
        this.success.set('Nom mis à jour.');
        this.form.markAsPristine();
        this.saving.set(false);
      },
      error: (error: unknown) => {
        console.error('[ProfilePage] Enregistrement impossible', (error as { status?: number }).status);
        this.error.set(apiErrorMessage(error, 'Impossible d’enregistrer le profil'));
        this.saving.set(false);
      },
    });
  }
}
