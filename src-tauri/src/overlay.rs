use std::sync::atomic::{AtomicU64, Ordering};

use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
    http::{Request, Response, StatusCode, header},
};

use crate::capture::{CaptureGuard, Shots};

/// Overlay windows are labelled `overlay-<capture number>-<monitor index>`; the page reads the index
/// from the last segment. The capture number keeps a late "destroyed" event of a previous capture's
/// window from being mistaken for one of the current capture's.
const LABEL_PREFIX: &str = "overlay-";
static CAPTURE_NUMBER: AtomicU64 = AtomicU64::new(0);
const PAGE: &str = "index.html";
/// `shot://localhost/<monitor index>` serves that monitor's frozen PNG to its overlay.
pub const SHOT_SCHEME: &str = "shot";
const PNG_MIME: &str = "image/png";

fn is_overlay(label: &str) -> bool {
    label.starts_with(LABEL_PREFIX)
}

fn overlay_windows(app: &AppHandle) -> impl Iterator<Item = tauri::WebviewWindow> {
    app.webview_windows().into_iter().filter(|(label, _)| is_overlay(label)).map(|(_, w)| w)
}

/// One borderless, hidden overlay per captured monitor; the page shows itself once its image loaded.
/// Must run on the main thread.
pub fn open_overlays(app: &AppHandle) -> tauri::Result<()> {
    let capture = CAPTURE_NUMBER.fetch_add(1, Ordering::Relaxed);
    let shots = app.state::<Shots>();
    let shots = shots.0.lock().unwrap();
    for (i, s) in shots.iter().enumerate() {
        let label = format!("{LABEL_PREFIX}{capture}-{i}");
        let builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App(PAGE.into()))
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .shadow(false)
            .visible_on_all_workspaces(true)
            // with several monitors, the first drag on an unfocused overlay must not be swallowed
            .accept_first_mouse(true)
            .position(s.x as f64, s.y as f64)
            .inner_size(s.width as f64, s.height as f64)
            .visible(false);
        // Wayland ignores position; fullscreen set on the builder targets the monitor at `position`
        #[cfg(target_os = "linux")]
        let builder = builder.fullscreen(true);
        let window = builder.build()?;
        #[cfg(target_os = "macos")]
        mac::raise_above_menu_bar(&window);
        let _ = window;
    }
    Ok(())
}

/// Closes every overlay and frees the capture so the next hotkey press works.
#[tauri::command]
pub fn close_overlays(app: AppHandle) {
    for window in overlay_windows(&app) {
        let _ = window.destroy();
    }
    release_capture(&app);
}

/// Drops the frozen images and lets the next capture start.
pub fn release_capture(app: &AppHandle) {
    app.state::<Shots>().0.lock().unwrap().clear();
    app.state::<CaptureGuard>().end();
}

/// Overlays closed some other way (Alt+F4, compositor): once the last one is gone, free the capture.
pub fn on_window_destroyed(app: &AppHandle, label: &str) {
    if is_overlay(label) && overlay_windows(app).all(|w| w.label() == label) {
        release_capture(app);
    }
}

/// Hides the overlays without ending the capture (e.g. while the save dialog is open).
pub fn hide_overlays(app: &AppHandle) {
    for window in overlay_windows(app) {
        let _ = window.hide();
    }
}

/// Brings hidden overlays back, focusing one so keyboard shortcuts work again.
pub fn show_overlays(app: &AppHandle) {
    let mut focused = false;
    for window in overlay_windows(app) {
        let _ = window.show();
        if !focused {
            focused = window.set_focus().is_ok();
        }
    }
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
