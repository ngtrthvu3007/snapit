use chrono::{Datelike, Local, Timelike};
use tauri::{
    AppHandle, Manager,
    image::Image,
    ipc::{InvokeBody, Request},
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;

use crate::{dialog::show_error, overlay::close_overlays};

const PNG_FILTER_NAME: &str = "PNG";
const PNG_EXTENSION: &str = "png";

pub fn default_filename(y: i32, mo: u8, d: u8, h: u8, mi: u8, s: u8) -> String {
    format!("Snapit_{y:04}-{mo:02}-{d:02}_{h:02}-{mi:02}-{s:02}.png")
}

fn raw_png(req: &Request<'_>) -> Result<Vec<u8>, String> {
    match req.body() {
        InvokeBody::Raw(b) => Ok(b.clone()),
        _ => Err("expected raw PNG body".into()),
    }
}

/// Copies the PNG to the clipboard, then closes the overlays. On failure the overlays stay open.
/// async → runs off the main thread.
#[tauri::command]
pub async fn copy_png(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let res = raw_png(&request).and_then(|png| {
        let img = image::load_from_memory(&png).map_err(|e| e.to_string())?.into_rgba8();
        let (w, h) = img.dimensions();
        app.clipboard()
            .write_image(&Image::new_owned(img.into_raw(), w, h))
            .map_err(|e| e.to_string())
    });
    match &res {
        Ok(()) => close_overlays(app),
        Err(e) => show_error(&app, &format!("Copy failed: {e}")),
    }
    res
}

/// Closes the overlays (so the dialog isn't hidden behind them), then asks where to save.
/// Returns false when the user cancels.
#[tauri::command]
pub async fn save_png(app: AppHandle, request: Request<'_>) -> Result<bool, String> {
    let png = raw_png(&request)?;
    close_overlays(app.clone());
    let now = Local::now();
    let name = default_filename(
        now.year(),
        now.month() as u8,
        now.day() as u8,
        now.hour() as u8,
        now.minute() as u8,
        now.second() as u8,
    );
    let mut dialog = app.dialog().file().set_file_name(name).add_filter(PNG_FILTER_NAME, &[PNG_EXTENSION]);
    if let Ok(dir) = app.path().picture_dir() {
        dialog = dialog.set_directory(dir);
    }
    let Some(path) = dialog.blocking_save_file() else { return Ok(false) };
    let path = path.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, png).map_err(|e| {
        let msg = format!("Could not save {}: {e}", path.display());
        show_error(&app, &msg);
        msg
    })?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filename_format() {
        assert_eq!(default_filename(2026, 11, 18, 9, 5, 7), "Snapit_2026-11-18_09-05-07.png");
    }
}
