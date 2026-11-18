use std::{
    path::{Path, PathBuf},
    str::FromStr,
    sync::Mutex,
};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::{capture, config, dialog::show_error};

const NO_GLOBAL_KEYS_MESSAGE: &str = "This desktop doesn't let apps set global shortcuts.";
const CHANGE_HINT: &str = "Pick another one from the tray menu → Change hotkey…";

/// Phím chụp đang dùng, và phiên này có đăng ký phím toàn cục được không.
struct HotkeyState {
    current: Mutex<String>,
    config_directory: PathBuf,
    /// false trên Wayland: app không được giữ phím toàn cục, người dùng tự gán
    /// `snapit --capture` trong cài đặt desktop (xem README)
    global: bool,
}

fn state(app: &AppHandle) -> tauri::State<'_, HotkeyState> {
    app.state::<HotkeyState>()
}

fn current(app: &AppHandle) -> String {
    state(app).current.lock().expect("hotkey mutex poisoned").clone()
}

pub fn parse(accelerator: &str) -> Result<Shortcut, String> {
    Shortcut::from_str(accelerator).map_err(|error| format!("\"{accelerator}\" is not a valid shortcut: {error}"))
}

/// Đăng ký phím chụp theo config. Phím không đăng ký được thì báo lỗi, không dừng app.
pub fn init(app: &AppHandle, hotkey: &str, config_directory: &Path) -> tauri::Result<()> {
    let global = !config::is_wayland(std::env::var(config::SESSION_TYPE_ENV).ok().as_deref());
    app.manage(HotkeyState { current: Mutex::new(hotkey.into()), config_directory: config_directory.into(), global });
    if !global {
        return Ok(());
    }
    app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    capture::trigger(app);
                }
            })
            .build(),
    )?;
    if let Err(message) = register(app, &current(app)) {
        show_error(app, &format!("{message}\n{CHANGE_HINT}"));
    }
    Ok(())
}

fn register(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    app.global_shortcut()
        .register(parse(accelerator)?)
        .map_err(|error| format!("Could not register hotkey \"{accelerator}\": {error}"))
}

/// Trong lúc cửa sổ cài đặt ghi phím mới, phím cũ không được kích hoạt chụp.
pub fn pause(app: &AppHandle) {
    if state(app).global {
        let _ = app.global_shortcut().unregister_all();
    }
}

/// Đăng ký lại phím hiện tại sau khi đóng cửa sổ cài đặt (dù có lưu hay không).
pub fn resume(app: &AppHandle) {
    if !state(app).global {
        return;
    }
    let accelerator = current(app);
    if !app.global_shortcut().is_registered(accelerator.as_str()) {
        if let Err(message) = register(app, &accelerator) {
            show_error(app, &message);
        }
    }
}

#[derive(Serialize)]
pub struct HotkeyInfo {
    hotkey: String,
    /// false trên Wayland: trang hướng dẫn gán phím trong cài đặt desktop
    global: bool,
}

#[tauri::command]
pub fn hotkey_info(app: AppHandle) -> HotkeyInfo {
    HotkeyInfo { hotkey: current(&app), global: state(&app).global }
}

/// Đăng ký phím mới ngay (phím cũ đang tạm tắt khi cửa sổ cài đặt mở) rồi lưu vào config.
#[tauri::command]
pub fn set_hotkey(app: AppHandle, hotkey: String) -> Result<(), String> {
    let hotkey_state = state(&app);
    if !hotkey_state.global {
        return Err(NO_GLOBAL_KEYS_MESSAGE.into());
    }
    app.global_shortcut()
        .register(parse(&hotkey)?)
        .map_err(|error| format!("This shortcut is taken by another app or the system ({error}). Try another one."))?;
    *hotkey_state.current.lock().expect("hotkey mutex poisoned") = hotkey.clone();
    let directory = &hotkey_state.config_directory;
    config::save(directory, &config::with_hotkey(config::load(directory), &hotkey))
        .map_err(|error| format!("The new hotkey works now but couldn't be saved: {error}"))
}
