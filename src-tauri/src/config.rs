use std::{
    io,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

const FILE_NAME: &str = "config.json";
/// Biến môi trường do phiên desktop đặt: "wayland" hoặc "x11".
pub const SESSION_TYPE_ENV: &str = "XDG_SESSION_TYPE";
const WAYLAND: &str = "wayland";
const MACOS_DEFAULT_HOTKEY: &str = "CommandOrControl+Shift+2";
const LINUX_DEFAULT_HOTKEY: &str = "PrintScreen";

/// `<thư mục config của app>/config.json`. Trường thiếu sẽ lấy giá trị mặc định.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(default)]
pub struct Config {
    pub hotkey: String,
    pub autostart_initialized: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            hotkey: default_hotkey().into(),
            autostart_initialized: false,
        }
    }
}

pub fn default_hotkey() -> &'static str {
    if cfg!(target_os = "macos") {
        MACOS_DEFAULT_HOTKEY
    } else {
        LINUX_DEFAULT_HOTKEY
    }
}

pub fn file_path(directory: &Path) -> PathBuf {
    directory.join(FILE_NAME)
}

/// Chưa có file → mặc định (lần chạy đầu). Đọc lỗi hoặc sai cú pháp → lỗi kèm đường dẫn,
/// để lỗi gõ khi sửa tay không bị nhầm thành lần chạy đầu.
pub fn load(directory: &Path) -> Result<Config, String> {
    let path = file_path(directory);
    let with_path =
        |error: &dyn std::fmt::Display| format!("{}: {error}", path.display());
    match std::fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text).map_err(|error| with_path(&error)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(Config::default()),
        Err(error) => Err(with_path(&error)),
    }
}

pub fn save(directory: &Path, config: &Config) -> io::Result<()> {
    std::fs::create_dir_all(directory)?;
    std::fs::write(file_path(directory), serde_json::to_string_pretty(config)?)
}

/// Config cần lưu sau khi người dùng chọn phím mới. File hỏng sẽ bị thay,
/// nhưng bản thay không được giống lần chạy đầu (sẽ bật lại autostart).
pub fn with_hotkey(loaded: Result<Config, String>, hotkey: &str) -> Config {
    let base = loaded.unwrap_or(Config {
        autostart_initialized: true,
        ..Config::default()
    });
    Config {
        hotkey: hotkey.into(),
        ..base
    }
}

pub fn is_wayland(session_type: Option<&str>) -> bool {
    session_type == Some(WAYLAND)
}
