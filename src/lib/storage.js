import path from 'path';

// Directorio escribible para archivos subidos. Empaquetada con Tauri, la carpeta
// de instalacion es de solo lectura: el sidecar define APP_DATA_DIR apuntando a
// la carpeta de datos del usuario. En desarrollo se usa public/uploads, que Next
// sirve como archivo estatico.
export function getUploadsDir() {
  if (process.env.APP_DATA_DIR) {
    return path.resolve(process.env.APP_DATA_DIR, 'uploads');
  }
  return path.resolve(process.cwd(), 'public/uploads');
}