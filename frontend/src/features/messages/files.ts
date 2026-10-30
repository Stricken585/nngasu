export const MAX_FILE_SIZE = 25 * 1024 * 1024
export const MAX_FILES = 5

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
}

// Что браузер может показать прямо в чате (синхронно с бэкендом: остальное — только скачивание).
export const kindOf = (mime: string): 'image' | 'video' | 'audio' | 'file' =>
  /^image\/(png|jpeg|gif|webp)$/.test(mime)
    ? 'image'
    : /^video\/(mp4|webm)$/.test(mime)
      ? 'video'
      : /^audio\/(mpeg|ogg|wav|webm|mp4)$/.test(mime)
        ? 'audio'
        : 'file'
