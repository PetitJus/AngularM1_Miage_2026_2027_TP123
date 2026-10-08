/** Formats audio acceptés par l'API, avec leur libellé lisible. */
const AUDIO_FORMATS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
};

/** Convertit un type MIME en libellé court (ex. "audio/mpeg" → "MP3"). */
export function formatAudioType(mimeType: string): string {
  return AUDIO_FORMATS[mimeType] ?? mimeType.replace('audio/', '').toUpperCase();
}

/** Convertit une taille en octets (valeur renvoyée par l'API) en o, Ko ou Mo. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}
