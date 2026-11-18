mod capture;
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
    app.dialog()
        .message(msg)
        .title("Snapit")
        .kind(MessageDialogKind::Error)
        .show(|_| {});
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
        .invoke_handler(tauri::generate_handler![overlay::close_overlays])
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
