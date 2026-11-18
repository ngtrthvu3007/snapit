//! Snapit: tray app → hotkey → frozen-screen overlays → copy/save. This file only wires the pieces together.

mod autostart;
mod capture;
mod config;
mod dialog;
mod hotkey;
mod output;
mod overlay;
mod tray;

use capture::{CaptureGuard, Shots};
use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

/// `snapit --capture` starts a capture (in the already-running instance, if any).
const CAPTURE_FLAG: &str = "--capture";

fn wants_capture<S: AsRef<str>>(args: &[S]) -> bool {
    args.iter().any(|a| a.as_ref() == CAPTURE_FLAG)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // must be first: a second launch forwards its arguments here and exits
        .plugin(tauri_plugin_single_instance::init(|app, argv, _| {
            if wants_capture(&argv) {
                capture::trigger(app);
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .manage(Shots::default())
        .manage(CaptureGuard::default())
        .register_uri_scheme_protocol(overlay::SHOT_SCHEME, |ctx, req| overlay::serve_shot(ctx.app_handle(), &req))
        .on_window_event(|window, event| {
            if let WindowEvent::Destroyed = event {
                overlay::on_window_destroyed(window.app_handle(), window.label());
            }
        })
        .invoke_handler(tauri::generate_handler![overlay::close_overlays, output::copy_png, output::save_png])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory); // tray only, no Dock icon

            let cfg_dir = app.path().app_config_dir()?;
            let cfg = match config::load(&cfg_dir) {
                Ok(cfg) => {
                    autostart::init(app.handle(), &cfg_dir, cfg.clone());
                    cfg
                }
                // keep the user's file (and their autostart choice) untouched until they fix it
                Err(e) => {
                    dialog::show_error(app.handle(), &format!("Ignoring broken settings, using defaults.\n{e}"));
                    config::Config::default()
                }
            };
            tray::build(app.handle())?;
            hotkey::register(app.handle(), &cfg.hotkey, &cfg_dir)?;

            if wants_capture(&std::env::args().collect::<Vec<_>>()) {
                capture::trigger(app.handle());
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_, e| {
            // keep running in the tray when the last overlay window closes
            if let RunEvent::ExitRequested { code: None, api, .. } = e {
                api.prevent_exit();
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capture_flag_detected() {
        assert!(wants_capture(&["snapit", "--capture"]));
        assert!(!wants_capture(&["snapit"]));
    }
}
