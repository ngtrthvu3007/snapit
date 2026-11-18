use std::{
    path::{Path, PathBuf},
    str::FromStr,
    sync::Mutex,
};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::{capture, config, dialog::show_error};

/// The capture hotkey currently in use, and whether this session can register global keys at all.
struct HotkeyState {
    current: Mutex<String>,
    cfg_dir: PathBuf,
    /// false on Wayland, where apps can't grab global keys: users bind `snapit --capture`
    /// in their desktop settings instead (see README)
    global: bool,
}

pub fn parse(accelerator: &str) -> Result<Shortcut, String> {
    Shortcut::from_str(accelerator).map_err(|e| format!("\"{accelerator}\" is not a valid shortcut: {e}"))
}

/// Sets up the capture hotkey from the config. A key that can't be registered is reported, not fatal.
pub fn init(app: &AppHandle, hotkey: &str, cfg_dir: &Path) -> tauri::Result<()> {
    let global = !config::is_wayland(std::env::var(config::SESSION_TYPE_ENV).ok().as_deref());
    app.manage(HotkeyState { current: Mutex::new(hotkey.into()), cfg_dir: cfg_dir.into(), global });
    if !global {
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
    if let Err(e) = register_current(app) {
        show_error(app, &format!("{e}\nPick another one from the tray menu → Change hotkey…"));
    }
    Ok(())
}

fn state(app: &AppHandle) -> tauri::State<'_, HotkeyState> {
    app.state::<HotkeyState>()
}

fn register_current(app: &AppHandle) -> Result<(), String> {
    let current = state(app).current.lock().unwrap().clone();
    app.global_shortcut()
        .register(parse(&current)?)
        .map_err(|e| format!("Could not register hotkey \"{current}\": {e}"))
}

/// While the settings window records a new shortcut, the old one must not start a capture.
pub fn pause(app: &AppHandle) {
    if state(app).global {
        let _ = app.global_shortcut().unregister_all();
    }
}

/// Re-registers the current hotkey after the settings window closed (saved or not).
pub fn resume(app: &AppHandle) {
    if !state(app).global {
        return;
    }
    let current = state(app).current.lock().unwrap().clone();
    if !app.global_shortcut().is_registered(current.as_str()) {
        if let Err(e) = register_current(app) {
            show_error(app, &e);
        }
    }
}

#[derive(Serialize)]
pub struct HotkeyInfo {
    hotkey: String,
    /// false on Wayland: the page explains how to bind the key in the desktop settings instead
    global: bool,
}

#[tauri::command]
pub fn hotkey_info(app: AppHandle) -> HotkeyInfo {
    let s = state(&app);
    HotkeyInfo { hotkey: s.current.lock().unwrap().clone(), global: s.global }
}

/// Registers the new hotkey right away (the old one is paused while settings are open) and saves it.
#[tauri::command]
pub fn set_hotkey(app: AppHandle, hotkey: String) -> Result<(), String> {
    let s = state(&app);
    if !s.global {
        return Err(NO_GLOBAL_KEYS_MESSAGE.into());
    }
    app.global_shortcut()
        .register(parse(&hotkey)?)
        .map_err(|e| format!("This shortcut is taken by another app or the system ({e}). Try another one."))?;
    *s.current.lock().unwrap() = hotkey.clone();
    config::save(&s.cfg_dir, &config::with_hotkey(config::load(&s.cfg_dir), &hotkey))
        .map_err(|e| format!("The new hotkey works now but couldn't be saved: {e}"))
}

const NO_GLOBAL_KEYS_MESSAGE: &str = "This desktop doesn't let apps set global shortcuts.";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_accepts_recorded_accelerators() {
        assert!(parse("Command+Shift+Digit2").is_ok());
        assert!(parse("Control+Alt+KeyS").is_ok());
        assert!(parse("F12").is_ok());
        assert!(parse("PrintScreen").is_ok());
    }

    #[test]
    fn parse_rejects_garbage_with_a_readable_error() {
        let e = parse("Nope+Q").unwrap_err();
        assert!(e.contains("Nope+Q"), "{e}");
    }
}
