use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::capture::{CaptureGuard, Shots};

/// One borderless, hidden overlay per captured monitor; the page shows itself once its image loaded.
/// Must run on the main thread.
pub fn open_overlays(app: &AppHandle) -> tauri::Result<()> {
    let shots = app.state::<Shots>();
    let shots = shots.0.lock().unwrap();
    for (i, s) in shots.iter().enumerate() {
        let w = WebviewWindowBuilder::new(app, format!("overlay-{i}"), WebviewUrl::App("index.html".into()))
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .shadow(false)
            .visible_on_all_workspaces(true)
            .position(s.x as f64, s.y as f64)
            .inner_size(s.width as f64, s.height as f64)
            .visible(false)
            .build()?;
        #[cfg(target_os = "macos")]
        raise_above_menu_bar(&w);
        // Wayland ignores position; fullscreen is the only way to cover the screen
        #[cfg(target_os = "linux")]
        w.set_fullscreen(true)?;
        let _ = w;
    }
    Ok(())
}

#[tauri::command]
pub fn close_overlays(app: AppHandle) {
    for (label, w) in app.webview_windows() {
        if label.starts_with("overlay-") {
            let _ = w.destroy();
        }
    }
    app.state::<Shots>().0.lock().unwrap().clear();
    app.state::<CaptureGuard>().end();
}

#[cfg(target_os = "macos")]
fn raise_above_menu_bar(w: &tauri::WebviewWindow) {
    use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};
    const NS_SCREEN_SAVER_WINDOW_LEVEL: isize = 1000;
    if let Ok(ptr) = w.ns_window() {
        let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
        ns.setLevel(NS_SCREEN_SAVER_WINDOW_LEVEL);
        ns.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces | NSWindowCollectionBehavior::FullScreenAuxiliary,
        );
    }
}
