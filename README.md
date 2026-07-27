<div align="center">

# ⚽ Soccer

### Todo tu torneo. Un solo lugar.

Plataforma web y de escritorio para organizar competiciones de fútbol, administrar equipos y convertir cada partido en estadísticas claras.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2.11-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![SQLite](https://img.shields.io/badge/SQLite-local-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Torneos · Calendario · Equipos · Resultados · Estadísticas · Noticias · Galería**

</div>

---

## ✨ ¿Qué puedes hacer?

| Área | Funcionalidades |
| :--- | :--- |
| 🏆 **Torneos** | Crear y administrar competiciones, formatos y detalles del torneo. |
| 👕 **Equipos y jugadores** | Registrar planteles, escudos, jugadores, dorsales, posiciones, formaciones y transferencias. |
| 🗓️ **Partidos** | Programar encuentros, asignar cancha y árbitro, y consultar el calendario. |
| 🥅 **Resultados** | Registrar marcador, goles, asistencias, tarjetas e incidencias de cada partido. |
| 📊 **Estadísticas** | Tabla de posiciones, goleadores, asistentes, fair play, porteros, mejor ataque y mejor defensa. |
| 🏟️ **Organización** | Gestionar organizaciones, escenarios deportivos y cuerpo arbitral. |
| 📰 **Contenido** | Publicar noticias y crear galerías de fotos y videos. |
| 🔐 **Acceso** | Autenticación con JWT, sesiones seguras y permisos según el rol del usuario. |

## 👥 Roles

```text
Superadministrador
└── Control total de la plataforma
    ├── Organizador
    │   └── Organizaciones, torneos, partidos, árbitros y canchas
    ├── Administrador de equipo
    │   └── Equipo, plantilla y alineaciones
    └── Aficionado
        └── Consulta de torneos, calendario, equipos y estadísticas
```

## 🧰 Tecnologías

- **Interfaz:** Next.js 16, React 19 y Tailwind CSS 4.
- **Backend:** Route Handlers de Next.js.
- **Datos:** SQLite con `better-sqlite3`.
- **Seguridad:** JWT, cookies HTTP-only y contraseñas cifradas con bcrypt.
- **Escritorio:** Tauri 2 con servidor Next.js standalone como sidecar.
- **Iconografía:** Lucide React.

## 🚀 Inicio rápido

### Requisitos

- [Node.js](https://nodejs.org/) 20 o superior.
- npm (incluido con Node.js).
- Para la versión de escritorio: [Rust](https://rustup.rs/) y los [requisitos de Tauri para Windows](https://tauri.app/start/prerequisites/).

### 1. Instala el proyecto

```bash
git clone <url-del-repositorio>
cd soccer
npm install
```

### 2. Configura el entorno

Copia `.env.example` como `.env` y define, como mínimo, un secreto robusto:

```env
JWT_SECRET=pon_aqui_un_secreto_largo_y_aleatorio
SEED_ADMIN_PASSWORD=cambia_la_clave_inicial
DB_VERBOSE=false
```

> [!IMPORTANT]
> `JWT_SECRET` es obligatorio en producción. `SEED_ADMIN_PASSWORD` solo se usa al inicializar una base de datos vacía.

Puedes generar un secreto desde la terminal con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Ejecuta en desarrollo

```bash
npm run dev
```

La base de datos se inicializa automáticamente antes de arrancar. Abre **http://localhost:3000**.

## 🖥️ Aplicación de escritorio

Ejecuta la aplicación con recarga durante el desarrollo:

```bash
npm run tauri:dev
```

Genera el instalador NSIS para Windows:

```bash
npm run tauri:build
```

El proceso compila Next.js, prepara los recursos y copia automáticamente el ejecutable de Node como sidecar. En la aplicación instalada, la base de datos y los archivos subidos se conservan en la carpeta de datos del usuario.

## 📜 Comandos disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicializa la base de datos y levanta el servidor de desarrollo. |
| `npm run build` | Genera la compilación optimizada de Next.js. |
| `npm start` | Ejecuta la compilación web de producción. |
| `npm run lint` | Analiza el código con ESLint. |
| `npm run db:init` | Inicializa o actualiza la base de datos SQLite. |
| `npm run tauri:dev` | Abre la aplicación de escritorio en modo desarrollo. |
| `npm run tauri:build` | Crea el instalador de escritorio para Windows. |

## 🗂️ Estructura del proyecto

```text
soccer/
├── database/          # Esquema, migraciones e inicialización de SQLite
├── public/            # Recursos estáticos y cargas en desarrollo
├── scripts/           # Preparación de la compilación para Tauri
├── src/
│   ├── app/           # Páginas y endpoints de la aplicación
│   ├── components/    # Componentes visuales reutilizables
│   ├── context/       # Estado global de autenticación
│   └── lib/           # Datos, permisos, estadísticas y almacenamiento
└── src-tauri/         # Configuración y código nativo de escritorio
```

## 🔒 Notas de seguridad

- No subas tu archivo `.env` ni secretos reales al repositorio.
- Cambia la contraseña inicial del administrador antes de desplegar.
- Las cargas locales de desarrollo viven en `public/uploads`; la edición de escritorio usa el directorio de datos del usuario.
- La recuperación y verificación de correo están simuladas en consola durante el desarrollo.

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/mi-mejora`.
2. Implementa y valida el cambio con `npm run lint` y `npm run build`.
3. Crea un commit descriptivo y abre un pull request.

---

<div align="center">

Hecho con pasión por el fútbol ⚽

</div>
