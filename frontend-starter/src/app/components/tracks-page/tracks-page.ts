import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { formatAudioType, formatFileSize } from '../../shared/utils/track-format';

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);

  // Fonctions de formatage utilisées par les cards du template.
  protected readonly formatAudioType = formatAudioType;
  protected readonly formatFileSize = formatFileSize;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly audioUrl = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly file = signal<File | null>(null);

  // État de l'envoi : chargement, erreur serveur, message de succès.
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');

  /** Identifiants des pistes en cours de suppression (bloque les doubles clics). */
  readonly deletingIds = signal<ReadonlySet<string>>(new Set());

  /** Champ fichier natif : nécessaire pour le vider après un envoi réussi. */
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    this.load();
  }

  choose(event: Event): void {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
    this.uploadError.set('');
    this.uploadSuccess.set('');
    console.debug('[TracksPage] Fichier sélectionné', this.file()?.name);
  }

  load(): void {
    this.loading.set(true);
    this.service.list(this.page()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        // Page devenue vide (dernière piste supprimée ici ou ailleurs) : on recule à la dernière page existante.
        if (response.items.length === 0 && this.page() > response.pages) {
          this.page.set(response.pages);
          this.load();
          return;
        }
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[TracksPage] Chargement impossible', error);
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    this.page.set(page);
    this.load();
  }

  upload(): void {
    const file = this.file();
    // Empêche une double soumission tant qu'un envoi est en cours.
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.title.disable();

    this.service.upload(file, this.title.value || file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploadSuccess.set(`« ${track.title} » a bien été ajoutée.`);
        this.resetUploadForm();
        this.page.set(1);
        this.load();
      },
      error: (error: unknown) => {
        console.error('[TracksPage] Envoi impossible', (error as { status?: number }).status);
        this.uploadError.set(apiErrorMessage(error, 'Envoi impossible'));
        this.uploading.set(false);
        this.title.enable();
      },
    });
  }

  private resetUploadForm(): void {
    this.uploading.set(false);
    this.title.enable();
    this.title.setValue('');
    this.file.set(null);
    this.fileInput().nativeElement.value = '';
  }

  isDeleting(track: Track): boolean {
    return this.deletingIds().has(track.id);
  }

  remove(track: Track): void {
    if (this.isDeleting(track)) return;
    if (!confirm(`Supprimer définitivement « ${track.title} » ?`)) return;

    this.setDeleting(track.id, true);
    this.service.delete(track.id).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée', track.id);
        this.setDeleting(track.id, false);
        this.notify(`« ${track.title} » a été supprimée.`, 'success');
        this.load();
      },
      error: (error: unknown) => {
        console.error('[TracksPage] Suppression impossible', (error as { status?: number }).status);
        this.setDeleting(track.id, false);
        if (error instanceof HttpErrorResponse && error.status === 404) {
          // Déjà supprimée (autre onglet) ou piste d'un autre utilisateur : le backend répond 404 dans les deux cas.
          this.notify(`« ${track.title} » n'existe plus ou ne vous appartient pas. La liste a été actualisée.`, 'error');
          this.load();
          return;
        }
        // Le 401 est déjà traité par l'intercepteur (déconnexion + redirection).
        this.notify(apiErrorMessage(error, 'Suppression impossible'), 'error');
      },
    });
  }

  private setDeleting(id: string, deleting: boolean): void {
    this.deletingIds.update((ids) => {
      const next = new Set(ids);
      if (deleting) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private notify(message: string, kind: 'success' | 'error'): void {
    this.snackBar.open(message, 'OK', {
      duration: kind === 'success' ? 4000 : 7000,
      panelClass: kind === 'success' ? 'snack-success' : 'snack-error',
      politeness: kind === 'success' ? 'polite' : 'assertive',
    });
  }

  play(track: Track): void {
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (error) => console.error('[TracksPage] Lecture impossible', error),
    });
  }
}
