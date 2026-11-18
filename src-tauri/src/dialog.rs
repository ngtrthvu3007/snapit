use std::fmt::Display;

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const TITLE: &str = "Snapit";

/// Đổi lỗi bất kỳ thành chuỗi để trả về cho người dùng / trang web.
pub fn to_message(error: impl Display) -> String {
    error.to_string()
}

/// Hộp thoại lỗi của hệ thống (đồng thời in ra stderr — chỗ duy nhất thấy được khi không có cửa sổ).
/// Đừng gọi khi overlay đang hiện: overlay nằm trên mọi hộp thoại.
pub fn show_error(app: &AppHandle, message: &str) {
    eprintln!("error: {message}");
    app.dialog().message(message).title(TITLE).kind(MessageDialogKind::Error).show(|_| {});
}
