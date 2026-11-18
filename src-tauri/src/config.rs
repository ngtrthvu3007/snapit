use std::{
    io,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

const FILE_NAME: &str = "config.json";
/// Env var the desktop session sets to "wayland" or "x11".
pub const SESSION_TYPE_ENV: &str = "XDG_SESSION_TYPE";
const WAYLAND: &str = "wayland";
const MACOS_DEFAULT_HOTKEY: &str = "CommandOrControl+Shift+2";
const LINUX_DEFAULT_HOTKEY: &str = "PrintScreen";

/// `<app config dir>/config.json`, edited by hand. Missing fields fall back to defaults.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub hotkey: String,
    pub autostart_initialized: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self { hotkey: default_hotkey().into(), autostart_initialized: false }
    }
}

pub fn default_hotkey() -> &'static str {
    if cfg!(target_os = "macos") { MACOS_DEFAULT_HOTKEY } else { LINUX_DEFAULT_HOTKEY }
}

pub fn file_path(dir: &Path) -> PathBuf {
    dir.join(FILE_NAME)
}

/// Missing file → defaults (first launch). Unreadable or invalid → error naming the file,
/// so a typo in a hand edit isn't mistaken for a first launch.
pub fn load(dir: &Path) -> Result<Config, String> {
    let path = file_path(dir);
    match std::fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text).map_err(|e| format!("{}: {e}", path.display())),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(Config::default()),
        Err(e) => Err(format!("{}: {e}", path.display())),
    }
}

pub fn save(dir: &Path, c: &Config) -> io::Result<()> {
    std::fs::create_dir_all(dir)?;
    std::fs::write(file_path(dir), serde_json::to_string_pretty(c)?)
}

pub fn is_wayland(session_type: Option<&str>) -> bool {
    session_type == Some(WAYLAND)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn tmp(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("snapit-test-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        d
    }

    #[test]
    fn missing_config_gives_default() {
        let d = tmp("missing");
        let c = load(&d).unwrap();
        assert_eq!(c.hotkey, default_hotkey());
        assert!(!c.autostart_initialized);
    }

    #[test]
    fn invalid_config_is_an_error() {
        let d = tmp("invalid");
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(file_path(&d), "{oops").unwrap();
        // a typo must not be mistaken for "first launch" (that would overwrite the file and re-enable autostart)
        assert!(load(&d).is_err());
    }

    #[test]
    fn partial_config_fills_defaults() {
        let d = tmp("partial");
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(file_path(&d), r#"{"hotkey":"F1"}"#).unwrap();
        let c = load(&d).unwrap();
        assert_eq!(c.hotkey, "F1");
        assert!(!c.autostart_initialized);
    }

    #[test]
    fn roundtrip_creates_dir() {
        let d = tmp("roundtrip");
        save(&d, &Config { hotkey: "F1".into(), autostart_initialized: true }).unwrap();
        let c = load(&d).unwrap();
        assert_eq!(c.hotkey, "F1");
        assert!(c.autostart_initialized);
    }

    #[test]
    fn wayland_detect() {
        assert!(is_wayland(Some("wayland")));
        assert!(!is_wayland(Some("x11")));
        assert!(!is_wayland(None));
    }
}
