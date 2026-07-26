// Prepara los artefactos que Tauri empaqueta:
//   1. Copia public/ y .next/static/ dentro de .next/standalone (el server.js
//      minimo no los copia solo, segun los docs de output: 'standalone').
//   2. Copia el node.exe del sistema a src-tauri/binaries con el sufijo del
//      target triple, que es como Tauri identifica un sidecar.
//
// Se ejecuta con `npm run tauri:prepare` (y automaticamente en beforeBuildCommand).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  console.error('No existe .next/standalone/server.js. Ejecuta primero: npm run build');
  process.exit(1);
}

// 1. Activos estaticos dentro del standalone.
fs.cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });
fs.cpSync(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
});
console.log('Activos estaticos copiados a .next/standalone');

// El esquema es un recurso de solo lectura que la app necesita en el primer
// arranque para crear la base en el directorio del usuario.
fs.mkdirSync(path.join(standalone, 'database'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'database', 'schema.sql'),
  path.join(standalone, 'database', 'schema.sql')
);

// Una base sembrada en el directorio de instalacion (de solo lectura) nunca se
// usa: la real se crea en la carpeta de datos del usuario.
fs.rmSync(path.join(standalone, 'database', 'soccer.db'), { force: true });

// 2. Node como sidecar, con el sufijo del target triple.
const triple = execFileSync('rustc', ['--print', 'host-tuple']).toString().trim();
const binaries = path.join(root, 'src-tauri', 'binaries');
fs.mkdirSync(binaries, { recursive: true });

const ext = process.platform === 'win32' ? '.exe' : '';
const dest = path.join(binaries, `node-${triple}${ext}`);
fs.copyFileSync(process.execPath, dest);
console.log(`Sidecar listo: ${path.relative(root, dest)}`);