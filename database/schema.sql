-- Schema for Soccer Tournament Management Platform (SQLite)

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'organizador', 'admin_equipo', 'aficionado')) NOT NULL DEFAULT 'aficionado',
    email_verified INTEGER DEFAULT 0, -- 0 = false, 1 = true
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TEXT,
    active INTEGER DEFAULT 1, -- 0 = inactive, 1 = active
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Organizations (Módulo 2)
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT, -- Path to logo image
    address TEXT,
    municipality TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    active INTEGER DEFAULT 1, -- 0 = inactive, 1 = active
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Organization Admins mapping (Módulo 2)
CREATE TABLE IF NOT EXISTS organization_admins (
    organization_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (organization_id, user_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tournaments (Módulo 3)
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    category TEXT, -- e.g., Libre, Veteranos, Sub-20
    season TEXT NOT NULL, -- e.g., 2026-I, 2026-II
    start_date TEXT,
    end_date TEXT,
    status TEXT CHECK(status IN ('creado', 'inscripciones_abiertas', 'inscripciones_cerradas', 'activo', 'finalizado')) NOT NULL DEFAULT 'creado',
    regulations TEXT, -- PDF file path or text
    cover_image TEXT,
    max_teams INTEGER NOT NULL DEFAULT 20,
    scoring_system TEXT DEFAULT 'standard', -- standard = 3 win, 1 draw, 0 loss
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 4. Teams (Módulo 4)
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    shield TEXT, -- Shield image path
    neighborhood TEXT,
    city TEXT,
    founded TEXT, -- Year or date
    colors TEXT, -- e.g., Rojo y Blanco
    home_uniform TEXT, -- Description or image
    away_uniform TEXT,
    coach TEXT,
    captain TEXT,
    social_media TEXT, -- JSON string or comma-separated
    group_photo TEXT,
    admin_id INTEGER, -- User who manages this team
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Team Sponsors (Módulo 4)
CREATE TABLE IF NOT EXISTS team_sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 5. Players (Módulo 5)
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    photo TEXT,
    full_name TEXT NOT NULL,
    document_id TEXT NOT NULL,
    birth_date TEXT,
    position TEXT CHECK(position IN ('Portero', 'Defensa', 'Centrocampista', 'Delantero')),
    jersey_number INTEGER,
    height REAL, -- in meters
    weight REAL, -- in kg
    dominant_foot TEXT CHECK(dominant_foot IN ('derecho', 'izquierdo', 'ambidiestro')),
    nationality TEXT,
    status TEXT CHECK(status IN ('activo', 'inactivo')) NOT NULL DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Player Transfers History (Módulo 5)
CREATE TABLE IF NOT EXISTS player_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    from_team_id INTEGER,
    to_team_id INTEGER NOT NULL,
    transfer_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 6. Referees (Módulo 6)
CREATE TABLE IF NOT EXISTS referees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER, -- Optional, can be independent or tied to tournament
    photo TEXT,
    name TEXT NOT NULL,
    document TEXT,
    category TEXT, -- e.g., Profesional, Amateur, FIFA
    experience INTEGER, -- years of experience
    phone TEXT,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 7. Fields / Canchas (Módulo 7)
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER, -- Optional, tied to tournament or organization
    name TEXT NOT NULL,
    address TEXT,
    municipality TEXT,
    latitude REAL,
    longitude REAL,
    photo TEXT,
    capacity INTEGER,
    surface_type TEXT, -- e.g., Sintética, Césped Natural, Tierra
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 8. Matches / Partidos (Módulo 8)
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    matchday INTEGER NOT NULL, -- e.g., Jornada 1, 2, 3
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- HH:MM
    field_id INTEGER,
    referee_id INTEGER,
    status TEXT CHECK(status IN ('programado', 'en_juego', 'finalizado', 'suspendido', 'cancelado')) NOT NULL DEFAULT 'programado',
    observations TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL,
    FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE SET NULL
);

-- 9. Match Results & Stats (Módulo 9)
CREATE TABLE IF NOT EXISTS match_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER UNIQUE NOT NULL,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    extra_time INTEGER DEFAULT 0, -- 0 = no, 1 = yes
    final_status TEXT DEFAULT 'normal', -- normal, walkover, penalizaciones
    mvp_player_id INTEGER,
    referee_observations TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (mvp_player_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Match Goals Details
CREATE TABLE IF NOT EXISTS match_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL, -- Team scoring the goal (useful for own goals)
    minute INTEGER NOT NULL,
    is_own_goal INTEGER DEFAULT 0, -- 0 = false, 1 = true
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Match Assists Details
CREATE TABLE IF NOT EXISTS match_assists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Match Cards Details
CREATE TABLE IF NOT EXISTS match_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    card_type TEXT CHECK(card_type IN ('amarilla', 'roja')) NOT NULL,
    minute INTEGER NOT NULL,
    reason TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Match Substitutions
CREATE TABLE IF NOT EXISTS match_substitutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_in_id INTEGER NOT NULL,
    player_out_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_in_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (player_out_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 11. News (Módulo 11)
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER, -- Optional, news can be general
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT, -- Main image path
    document TEXT, -- Optional PDF or files attachment
    featured INTEGER DEFAULT 0, -- 0 = no, 1 = yes
    author_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Gallery Albums & Media (Módulo 12)
CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('image', 'video')) NOT NULL,
    url TEXT NOT NULL, -- File path or video embed link
    caption TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 13. Notifications (Módulo 13)
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- If NULL, notification is sent to everyone (public)
    type TEXT NOT NULL, -- e.g., match_start, match_end, schedule_change, new_post
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0, -- 0 = unread, 1 = read
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
