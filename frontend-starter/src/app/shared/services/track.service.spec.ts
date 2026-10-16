import { TestBed } from '@angular/core/testing';
import { HttpEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Track } from '../models/track.model';
import { TrackService } from './track.service';

const TRACK: Track = {
  id: 't1',
  title: 'Blues en la',
  originalName: 'blues.mp3',
  mimeType: 'audio/mpeg',
  size: 2048,
  createdAt: '2026-10-08T08:00:00.000Z',
};

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });

  // Échoue si une requête inattendue est partie pendant le test.
  afterEach(() => http.verify());

  it('list() transmet page et limit en paramètres de requête', () => {
    let pages = 0;
    service.list(3, 10).subscribe((response) => (pages = response.pages));

    const request = http.expectOne((r) => r.url === '/api/tracks');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.urlWithParams).toBe('/api/tracks?page=3&limit=10');

    request.flush({ items: [TRACK], page: 3, limit: 10, total: 21, pages: 3 });
    expect(pages).toBe(3);
  });

  it('list() utilise page=1 et limit=5 par défaut', () => {
    service.list().subscribe();

    const request = http.expectOne('/api/tracks?page=1&limit=5');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, limit: 5, total: 0, pages: 1 });
  });

  it('delete() envoie DELETE /api/tracks/:id', () => {
    let done = false;
    service.delete('t1').subscribe(() => (done = true));

    const request = http.expectOne('/api/tracks/t1');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();

    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });

  it('upload() envoie un multipart audio + title et émet les événements de progression', () => {
    const file = new File(['abcd'], 'blues.mp3', { type: 'audio/mpeg' });
    const events: HttpEvent<Track>[] = [];
    service.upload(file, 'Blues en la').subscribe((event) => events.push(event));

    const request = http.expectOne('/api/tracks');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBe(true);

    const body = request.request.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect([...body.keys()]).toEqual(['audio', 'title']);
    expect((body.get('audio') as File).name).toBe('blues.mp3');
    expect(body.get('title')).toBe('Blues en la');

    request.event({ type: HttpEventType.UploadProgress, loaded: 2, total: 4 });
    request.flush(TRACK, { status: 201, statusText: 'Created' });

    const types = events.map((event) => event.type);
    expect(types).toContain(HttpEventType.UploadProgress);
    expect(types.at(-1)).toBe(HttpEventType.Response);
  });
});
