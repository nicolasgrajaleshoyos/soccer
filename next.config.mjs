import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera .next/standalone con un server.js minimo y solo las dependencias
  // necesarias. Tauri lo ejecuta como sidecar.
  output: 'standalone',
  outputFileTracingRoot: path.resolve(),

  // better-sqlite3 es un binario nativo: se carga en runtime, no se empaqueta.
  serverExternalPackages: ['better-sqlite3'],

  async rewrites() {
    return {
      // afterFiles: en desarrollo los archivos de public/uploads se sirven
      // primero; solo si no existen se recurre a la ruta que los lee desde el
      // directorio de datos del usuario (app empaquetada).
      afterFiles: [{ source: '/uploads/:file*', destination: '/api/uploads/:file*' }],
    };
  },
};

export default nextConfig;
