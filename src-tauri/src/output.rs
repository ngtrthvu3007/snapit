use std::path::PathBuf;

use chrono::{Local, NaiveDateTime};
use tauri::{
    AppHandle, Manager,
    image::Image,
    ipc::{InvokeBody, Request},
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;

use crate::{
    dialog::to_message,
    overlay::{close_overlays, hide_overlays, show_overlays},
};

const PNG_FILTER_NAME: &str = "PNG";
const PNG_EXTENSION: &str = "png";
const FILENAME_FORMAT: &str = "Snapit_%Y-%m-%d_%H-%M-%S.png";
const BAD_BODY_MESSAGE: &str = "expected PNG bytes";

pub fn default_filename(time: NaiveDateTime) -> String {
    time.format(FILENAME_FORMAT).to_string()
}

/// PNG trang gửi lên: thường là raw body, là mảng byte JSON nếu Tauri phải dùng postMessage.
pub(crate) fn png_body(body: &InvokeBody) -> Result<Vec<u8>, String> {
    match body {
        InvokeBody::Raw(bytes) => Ok(bytes.clone()),
        InvokeBody::Json(value) => serde_json::from_value(value.clone()).map_err(|_| BAD_BODY_MESSAGE.into()),
    }
}

/// Hộp thoại lưu của GTK không tự thêm đuôi; "foo" vẫn phải thành "foo.png".
pub(crate) fn with_png_extension(path: PathBuf) -> PathBuf {
    if path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case(PNG_EXTENSION)) {
        return path;
    }
    let mut name = path.into_os_string();
    name.push(".");
    name.push(PNG_EXTENSION);
    name.into()
}

/// Copy PNG vào clipboard rồi đóng overlay. Lỗi thì overlay vẫn mở và trang tự báo lỗi
/// (hộp thoại hệ thống sẽ bị overlay che). async → chạy ngoài luồng chính.
#[tauri::command]
pub async fn copy_png(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let png = png_body(request.body())?;
    let image = image::load_from_memory(&png).map_err(to_message)?.into_rgba8();
    let (width, height) = image.dimensions();
    app.clipboard()
        .write_image(&Image::new_owned(image.into_raw(), width, height))
        .map_err(|error| format!("Copy failed: {error}"))?;
    close_overlays(app);
    Ok(())
}

/// Ẩn overlay (để không che hộp thoại), hỏi nơi lưu, ghi file.
/// Lưu xong thì đóng overlay; huỷ hoặc lỗi thì hiện lại overlay, giữ nguyên hình vẽ.
/// Trả về false khi người dùng huỷ.
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
    let mut dialog = app
        .dialog()
        .file()
        .set_file_name(default_filename(Local::now().naive_local()))
        .add_filter(PNG_FILTER_NAME, &[PNG_EXTENSION]);
    if let Ok(pictures) = app.path().picture_dir() {
        dialog = dialog.set_directory(pictures);
    }
    let Some(picked) = dialog.blocking_save_file() else { return Ok(false) };
    let path = with_png_extension(picked.into_path().map_err(to_message)?);
    std::fs::write(&path, png).map_err(|error| format!("Could not save {}: {error}", path.display()))?;
    Ok(true)
}
