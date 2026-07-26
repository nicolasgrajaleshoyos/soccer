// Independent Database Initialization Script (CommonJS)
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'soccer.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

console.log('Inicializando base de datos SQLite en:', dbPath);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect
const db = new Database(dbPath, { verbose: process.env.DB_VERBOSE === 'true' ? console.log : undefined });
db.pragma('foreign_keys = ON');

// 1. Run schema
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('Esquema de base de datos cargado exitosamente.');
} else {
  console.error('ERROR: No se encontró schema.sql en', schemaPath);
  process.exit(1);
}

// 2. Seed default users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount && userCount.count === 0) {
  console.log('Sembrando usuarios iniciales por defecto...');
  
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('WARNING: Seeding users with default password "admin123". Set SEED_ADMIN_PASSWORD for any non-local install!');
  }
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(seedPassword, salt);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, email_verified, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    insertUser.run('superadmin@soccer.com', passwordHash, 'Super Administrador', 'superadmin', 1, 1);
    insertUser.run('organizador@soccer.com', passwordHash, 'Organizador Torneo', 'organizador', 1, 1);
    insertUser.run('admin_equipo@soccer.com', passwordHash, 'Administrador Equipo', 'admin_equipo', 1, 1);
    insertUser.run('aficionado@soccer.com', passwordHash, 'Aficionado Fútbol', 'aficionado', 1, 1);
  })();
  console.log('Usuarios semilla creados exitosamente (Contraseña: admin123).');

  // Seed sample tournament data
  seedSampleData(db);
} else {
  console.log('La base de datos ya contiene usuarios. Saltando seeding.');
}

