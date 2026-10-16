/** Formats audio acceptés par l'API, avec leur libellé lisible (même liste que `allowed` dans backend/src/app.js). */
const AUDIO_FORMATS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
};

/** Taille maximale acceptée par l'API (`MAX_FILE_SIZE` du backend) : 25 Mo. */
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

/** Valeur de l'attribut `accept` du sélecteur de fichier : extensions et types MIME acceptés par l'API. */
export const AUDIO_ACCEPT = ['.mp3', '.wav', '.ogg', '.m4a', ...Object.keys(AUDIO_FORMATS)].join(',');

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

/**
 * Reprend les contrôles du backend avant l'envoi : type MIME autorisé et taille maximale.
 * Renvoie un message d'erreur lisible, ou `null` si le fichier peut être envoyé.
 * Ce contrôle évite un aller-retour inutile, mais le backend reste seul juge.
 */
export function validateAudioFile(file: File): string | null {
  if (!Object.hasOwn(AUDIO_FORMATS, file.type)) {
    return `« ${file.name} » n'est pas dans un format accepté. Formats acceptés : MP3, WAV, OGG ou M4A.`;
  }
  if (file.size > MAX_AUDIO_SIZE) {
    return `« ${file.name} » fait ${formatFileSize(file.size)} : la taille maximale est de 25 Mo.`;
  }
  return null;
}
