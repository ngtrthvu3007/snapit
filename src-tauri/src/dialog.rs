use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const TITLE: &str = "Snapit";

/// Native error dialog (also logged to stderr, which is all you get without a visible window).
/// Don't call while overlays are visible: they sit above every dialog.
pub fn show_error(app: &AppHandle, msg: &str) {
    eprintln!("error: {msg}");
    app.dialog()
        .message(msg)
        .title(TITLE)
        .kind(MessageDialogKind::Error)
        .show(|_| {});
}
