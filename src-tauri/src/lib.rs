//! Snapit: app nằm ở tray → phím tắt → overlay màn hình đóng băng → copy/lưu.
//! File này chỉ nối các phần lại với nhau.

mod autostart;
mod capture;
mod config;
mod dialog;
mod hotkey;
mod output;
mod overlay;
mod settings;
mod tray;

#[cfg(test)]
mod tests;

use capture::{CaptureGuard, Shots};
use tauri::{AppHandle, Manager, RunEvent, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

/// `snapit --capture` bắt đầu chụp (trong instance đang chạy, nếu có).
const CAPTURE_FLAG: &str = "--capture";
const BROKEN_CONFIG_MESSAGE: &str = "Ignoring broken settings, using defaults.";

fn wants_capture<S: AsRef<str>>(arguments: &[S]) -> bool {
    arguments
        .iter()
        .any(|argument| argument.as_ref() == CAPTURE_FLAG)
}

/// Đọc config; file hỏng thì báo lỗi và dùng mặc định, không đụng tới file và autostart.
fn load_config(app: &AppHandle) -> tauri::Result<config::Config> {
    let directory = app.path().app_config_dir()?;

    let config = match config::load(&directory) {
        Ok(config) => {
            autostart::init(app, &directory, config.clone());
            config
        }
        Err(message) => {
            dialog::show_error(app, &format!("{BROKEN_CONFIG_MESSAGE}\n{message}"));
            config::Config::default()
        }
    };

    hotkey::init(app, &config.hotkey, &directory)?;

    Ok(config)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // phải đứng đầu: lần mở thứ hai chuyển tham số sang đây rồi thoát
        .plugin(tauri_plugin_single_instance::init(on_second_instance))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(Shots::default())
        .manage(CaptureGuard::default())
        .register_uri_scheme_protocol(overlay::SHOT_SCHEME, |context, request| {
            overlay::serve_shot(context.app_handle(), &request)
        })
        .on_window_event(on_window_event)
        .invoke_handler(tauri::generate_handler![
            overlay::close_overlays,
            output::copy_png,
            output::save_png,
            hotkey::hotkey_info,
            hotkey::set_hotkey
        ])
        .setup(|app| setup(app.handle()).map_err(Into::into))
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app, event| {
        // vẫn chạy ở tray khi overlay cuối cùng đóng
        if let RunEvent::ExitRequested {
            code: None, api, ..
        } = event
        {
            api.prevent_exit();
        }
    });
}

fn setup(app: &AppHandle) -> tauri::Result<()> {
    // chỉ có icon tray, không có icon Dock
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;

    load_config(app)?;
    tray::build(app)?;

    if wants_capture(&std::env::args().collect::<Vec<_>>()) {
        capture::trigger(app);
    }

    Ok(())
}

fn on_second_instance(
    app: &AppHandle,
    arguments: Vec<String>,
    _working_directory: String,
) {
    if wants_capture(&arguments) {
        capture::trigger(app);
    }
}

fn on_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::Destroyed = event {
        overlay::on_window_destroyed(window.app_handle(), window.label());
        settings::on_window_destroyed(window.app_handle(), window.label());
    }
}
