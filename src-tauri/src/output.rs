use std::path::PathBuf;

use chrono::{Datelike, Local, Timelike};
use tauri::{
    AppHandle, Manager,
    image::Image,
    ipc::{InvokeBody, Request},
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;

use crate::overlay::{close_overlays, hide_overlays, show_overlays};

const PNG_FILTER_NAME: &str = "PNG";
const PNG_EXTENSION: &str = "png";
const BAD_BODY_MESSAGE: &str = "expected PNG bytes";

pub fn default_filename(y: i32, mo: u8, d: u8, h: u8, mi: u8, s: u8) -> String {
    format!("Snapit_{y:04}-{mo:02}-{d:02}_{h:02}-{mi:02}-{s:02}.png")
}

/// The PNG sent by the page: a raw body normally, a JSON byte array if Tauri fell back to postMessage IPC.
fn png_body(body: &InvokeBody) -> Result<Vec<u8>, String> {
    match body {
        InvokeBody::Raw(bytes) => Ok(bytes.clone()),
        InvokeBody::Json(value) => serde_json::from_value(value.clone()).map_err(|_| BAD_BODY_MESSAGE.into()),
    }
}

/// The GTK save dialog doesn't add the extension; "foo" must still become "foo.png".
fn with_png_extension(path: PathBuf) -> PathBuf {
    let has_png = path.extension().is_some_and(|e| e.eq_ignore_ascii_case(PNG_EXTENSION));
    if has_png {
        return path;
    }
    let mut name = path.into_os_string();
    name.push(".");
    name.push(PNG_EXTENSION);
    name.into()
}

fn now_filename() -> String {
    let now = Local::now();
    default_filename(
        now.year(),
        now.month() as u8,
        now.day() as u8,
        now.hour() as u8,
        now.minute() as u8,
        now.second() as u8,
    )
}

/// Copies the PNG to the clipboard and closes the overlays. On failure the overlays stay open and
/// the page shows the error (a native dialog would be hidden behind them).
/// async → runs off the main thread.
#[tauri::command]
pub async fn copy_png(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let png = png_body(request.body())?;
    let img = image::load_from_memory(&png).map_err(|e| e.to_string())?.into_rgba8();
    let (w, h) = img.dimensions();
    app.clipboard()
        .write_image(&Image::new_owned(img.into_raw(), w, h))
        .map_err(|e| format!("Copy failed: {e}"))?;
    close_overlays(app);
    Ok(())
}

/// Hides the overlays (they'd cover the dialog), asks where to save, writes the file.
/// Success closes the overlays; cancel or failure brings them back with the work intact.
/// Returns false when the user cancels.
#[tauri::command]
pub async fn save_png(app: AppHandle, request: Request<'_>) -> Result<bool, String> {
    let png = png_body(request.body())?;
    hide_overlays(&app);
    let result = ask_and_write(&app, &png);
    match result {
        Ok(true) => close_overlays(app),
        _ => show_overlays(&app),
    }
    result
}

fn ask_and_write(app: &AppHandle, png: &[u8]) -> Result<bool, String> {
    let mut dialog = app.dialog().file().set_file_name(now_filename()).add_filter(PNG_FILTER_NAME, &[PNG_EXTENSION]);
    if let Ok(dir) = app.path().picture_dir() {
        dialog = dialog.set_directory(dir);
    }
    let Some(picked) = dialog.blocking_save_file() else { return Ok(false) };
    let path = with_png_extension(picked.into_path().map_err(|e| e.to_string())?);
    std::fs::write(&path, png).map_err(|e| format!("Could not save {}: {e}", path.display()))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filename_format() {
        assert_eq!(default_filename(2026, 11, 18, 9, 5, 7), "Snapit_2026-11-18_09-05-07.png");
    }

    #[test]
    fn png_extension_added_when_missing() {
        use std::path::PathBuf;
        assert_eq!(with_png_extension(PathBuf::from("/tmp/foo")), PathBuf::from("/tmp/foo.png"));
        assert_eq!(with_png_extension(PathBuf::from("/tmp/foo.png")), PathBuf::from("/tmp/foo.png"));
        assert_eq!(with_png_extension(PathBuf::from("/tmp/foo.PNG")), PathBuf::from("/tmp/foo.PNG"));
        assert_eq!(with_png_extension(PathBuf::from("/tmp/v1.2")), PathBuf::from("/tmp/v1.2.png"));
    }

    #[test]
    fn png_body_accepts_raw_and_json_array() {
        assert_eq!(png_body(&InvokeBody::Raw(vec![1, 2, 3])).unwrap(), vec![1, 2, 3]);
        assert_eq!(png_body(&InvokeBody::Json(serde_json::json!([1, 2, 3]))).unwrap(), vec![1, 2, 3]);
        assert!(png_body(&InvokeBody::Json(serde_json::json!({"a": 1}))).is_err());
    }
}
