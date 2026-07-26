use std::sync::Mutex;
use std::time::Duration;

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

/// Puerto del servidor Next embebido. Alto y fijo para no chocar con el 3000 de
/// desarrollo.
const PORT: u16 = 34117;

/// Guarda el proceso del servidor para poder matarlo al cerrar la app y no
/// dejar un node.exe huerfano corriendo en segundo plano.
struct Server(Mutex<Option<CommandChild>>);

/// Espera a que el puerto acepte conexiones. La WebView no debe cargar la URL
/// antes de que Next termine de arrancar, o muestra una pagina de error.
fn wait_until_ready() -> bool {
    let address = format!("127.0.0.1:{PORT}");
    for _ in 0..200 {
        if std::net::TcpStream::connect(&address).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(150));
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            let window = app
                .get_webview_window("main")
                .expect("la ventana 'main' esta definida en tauri.conf.json");

            // En desarrollo la ventana ya apunta a `npm run dev` (devUrl): no
            // hay servidor empaquetado que levantar.
            if cfg!(debug_assertions) {
                let _ = window.show();
                return Ok(());
            }

            let resources = app.path().resource_dir()?.join("server");

            // La carpeta de instalacion es de solo lectura: la base de datos y
            // los archivos subidos van a la carpeta de datos del usuario.
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            let (mut rx, child) = app
                .shell()
                .sidecar("node")?
                .args([resources.join("server.js").to_string_lossy().as_ref()])
                .current_dir(resources)
                .env("PORT", PORT.to_string())
                // Solo loopback: el servidor es interno de la app y no debe
                // quedar expuesto en la red local.
                .env("HOSTNAME", "127.0.0.1")
                .env("NODE_ENV", "production")
                .env("APP_DATA_DIR", data_dir.to_string_lossy().to_string())
                .spawn()?;

            app.manage(Server(Mutex::new(Some(child))));

            // Reenvia la salida del servidor al log de Tauri para poder
            // diagnosticar fallos en una app ya empaquetada.
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(bytes) => {
                            log::info!("[server] {}", String::from_utf8_lossy(&bytes).trim());
                        }
                        CommandEvent::Stderr(bytes) => {
                            log::error!("[server] {}", String::from_utf8_lossy(&bytes).trim());
                        }
                        _ => {}
                    }
                }
            });

            std::thread::spawn(move || {
                if !wait_until_ready() {
                    log::error!("El servidor embebido no respondio a tiempo");
                    return;
                }

                let url = format!("http://127.0.0.1:{PORT}/");
                match url.parse() {
                    Ok(url) => {
                        if let Err(error) = window.navigate(url) {
                            log::error!("No se pudo cargar la app: {error}");
                        }
                        let _ = window.show();
                    }
                    Err(error) => log::error!("URL del servidor invalida: {error}"),
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = event {
                if let Some(state) = app.try_state::<Server>() {
                    if let Some(child) = state.0.lock().expect("mutex del servidor").take() {
                        let _ = child.kill();
                    }
                }
            }
        });
}
