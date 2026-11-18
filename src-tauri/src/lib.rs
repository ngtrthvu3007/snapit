mod capture;
mod config;
mod output;
mod overlay;

use std::time::Instant;

use capture::{CaptureGuard, Shots};
use tauri::{
    AppHandle, Manager, RunEvent,
    http::Response,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub fn trigger_capture(app: &AppHandle) {
    if !app.state::<CaptureGuard>().try_begin() {
        return;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        let t = Instant::now();
        match capture::capture_all() {
            Ok(shots) => {
                eprintln!("captured {} monitor(s) in {:?}", shots.len(), t.elapsed());
                *app.state::<Shots>().0.lock().unwrap() = shots;
                let a = app.clone();
                let _ = app.run_on_main_thread(move || {
                    if let Err(e) = overlay::open_overlays(&a) {
                        overlay::close_overlays(a.clone());
                        show_error(&a, &e.to_string());
                    }
                });
            }
            Err(e) => {
                app.state::<CaptureGuard>().end();
                show_error(&app, &e);
            }
        }
    });
}

pub fn show_error(app: &AppHandle, msg: &str) {
    eprintln!("error: {msg}");
    app.dialog()
        .message(msg)
        .title("Snapit")
        .kind(MessageDialogKind::Error)
        .show(|_| {});
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // must be first: a second `snapit --capture` forwards to the running instance and exits
        .plugin(tauri_plugin_single_instance::init(|app, argv, _| {
            if argv.iter().any(|a| a == "--capture") {
                trigger_capture(app);
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(Shots::default())
        .manage(CaptureGuard::default())
        // shot://localhost/<monitor index> → frozen PNG for that overlay
        .register_uri_scheme_protocol("shot", |ctx, req| {
            let idx: usize = req.uri().path().trim_start_matches('/').parse().unwrap_or(usize::MAX);
            let shots = ctx.app_handle().state::<Shots>();
            let shots = shots.0.lock().unwrap();
            let res = Response::builder().header("Access-Control-Allow-Origin", "*");
            match shots.get(idx) {
                Some(s) => res.header("Content-Type", "image/png").body(s.png.clone()),
                None => res.status(404).body(Vec::new()),
            }
            .unwrap()
        })
        .invoke_handler(tauri::generate_handler![overlay::close_overlays, output::copy_png, output::save_png])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let capture = MenuItem::with_id(app, "capture", "Capture", true, None::<&str>)?;
            let autostart =
                CheckMenuItem::with_id(app, "autostart", "Start at login", true, false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&capture, &autostart, &quit])?;

            TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "capture" => trigger_capture(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            let cfg_dir = app.path().app_config_dir()?;
            let cfg = config::load(&cfg_dir);
            // Wayland apps can't grab global keys; users bind `snapit --capture` in their desktop settings
            if !config::is_wayland(std::env::var("XDG_SESSION_TYPE").ok().as_deref()) {
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(|app, _, ev| {
                            if ev.state == ShortcutState::Pressed {
                                trigger_capture(app);
                            }
                        })
                        .build(),
                )?;
                if let Err(e) = app.global_shortcut().register(cfg.hotkey.as_str()) {
                    show_error(
                        app.handle(),
                        &format!(
                            "Could not register hotkey \"{}\": {e}\nSet another \"hotkey\" in {} and restart Snapit.",
                            cfg.hotkey,
                            cfg_dir.join("config.json").display()
                        ),
                    );
                }
            }
            if std::env::args().any(|a| a == "--capture") {
                trigger_capture(app.handle());
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_, e| {
            // keep running in tray when the last overlay window closes
            if let RunEvent::ExitRequested { code: None, api, .. } = e {
                api.prevent_exit();
            }
        });
}
