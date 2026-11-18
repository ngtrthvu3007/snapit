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

/// Mặc định bật khởi động cùng máy, nhưng chỉ ở lần chạy đầu: ai đã tắt thì giữ nguyên.
/// Nếu đang bật thì đăng ký lại để login item theo app khi app bị di chuyển (vd lần đầu chạy từ DMG).
/// Bản dev không bao giờ đụng tới login item.
pub fn init(app: &AppHandle, config_directory: &Path, config: Config) {
    if cfg!(debug_assertions) {
        return;
    }
    if config.autostart_initialized {
        if is_enabled(app) {
            let _ = app.autolaunch().enable();
        }
        return;
    }
    if let Err(error) = app.autolaunch().enable() {
        eprintln!("error: enabling autostart: {error}");
    }
    let initialized = Config { autostart_initialized: true, ..config };
    if let Err(error) = config::save(config_directory, &initialized) {
        eprintln!("error: saving config: {error}");
    }
}

/// Đảo trạng thái "Start at login", trả về trạng thái mới.
/// Đọc trạng thái thật thay vì dấu check trên menu (mỗi nền tảng đổi dấu vào lúc khác nhau).
pub fn toggle(app: &AppHandle) -> bool {
    let launcher = app.autolaunch();
    let result = if is_enabled(app) { launcher.disable() } else { launcher.enable() };
    if let Err(error) = result {
        show_error(app, &format!("Could not change \"Start at login\": {error}"));
    }
    is_enabled(app)
}
