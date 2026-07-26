import { getUploadsDir } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
};

// Sirve los archivos subidos cuando viven fuera de public/ (app empaquetada).
export async function GET(request, { params }) {
  const { file } = await params;

  // basename por segmento: impide salir del directorio con "..".
  const relative = file.map((segment) => path.basename(segment)).join('/');
  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, relative);

  if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
    return new Response('No encontrado', { status: 404 });
  }

  const contentType =
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

  return new Response(await fs.promises.readFile(filePath), {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
  });
}
