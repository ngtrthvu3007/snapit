use std::path::Path;

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::{capture, config, dialog::show_error};

/// Registers the capture hotkey. Skipped on Wayland, where apps can't grab global keys:
/// users bind `snapit --capture` in their desktop settings instead (see README).
pub fn register(app: &AppHandle, hotkey: &str, cfg_dir: &Path) -> tauri::Result<()> {
    if config::is_wayland(std::env::var(config::SESSION_TYPE_ENV).ok().as_deref()) {
        return Ok(());
    }
    app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _, ev| {
                if ev.state == ShortcutState::Pressed {
                    capture::trigger(app);
                }
            })
            .build(),
    )?;
    if let Err(e) = app.global_shortcut().register(hotkey) {
        show_error(
            app,
            &format!(
                "Could not register hotkey \"{hotkey}\": {e}\nSet another \"hotkey\" in {} and restart Snapit.",
                config::file_path(cfg_dir).display()
            ),
        );
    }
    Ok(())
}
