use std::path::PathBuf;

use crate::config::{
    Config, default_hotkey, file_path, is_wayland, load, save, with_hotkey,
};

/// Thư mục tạm riêng cho từng test, đã dọn sạch.
fn temporary_directory(name: &str) -> PathBuf {
    let directory =
        std::env::temp_dir().join(format!("snapit-test-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&directory);
    directory
}

fn write_config(directory: &PathBuf, text: &str) {
    std::fs::create_dir_all(directory).unwrap();
    std::fs::write(file_path(directory), text).unwrap();
}

fn config(hotkey: &str, autostart_initialized: bool) -> Config {
    Config {
        hotkey: hotkey.into(),
        autostart_initialized,
    }
}

#[test]
fn missing_config_gives_default() {
    let loaded = load(&temporary_directory("missing")).unwrap();
    assert_eq!(loaded.hotkey, default_hotkey());
    assert!(!loaded.autostart_initialized);
}

#[test]
fn invalid_config_is_an_error() {
    let directory = temporary_directory("invalid");
    write_config(&directory, "{oops");
    // lỗi gõ không được bị coi là lần chạy đầu (sẽ ghi đè file và bật lại autostart)
    assert!(load(&directory).is_err());
}

#[test]
fn partial_config_fills_defaults() {
    let directory = temporary_directory("partial");
    write_config(&directory, r#"{"hotkey":"F1"}"#);
    assert_eq!(load(&directory).unwrap(), config("F1", false));
}

#[test]
fn roundtrip_creates_directory() {
    let directory = temporary_directory("roundtrip");
    save(&directory, &config("F1", true)).unwrap();
    assert_eq!(load(&directory).unwrap(), config("F1", true));
}

#[test]
fn with_hotkey_keeps_other_settings() {
    assert_eq!(
        with_hotkey(Ok(config("F1", false)), "F2"),
        config("F2", false)
    );
}

#[test]
fn with_hotkey_on_broken_file_does_not_retrigger_first_launch() {
    // file hỏng bị thay, nhưng không được giống lần chạy đầu (sẽ bật lại autostart)
    assert_eq!(with_hotkey(Err("bad".into()), "F2"), config("F2", true));
}

#[test]
fn wayland_detect() {
    assert!(is_wayland(Some("wayland")));
    assert!(!is_wayland(Some("x11")));
    assert!(!is_wayland(None));
}
