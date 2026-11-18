use std::sync::atomic::{AtomicU64, Ordering};

use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    http::{Request, Response, StatusCode, header},
};

use crate::capture::{CaptureGuard, Shot, Shots};

/// Nhãn overlay: `overlay-<lần chụp>-<số màn hình>`; trang web đọc số màn hình ở đoạn cuối.
/// Số lần chụp giúp sự kiện "destroyed" đến muộn của lần trước không bị nhầm với lần hiện tại.
const LABEL_PREFIX: &str = "overlay-";
const PAGE: &str = "index.html";
/// `shot://localhost/<số màn hình>` trả ảnh PNG đóng băng cho overlay của màn hình đó.
pub const SHOT_SCHEME: &str = "shot";
const PNG_MIME: &str = "image/png";
const ANY_ORIGIN: &str = "*";

static CAPTURE_NUMBER: AtomicU64 = AtomicU64::new(0);

fn is_overlay(label: &str) -> bool {
    label.starts_with(LABEL_PREFIX)
}

fn overlay_windows(app: &AppHandle) -> impl Iterator<Item = WebviewWindow> {
    app.webview_windows()
        .into_iter()
        .filter(|(label, _)| is_overlay(label))
        .map(|(_, window)| window)
}

/// Mỗi màn hình một overlay không viền, ẩn sẵn; trang tự hiện khi đã tải xong ảnh.
/// Phải chạy trên luồng chính.
pub fn open_overlays(app: &AppHandle) -> tauri::Result<()> {
    let capture = CAPTURE_NUMBER.fetch_add(1, Ordering::Relaxed);
    let shots = app.state::<Shots>();

    for (index, shot) in shots.lock().iter().enumerate() {
        let label = format!("{LABEL_PREFIX}{capture}-{index}");
        let _window = overlay_builder(app, label, shot).build()?;

        #[cfg(target_os = "macos")]
        mac::raise_above_menu_bar(&_window);
    }

    Ok(())
}

/// Cửa sổ không viền, luôn trên cùng, phủ đúng một màn hình, ẩn sẵn.
fn overlay_builder<'a>(
    app: &'a AppHandle,
    label: String,
    shot: &Shot,
) -> WebviewWindowBuilder<'a, tauri::Wry, AppHandle> {
    let builder = WebviewWindowBuilder::new(app, label, WebviewUrl::App(PAGE.into()))
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .shadow(false)
        .visible_on_all_workspaces(true)
        // nhiều màn hình: cú kéo đầu tiên trên overlay chưa focus không bị nuốt
        .accept_first_mouse(true)
        .position(f64::from(shot.x), f64::from(shot.y))
        .inner_size(f64::from(shot.width), f64::from(shot.height))
        .visible(false);

    // Wayland bỏ qua position; fullscreen đặt trên builder sẽ nhắm đúng màn hình tại `position`
    #[cfg(target_os = "linux")]
    let builder = builder.fullscreen(true);

    builder
}

/// Đóng mọi overlay và giải phóng lần chụp để phím tắt dùng lại được.
#[tauri::command]
pub fn close_overlays(app: AppHandle) {
    overlay_windows(&app).for_each(|window| drop(window.destroy()));
    release_capture(&app);
}

/// Bỏ ảnh đóng băng và cho phép lần chụp tiếp theo.
pub fn release_capture(app: &AppHandle) {
    app.state::<Shots>().clear();
    app.state::<CaptureGuard>().end();
}

/// Overlay bị đóng kiểu khác (Alt+F4, compositor): khi overlay cuối cùng mất thì giải phóng lần chụp.
pub fn on_window_destroyed(app: &AppHandle, label: &str) {
    if is_overlay(label) && overlay_windows(app).all(|window| window.label() == label) {
        release_capture(app);
    }
}

/// Ẩn overlay nhưng giữ lần chụp (ví dụ khi hộp thoại lưu đang mở).
pub fn hide_overlays(app: &AppHandle) {
    overlay_windows(app).for_each(|window| drop(window.hide()));
}

/// Hiện lại overlay đã ẩn, focus một cái để phím tắt hoạt động.
pub fn show_overlays(app: &AppHandle) {
    let mut focused = false;

    for window in overlay_windows(app) {
        let _ = window.show();
        focused = focused || window.set_focus().is_ok();
    }
}

/// Xử lý scheme `shot://`.
pub fn serve_shot(app: &AppHandle, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let index: Option<usize> = request.uri().path().trim_start_matches('/').parse().ok();
    let png = index.and_then(|index| app.state::<Shots>().png(index));

    // CORS để trang vẽ ảnh lên canvas mà vẫn xuất được (canvas không bị "tainted")
    let response =
        Response::builder().header(header::ACCESS_CONTROL_ALLOW_ORIGIN, ANY_ORIGIN);

    match png {
        Some(png) => response.header(header::CONTENT_TYPE, PNG_MIME).body(png),
        None => response.status(StatusCode::NOT_FOUND).body(Vec::new()),
    }
    .expect("static response parts are valid")
}

#[cfg(target_os = "macos")]
mod mac {
    use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};

    /// NSScreenSaverWindowLevel: nằm trên menu bar và Dock.
    const ABOVE_MENU_BAR_LEVEL: isize = 1000;

    pub fn raise_above_menu_bar(window: &tauri::WebviewWindow) {
        if let Ok(pointer) = window.ns_window() {
            // SAFETY: tauri trả về con trỏ NSWindow hợp lệ; đang ở luồng chính
            let ns_window: &NSWindow = unsafe { &*(pointer as *const NSWindow) };
            ns_window.setLevel(ABOVE_MENU_BAR_LEVEL);
            ns_window.setCollectionBehavior(
                NSWindowCollectionBehavior::CanJoinAllSpaces
                    | NSWindowCollectionBehavior::FullScreenAuxiliary,
            );
        }
    }
}
