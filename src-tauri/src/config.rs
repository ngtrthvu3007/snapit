use std::{io, path::Path};

use serde::{Deserialize, Serialize};

/// `<app config dir>/config.json`, edited by hand. Missing fields fall back to defaults.
#[derive(Serialize, Deserialize, Debug)]
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
    if cfg!(target_os = "macos") { "CommandOrControl+Shift+2" } else { "PrintScreen" }
}

pub fn load(dir: &Path) -> Config {
    std::fs::read_to_string(dir.join("config.json"))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(dir: &Path, c: &Config) -> io::Result<()> {
    std::fs::create_dir_all(dir)?;
    std::fs::write(dir.join("config.json"), serde_json::to_string_pretty(c)?)
}

pub fn is_wayland(session_type: Option<&str>) -> bool {
    session_type == Some("wayland")
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
        let c = load(&d);
        assert_eq!(c.hotkey, default_hotkey());
        assert!(!c.autostart_initialized);
    }

    #[test]
    fn invalid_config_gives_default() {
        let d = tmp("invalid");
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(d.join("config.json"), "{oops").unwrap();
        assert_eq!(load(&d).hotkey, default_hotkey());
    }

    #[test]
    fn partial_config_fills_defaults() {
        let d = tmp("partial");
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(d.join("config.json"), r#"{"hotkey":"F1"}"#).unwrap();
        let c = load(&d);
        assert_eq!(c.hotkey, "F1");
        assert!(!c.autostart_initialized);
    }

    #[test]
    fn roundtrip_creates_dir() {
        let d = tmp("roundtrip");
        save(&d, &Config { hotkey: "F1".into(), autostart_initialized: true }).unwrap();
        let c = load(&d);
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
