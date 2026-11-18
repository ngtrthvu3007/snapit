use std::path::Path;

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

use crate::{
    config::{self, Config},
    dialog::show_error,
};

pub fn is_enabled(app: &AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

/// Start at login by default, but only on the very first launch: a user who turned it off keeps it off.
pub fn init_once(app: &AppHandle, cfg_dir: &Path, mut cfg: Config) {
    if cfg.autostart_initialized {
        return;
    }
    if let Err(e) = app.autolaunch().enable() {
        eprintln!("error: enabling autostart: {e}");
    }
    cfg.autostart_initialized = true;
    if let Err(e) = config::save(cfg_dir, &cfg) {
        eprintln!("error: saving config: {e}");
    }
}

/// Flips "Start at login" and returns the resulting state.
/// Reads the real state instead of the menu's check mark, which platforms flip at different times.
pub fn toggle(app: &AppHandle) -> bool {
    let launcher = app.autolaunch();
    let result = if is_enabled(app) { launcher.disable() } else { launcher.enable() };
    if let Err(e) = result {
        show_error(app, &format!("Could not change \"Start at login\": {e}"));
    }
    is_enabled(app)
}