function seedSampleData(db) {
  console.log('Sembrando datos de ejemplo (Liga, Torneo, Equipos, Jugadores)...');
  
  const organizador = db.prepare("SELECT id FROM users WHERE role = 'organizador'").get();
  const adminEquipo = db.prepare("SELECT id FROM users WHERE role = 'admin_equipo'").get();

  if (!organizador) return;

  // Insert organization
  const orgResult = db.prepare(`
    INSERT INTO organizations (name, logo, address, municipality, department, phone, email, website, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Liga Amateur Metropolitana',
    '/uploads/org_logo.png',
    'Calle 10 # 5-20',
    'Medellín',
    'Antioquia',
    '555-1234',
    'contacto@ligametropolitana.com',
    'www.ligametropolitana.com',
    1
  );
  const orgId = orgResult.lastInsertRowid;

  // Assign admin
  db.prepare(`
    INSERT INTO organization_admins (organization_id, user_id)
    VALUES (?, ?)
  `).run(orgId, organizador.id);

  // Insert tournament
  const tourResult = db.prepare(`
    INSERT INTO tournaments (organization_id, name, logo, description, category, season, start_date, end_date, status, regulations, cover_image, max_teams, scoring_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orgId,
    'Copa de Campeones 2026',
    '/uploads/tournament_logo.png',
    'Torneo semestral de fútbol aficionado categoría libre.',
    'Libre',
    '2026-I',
    '2026-08-01',
    '2026-12-15',
    'inscripciones_abiertas',
    '/uploads/reglamento.pdf',
    '/uploads/tournament_cover.png',
    16,
    'standard'
  );
  const tourId = tourResult.lastInsertRowid;

  // Insert teams
  const team1Result = db.prepare(`
    INSERT INTO teams (tournament_id, name, shield, neighborhood, city, founded, colors, home_uniform, away_uniform, coach, captain, admin_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tourId,
    'F.C. Real Envigado',
    '/uploads/team1_shield.png',
    'El Dorado',
    'Envigado',
    '2018',
    'Verde y Blanco',
    'Camiseta verde, pantaloneta blanca',
    'Camiseta blanca, pantaloneta verde',
    'Carlos Restrepo',
    'Mateo Cardona',
    adminEquipo.id
  );
  const team1Id = team1Result.lastInsertRowid;

  const team2Result = db.prepare(`
    INSERT INTO teams (tournament_id, name, shield, neighborhood, city, founded, colors, home_uniform, away_uniform, coach, captain, admin_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tourId,
    'Deportivo Poblado',
    '/uploads/team2_shield.png',
    'El Poblado',
    'Medellín',
    '2020',
    'Azul y Negro',
    'Camiseta azul, pantaloneta negra',
    'Camiseta negra, pantaloneta azul',
    'Juan Carlos Osorio',
    'Daniel Muñoz',
    null
  );
  const team2Id = team2Result.lastInsertRowid;

  // Insert players
  const insertPlayer = db.prepare(`
    INSERT INTO players (team_id, photo, full_name, document_id, birth_date, position, jersey_number, height, weight, dominant_foot, nationality, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertPlayer.run(team1Id, '/uploads/player1.png', 'Mateo Cardona', '10203040', '1995-05-12', 'Delantero', 10, 1.78, 74, 'derecho', 'Colombiana', 'activo');
  insertPlayer.run(team1Id, '/uploads/player2.png', 'Santiago Arias', '10203041', '1998-09-24', 'Defensa', 7, 1.75, 70, 'izquierdo', 'Colombiana', 'activo');
  insertPlayer.run(team1Id, '/uploads/player3.png', 'David Ospina', '10203042', '1990-08-31', 'Portero', 1, 1.83, 80, 'derecho', 'Colombiana', 'activo');

  insertPlayer.run(team2Id, '/uploads/player4.png', 'Daniel Muñoz', '20304050', '1996-05-26', 'Defensa', 2, 1.80, 76, 'derecho', 'Colombiana', 'activo');
  insertPlayer.run(team2Id, '/uploads/player5.png', 'Luis Díaz', '20304051', '1997-01-13', 'Delantero', 11, 1.78, 68, 'izquierdo', 'Colombiana', 'activo');
  insertPlayer.run(team2Id, '/uploads/player6.png', 'James Rodríguez', '20304052', '1991-07-12', 'Centrocampista', 10, 1.80, 75, 'izquierdo', 'Colombiana', 'activo');

  // Insert referee
  const refResult = db.prepare(`
    INSERT INTO referees (tournament_id, photo, name, document, category, experience, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tourId, '/uploads/ref1.png', 'Wilmar Roldán', '708090', 'FIFA', 15, '555-9876', 'roldan@referee.com');
  const refId = refResult.lastInsertRowid;

  // Insert field
  const fieldResult = db.prepare(`
    INSERT INTO fields (tournament_id, name, address, municipality, latitude, longitude, photo, capacity, surface_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tourId,
    'Cancha Sintética El Dorado',
    'Transversal 34 sur # 27-10',
    'Envigado',
    6.1627,
    -75.5804,
    '/uploads/field1.png',
    1000,
    'Sintética'
  );
  const fieldId = fieldResult.lastInsertRowid;

  // Program match
  db.prepare(`
    INSERT INTO matches (tournament_id, home_team_id, away_team_id, matchday, date, time, field_id, referee_id, status, observations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tourId,
    team1Id,
    team2Id,
    1,
    '2026-08-05',
    '19:00',
    fieldId,
    refId,
    'programado',
    'Partido inaugural del torneo'
  );

  // Insert news
  db.prepare(`
    INSERT INTO news (tournament_id, title, content, image, featured, author_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    tourId,
    'Inscripciones abiertas para la Copa de Campeones 2026',
    'Ya están abiertas las inscripciones para el torneo amateur más importante del año. Los administradores de equipos pueden registrarse a través de la plataforma.',
    '/uploads/news_cup.jpg',
    1,
    organizador.id
  );

  console.log('Seeding de datos de ejemplo completado exitosamente.');
}

console.log('Base de datos inicializada de forma segura.');
process.exit(0);
