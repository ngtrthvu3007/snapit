use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
    http::{Request, Response, StatusCode, header},
};

use crate::capture::{CaptureGuard, Shots};

/// Overlay windows are labelled `overlay-<monitor index>`; the page reads its index from the label.
const LABEL_PREFIX: &str = "overlay-";
const PAGE: &str = "index.html";
/// `shot://localhost/<monitor index>` serves that monitor's frozen PNG to its overlay.
pub const SHOT_SCHEME: &str = "shot";
const PNG_MIME: &str = "image/png";

fn is_overlay(label: &str) -> bool {
    label.starts_with(LABEL_PREFIX)
}

/// One borderless, hidden overlay per captured monitor; the page shows itself once its image loaded.
/// Must run on the main thread.
pub fn open_overlays(app: &AppHandle) -> tauri::Result<()> {
    let shots = app.state::<Shots>();
    let shots = shots.0.lock().unwrap();
    for (i, s) in shots.iter().enumerate() {
        let window = WebviewWindowBuilder::new(app, format!("{LABEL_PREFIX}{i}"), WebviewUrl::App(PAGE.into()))
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
        mac::raise_above_menu_bar(&window);
        // Wayland ignores position; fullscreen is the only way to cover the screen
        #[cfg(target_os = "linux")]
        window.set_fullscreen(true)?;
        let _ = window;
    }
    Ok(())
}

/// Closes every overlay and frees the capture so the next hotkey press works.
#[tauri::command]
pub fn close_overlays(app: AppHandle) {
    for (label, window) in app.webview_windows() {
        if is_overlay(&label) {
            let _ = window.destroy();
        }
    }
    app.state::<Shots>().0.lock().unwrap().clear();
    app.state::<CaptureGuard>().end();
}

/// Handler for the `shot://` scheme.
pub fn serve_shot(app: &AppHandle, req: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let index: Option<usize> = req.uri().path().trim_start_matches('/').parse().ok();
    let shots = app.state::<Shots>();
    let shots = shots.0.lock().unwrap();
    // CORS lets the page draw the image into a canvas and still export it (an untainted canvas)
    let res = Response::builder().header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*");
    match index.and_then(|i| shots.get(i)) {
        Some(s) => res.header(header::CONTENT_TYPE, PNG_MIME).body(s.png.clone()),
        None => res.status(StatusCode::NOT_FOUND).body(Vec::new()),
    }
    .expect("static response parts are valid")
}

#[cfg(target_os = "macos")]
mod mac {
    use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};

    /// NSScreenSaverWindowLevel: above the menu bar and the Dock.
    const ABOVE_MENU_BAR_LEVEL: isize = 1000;

    pub fn raise_above_menu_bar(w: &tauri::WebviewWindow) {
        if let Ok(ptr) = w.ns_window() {
            // SAFETY: tauri hands out a valid NSWindow pointer; we're on the main thread
            let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
            ns.setLevel(ABOVE_MENU_BAR_LEVEL);
            ns.setCollectionBehavior(
                NSWindowCollectionBehavior::CanJoinAllSpaces | NSWindowCollectionBehavior::FullScreenAuxiliary,
            );
        }
    }
}
