use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::hotkey;

const LABEL: &str = "settings";
const PAGE: &str = "settings.html";
const TITLE: &str = "Snapit – Capture hotkey";
const WIDTH: f64 = 400.0;
const HEIGHT: f64 = 280.0;

/// Opens (or focuses) the hotkey settings window. The capture hotkey is paused while it's open.
pub fn open(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(LABEL) {
        return window.set_focus();
    }
    hotkey::pause(app);
    let window = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App(PAGE.into()))
        .title(TITLE)
        .inner_size(WIDTH, HEIGHT)
        .resizable(false)
        .minimizable(false)
        .maximizable(false)
        .always_on_top(true)
        .center()
        .build()
        .inspect_err(|_| hotkey::resume(app))?;
    window.set_focus()
}

pub fn on_window_destroyed(app: &AppHandle, label: &str) {
    if label == LABEL {
        hotkey::resume(app);
    }
}
