import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Target directory
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Return the public URL path
    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    return NextResponse.json({ error: 'Error interno al subir el archivo' }, { status: 500 });
  }
}
