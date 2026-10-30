import { randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

interface IncomingFile {
  stream: Readable;
  filename?: string;
}
type Callback<T = void> = (error: Error | null, info?: T) => void;

// Минимальный storage-движок для multer: пишет поток в файл со случайным
// именем (исходное имя в путь не попадает вообще). Свой, а не diskStorage из
// multer, чтобы не тянуть @types/multer.
export class DiskStorage {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  _handleFile(_req: unknown, file: IncomingFile, cb: Callback<{ filename: string; size: number }>) {
    const filename = randomUUID();
    const out = createWriteStream(join(this.dir, filename));
    file.stream.pipe(out);
    out.on('error', cb);
    out.on('finish', () => cb(null, { filename, size: out.bytesWritten }));
  }

  _removeFile(_req: unknown, file: IncomingFile, cb: Callback) {
    if (!file.filename) return cb(null);
    unlink(join(this.dir, file.filename)).then(() => cb(null), (e: NodeJS.ErrnoException) => cb(e.code === 'ENOENT' ? null : e));
  }
}
