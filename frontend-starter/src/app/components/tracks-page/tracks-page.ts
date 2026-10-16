import { Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { AUDIO_ACCEPT, formatAudioType, formatFileSize, validateAudioFile } from '../../shared/utils/track-format';

/** Nombre de pistes par page, transmis à l'API à chaque requête. */
export const PAGE_SIZE = 5;

/** États possibles de l'envoi : aucun envoi, en cours, réussi, en échec. */
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

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
  protected readonly audioAccept = AUDIO_ACCEPT;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  /** Erreur de chargement de la liste (vide si aucune). */
  readonly listError = signal('');
  readonly audioUrl = signal('');
  /** Piste en cours de lecture (ou de téléchargement), affichée au-dessus du lecteur. */
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal(false);
  readonly audioError = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly file = signal<File | null>(null);
  /** Fichier refusé avant l'envoi (format ou taille), avec le message à afficher. */
  readonly fileError = signal('');

  // État de l'envoi : statut, pourcentage, erreur serveur, message de succès.
  readonly uploadStatus = signal<UploadStatus>('idle');
  readonly uploading = computed(() => this.uploadStatus() === 'uploading');
  /** Pourcentage envoyé (0 à 100), calculé à partir des événements de progression HTTP. */
  readonly uploadProgress = signal(0);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');

  /** Identifiants des pistes en cours de suppression (bloque les doubles clics). */
  readonly deletingIds = signal<ReadonlySet<string>>(new Set());

  /** Champ fichier natif : nécessaire pour le vider après un envoi réussi. */
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    this.load();
    // L'ObjectURL garde le Blob en mémoire : on libère la dernière en quittant la page.
    inject(DestroyRef).onDestroy(() => this.revokeAudioUrl());
  }

  choose(event: Event): void {
    const selected = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.uploadStatus.set('idle');
    this.uploadProgress.set(0);
    this.uploadError.set('');
    this.uploadSuccess.set('');

    // Mêmes contrôles que le backend, avant tout appel HTTP.
    const invalid = selected ? validateAudioFile(selected) : null;
    this.fileError.set(invalid ?? '');
    this.file.set(invalid ? null : selected);
    console.debug('[TracksPage] Fichier sélectionné', selected?.name, invalid ? '(refusé)' : '');
  }

  load(): void {
    this.loading.set(true);
    this.listError.set('');
    this.service.list(this.page(), PAGE_SIZE).subscribe({
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
      error: (error: unknown) => {
        console.error('[TracksPage] Chargement impossible', (error as { status?: number }).status);
        this.listError.set(apiErrorMessage(error, 'Impossible de charger vos pistes.'));
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    // Garde-fou en plus des boutons désactivés : pas de page hors bornes ni de requête pendant un chargement.
    if (page < 1 || page > this.pages() || page === this.page() || this.loading()) return;
    this.page.set(page);
    this.load();
  }

  upload(): void {
    const file = this.file();
    // Empêche une double soumission tant qu'un envoi est en cours.
    if (!file || this.uploading()) return;
    const invalid = validateAudioFile(file);
    if (invalid) {
      this.fileError.set(invalid);
      return;
    }

    this.uploadStatus.set('uploading');
    this.uploadProgress.set(0);
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.title.disable();

    this.service.upload(file, this.title.value || file.name).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // `total` est absent si le navigateur ne connaît pas la taille : on garde alors le dernier pourcentage.
          if (event.total) this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
          return;
        }
        // Les autres événements (Sent, ResponseHeader…) sont ignorés : seule la réponse finale termine l'envoi.
        if (event.type !== HttpEventType.Response || !event.body) return;

        const track = event.body;
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploadProgress.set(100);
        this.uploadStatus.set('success');
        this.uploadSuccess.set(`« ${track.title} » a bien été ajoutée.`);
        this.resetUploadForm();
        this.page.set(1);
        this.load();
      },
      error: (error: unknown) => {
        console.error('[TracksPage] Envoi impossible', (error as { status?: number }).status);
        this.uploadStatus.set('error');
        this.uploadError.set(apiErrorMessage(error, 'Envoi impossible'));
        this.title.enable();
      },
    });
  }

  private resetUploadForm(): void {
    this.title.enable();
    this.title.setValue('');
    this.file.set(null);
    this.fileError.set('');
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
    this.currentTrack.set(track);
    this.audioLoading.set(true);
    this.audioError.set('');
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        this.audioLoading.set(false);
        this.revokeAudioUrl();
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (error: unknown) => {
        const status = (error as { status?: number }).status;
        console.error('[TracksPage] Lecture impossible', status);
        this.audioLoading.set(false);
        this.revokeAudioUrl();
        this.audioError.set(audioErrorMessage(track, status));
      },
    });
  }

  /** Erreur du lecteur lui-même : fichier reçu mais illisible par le navigateur. */
  onAudioError(): void {
    const track = this.currentTrack();
    this.audioError.set(`Le navigateur ne parvient pas à lire « ${track?.title ?? 'ce morceau'} » : fichier endommagé ou format non pris en charge.`);
  }

  private revokeAudioUrl(): void {
    const url = this.audioUrl();
    if (url) URL.revokeObjectURL(url);
    this.audioUrl.set('');
  }
}

/**
 * Message d'erreur de lecture. Avec `responseType: 'blob'`, le corps d'erreur JSON de l'API
 * arrive sous forme de Blob : on se base donc sur le statut HTTP.
 */
function audioErrorMessage(track: Track, status: number | undefined): string {
  switch (status) {
    case 0:
      return 'Serveur injoignable : impossible de charger le morceau.';
    case 404:
      return `« ${track.title} » n'existe plus ou ne vous appartient pas.`;
    case 401:
      return 'Session expirée : reconnectez-vous pour écouter ce morceau.';
    default:
      return `Impossible de charger « ${track.title} ». Réessayez dans un instant.`;
  }
}
