import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Page } from '../../shared/models/page.model';
import { Track } from '../../shared/models/track.model';
import { TracksPageComponent } from './tracks-page';

const LIST_URL = '/api/tracks?page=1&limit=5';

function track(id: string, title: string): Track {
  return {
    id,
    title,
    originalName: `${title}.mp3`,
    mimeType: 'audio/mpeg',
    size: 2048,
    createdAt: '2026-10-08T08:00:00.000Z',
  };
}

function pageOf(...items: Track[]): Page<Track> {
  return { items, page: 1, limit: 5, total: items.length, pages: 1 };
}

describe('TracksPageComponent', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let component: TracksPageComponent;
  let http: HttpTestingController;
  let snackBarOpen: ReturnType<typeof vi.fn>;

  /** Texte affiché par le composant. */
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const uploadRequest = () => http.expectOne((r) => r.method === 'POST' && r.url === '/api/tracks');

  beforeEach(() => {
    snackBarOpen = vi.fn();
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Le SnackBar est remplacé par un espion : on vérifie le message, pas l'affichage Material.
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
      ],
    });
    fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);

    // Chargement initial lancé par le constructeur.
    http.expectOne(LIST_URL).flush(pageOf(track('t1', 'Blues'), track('t2', 'Funk')));
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('affiche les pistes renvoyées par GET /api/tracks', () => {
    expect(component.tracks().map((t) => t.id)).toEqual(['t1', 't2']);
    expect(text()).toContain('Blues');
    expect(text()).toContain('Funk');
  });

  describe('suppression', () => {
    it('appelle DELETE /api/tracks/:id puis recharge la liste', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.remove(component.tracks()[0]);
      expect(component.isDeleting(component.tracks()[0])).toBe(true);

      const request = http.expectOne('/api/tracks/t1');
      expect(request.request.method).toBe('DELETE');
      request.flush(null, { status: 204, statusText: 'No Content' });

      // La liste est redemandée au serveur : rien n'est retiré localement.
      http.expectOne(LIST_URL).flush(pageOf(track('t2', 'Funk')));
      fixture.detectChanges();

      expect(component.tracks().map((t) => t.id)).toEqual(['t2']);
      expect(component.deletingIds().size).toBe(0);
      expect(text()).not.toContain('Blues');
      expect(snackBarOpen).toHaveBeenCalledOnce();
      expect(snackBarOpen.mock.calls[0][0]).toBe('« Blues » a été supprimée.');
    });

    it('n’envoie aucune requête si l’utilisateur annule la confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.remove(component.tracks()[0]);

      http.expectNone('/api/tracks/t1');
      expect(snackBarOpen).not.toHaveBeenCalled();
    });

    it('n’envoie qu’un seul DELETE en cas de double clic', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const first = component.tracks()[0];

      component.remove(first);
      component.remove(first);

      // expectOne échoue s'il y a deux requêtes.
      http.expectOne('/api/tracks/t1').flush(null, { status: 204, statusText: 'No Content' });
      http.expectOne(LIST_URL).flush(pageOf(track('t2', 'Funk')));
    });

    it('sur un 404, affiche un message d’erreur et recharge la liste', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.remove(component.tracks()[0]);
      http
        .expectOne('/api/tracks/t1')
        .flush({ message: 'Piste inconnue' }, { status: 404, statusText: 'Not Found' });
      http.expectOne(LIST_URL).flush(pageOf(track('t2', 'Funk')));

      expect(snackBarOpen.mock.calls[0][0]).toContain('n\'existe plus ou ne vous appartient pas');
      expect(component.tracks().map((t) => t.id)).toEqual(['t2']);
    });
  });

  describe('upload', () => {
    const file = new File(['abcd'], 'solo.mp3', { type: 'audio/mpeg' });

    it('est à l’état idle tant qu’aucun envoi n’est lancé', () => {
      expect(component.uploadStatus()).toBe('idle');
      expect(component.uploadProgress()).toBe(0);
      expect((fixture.nativeElement as HTMLElement).querySelector('progress')).toBeNull();
    });

    it('met à jour le pourcentage à partir des événements de progression', () => {
      component.file.set(file);
      component.upload();
      const request = uploadRequest();
      expect(component.uploadStatus()).toBe('uploading');

      request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 200 });
      fixture.detectChanges();
      expect(component.uploadProgress()).toBe(25);
      expect(text()).toContain('25 %');
      const bar = (fixture.nativeElement as HTMLElement).querySelector('progress');
      expect(bar?.value).toBe(25);

      request.event({ type: HttpEventType.UploadProgress, loaded: 150, total: 200 });
      expect(component.uploadProgress()).toBe(75);
      expect(component.uploadStatus()).toBe('uploading');

      request.flush(track('t3', 'Solo'), { status: 201, statusText: 'Created' });
      http.expectOne(LIST_URL).flush(pageOf(track('t3', 'Solo')));
      fixture.detectChanges();

      expect(component.uploadStatus()).toBe('success');
      expect(component.uploadProgress()).toBe(100);
      expect(component.file()).toBeNull();
      expect(text()).toContain('« Solo » a bien été ajoutée.');
    });

    it('ignore une seconde soumission pendant l’envoi', () => {
      component.file.set(file);
      component.upload();
      component.upload();

      uploadRequest().flush(track('t3', 'Solo'), { status: 201, statusText: 'Created' });
      http.expectOne(LIST_URL).flush(pageOf(track('t3', 'Solo')));
    });

    it('passe à l’état error et affiche le message du serveur après un échec HTTP', () => {
      component.file.set(file);
      component.upload();
      const request = uploadRequest();
      request.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 200 });

      request.flush({ message: 'Format audio non accepté' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(component.uploadStatus()).toBe('error');
      expect(component.uploading()).toBe(false);
      expect(component.uploadError()).toBe('Format audio non accepté');
      const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Format audio non accepté');
      // Le fichier reste sélectionné pour permettre un nouvel essai, et rien n'est rechargé.
      expect(component.file()).toBe(file);
      expect(component.title.enabled).toBe(true);
    });
  });

  describe('liste paginée (TP2)', () => {
    it('affiche une erreur compréhensible quand GET /api/tracks échoue', () => {
      component.load();
      http.expectOne(LIST_URL).flush({ message: 'Erreur interne' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.listError()).toBe('Erreur interne');
      expect(component.loading()).toBe(false);
      const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Erreur interne');
    });

    it('demande la page suivante au serveur avec page et limit', () => {
      component.load();
      http.expectOne(LIST_URL).flush({ ...pageOf(track('t1', 'Blues')), pages: 3, total: 11 });

      component.go(2);
      const request = http.expectOne((r) => r.url === '/api/tracks');
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('limit')).toBe('5');
      request.flush({ ...pageOf(track('t6', 'Jazz')), page: 2, pages: 3, total: 11 });

      expect(component.page()).toBe(2);
      expect(component.tracks().map((t) => t.id)).toEqual(['t6']);
    });

    it('n’envoie aucune requête pour une page hors bornes', () => {
      component.go(0);
      component.go(2); // pages = 1 dans le chargement initial
      http.expectNone((r) => r.url === '/api/tracks');
      expect(component.page()).toBe(1);
    });
  });

  describe('validation avant l’envoi (TP2)', () => {
    const select = (file: File) => component.choose({ target: { files: [file] } } as unknown as Event);

    it('refuse un fichier qui n’est pas dans un format accepté, sans appel HTTP', () => {
      select(new File(['texte'], 'notes.txt', { type: 'text/plain' }));
      component.upload();
      fixture.detectChanges();

      expect(component.file()).toBeNull();
      expect(component.fileError()).toContain('Formats acceptés : MP3, WAV, OGG ou M4A');
      expect(text()).toContain('notes.txt');
      http.expectNone((r) => r.method === 'POST');
    });

    it('refuse un fichier de plus de 25 Mo, sans appel HTTP', () => {
      const big = new File(['x'], 'live.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(big, 'size', { value: 25 * 1024 * 1024 + 1 });
      select(big);
      component.upload();

      expect(component.file()).toBeNull();
      expect(component.fileError()).toContain('la taille maximale est de 25 Mo');
      http.expectNone((r) => r.method === 'POST');
    });

    it('accepte un MP3 valide et efface l’erreur précédente', () => {
      select(new File(['texte'], 'notes.txt', { type: 'text/plain' }));
      const ok = new File(['abcd'], 'solo.mp3', { type: 'audio/mpeg' });
      select(ok);

      expect(component.fileError()).toBe('');
      expect(component.file()).toBe(ok);
    });
  });

  describe('lecture audio (TP2)', () => {
    beforeEach(() => {
      // jsdom ne fournit pas les ObjectURL : on les simule pour vérifier création et révocation.
      URL.createObjectURL = vi.fn(() => 'blob:http://localhost/audio-1');
      URL.revokeObjectURL = vi.fn();
    });

    it('télécharge le Blob avec le JWT, affiche le morceau en cours et crée une ObjectURL', () => {
      component.play(component.tracks()[0]);
      fixture.detectChanges();
      expect(text()).toContain('Chargement de « Blues »');

      const request = http.expectOne('/api/tracks/t1/audio');
      expect(request.request.responseType).toBe('blob');
      request.flush(new Blob(['son'], { type: 'audio/mpeg' }));
      fixture.detectChanges();

      expect(component.currentTrack()?.id).toBe('t1');
      expect(component.audioUrl()).toBe('blob:http://localhost/audio-1');
      expect(text()).toContain('En cours de lecture');
      expect((fixture.nativeElement as HTMLElement).querySelector('audio')).not.toBeNull();
    });

    it('révoque l’ancienne ObjectURL quand on lance un autre morceau', () => {
      component.play(component.tracks()[0]);
      http.expectOne('/api/tracks/t1/audio').flush(new Blob(['a']));
      component.play(component.tracks()[1]);
      http.expectOne('/api/tracks/t2/audio').flush(new Blob(['b']));

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/audio-1');
      expect(component.currentTrack()?.id).toBe('t2');
    });

    it('affiche une erreur audio compréhensible si la piste n’existe plus (404)', () => {
      component.play(component.tracks()[0]);
      http
        .expectOne('/api/tracks/t1/audio')
        .flush(new Blob(['{"message":"Piste inconnue"}']), { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(component.audioError()).toBe('« Blues » n\'existe plus ou ne vous appartient pas.');
      expect(component.audioUrl()).toBe('');
      expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Blues');
    });

    it('révoque la dernière ObjectURL à la destruction du composant', () => {
      component.play(component.tracks()[0]);
      http.expectOne('/api/tracks/t1/audio').flush(new Blob(['a']));

      fixture.destroy();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/audio-1');
    });
  });
});
