use std::{
    sync::{
        Mutex, MutexGuard,
        atomic::{AtomicBool, Ordering},
    },
    time::Instant,
};

use image::{
    ExtendedColorType, ImageEncoder, RgbaImage,
    codecs::png::{CompressionType, FilterType, PngEncoder},
};
use tauri::{AppHandle, Manager};

use crate::{
    dialog::{show_error, to_message},
    overlay,
};

const PERMISSION_MESSAGE: &str = "Snapit needs Screen Recording permission. Enable it in System Settings → \
     Privacy & Security → Screen Recording, then restart Snapit.";
const NO_MONITORS_MESSAGE: &str = "No screen found to capture.";

/// Ảnh đóng băng của một màn hình. Toạ độ là logical (point); `png` là pixel thật.
pub struct Shot {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub png: Vec<u8>,
}

/// Lần chụp hiện tại, mỗi màn hình một ảnh; rỗng khi không có overlay nào.
#[derive(Default)]
pub struct Shots(Mutex<Vec<Shot>>);

impl Shots {
    pub fn lock(&self) -> MutexGuard<'_, Vec<Shot>> {
        self.0.lock().expect("shots mutex poisoned")
    }
    pub fn replace(&self, shots: Vec<Shot>) {
        *self.lock() = shots;
    }
    pub fn clear(&self) {
        self.lock().clear();
    }
    pub fn png(&self, index: usize) -> Option<Vec<u8>> {
        self.lock().get(index).map(|shot| shot.png.clone())
    }
}

/// Giữ từ lúc bấm phím tới khi overlay đóng, để bấm lần nữa không chụp chồng.
#[derive(Default)]
pub struct CaptureGuard(AtomicBool);

impl CaptureGuard {
    pub fn try_begin(&self) -> bool {
        self.0
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .is_ok()
    }
    pub fn end(&self) {
        self.0.store(false, Ordering::Release);
    }
}

/// Chụp mọi màn hình ở luồng phụ, rồi mở overlay trên luồng chính.
pub fn trigger(app: &AppHandle) {
    if !app.state::<CaptureGuard>().try_begin() {
        return;
    }

    let app = app.clone();
    std::thread::spawn(move || capture_and_open(app));
}

fn capture_and_open(app: AppHandle) {
    let started = Instant::now();

    let shots = match capture_all() {
        Ok(shots) => shots,
        Err(message) => return fail(&app, &message),
    };

    eprintln!(
        "captured {} monitor(s) in {:?}",
        shots.len(),
        started.elapsed()
    );
    app.state::<Shots>().replace(shots);

    let main_thread_app = app.clone();
    let scheduled = app.run_on_main_thread(move || {
        if let Err(error) = overlay::open_overlays(&main_thread_app) {
            overlay::close_overlays(main_thread_app.clone());
            show_error(&main_thread_app, &to_message(error));
        }
    });

    if let Err(error) = scheduled {
        fail(&app, &to_message(error));
    }
}

/// Huỷ lần chụp đang dở và báo lỗi.
fn fail(app: &AppHandle, message: &str) {
    overlay::release_capture(app);
    show_error(app, message);
}

/// Không có màn hình nào thì không overlay nào mở, lần chụp sẽ kẹt mãi → coi là lỗi.
pub(crate) fn require_monitors(shots: Vec<Shot>) -> Result<Vec<Shot>, String> {
    if shots.is_empty() {
        Err(NO_MONITORS_MESSAGE.into())
    } else {
        Ok(shots)
    }
}

fn capture_all() -> Result<Vec<Shot>, String> {
    ensure_permission()?;

    // ponytail: trên Wayland xcap gọi portal mỗi màn hình một lần;
    // nếu hiện N hộp thoại thì chụp 1 lần rồi cắt
    let monitors = xcap::Monitor::all().map_err(to_message)?;
    let shots = monitors
        .iter()
        .map(capture_monitor)
        .collect::<Result<Vec<_>, String>>()?;

    require_monitors(shots)
}

fn capture_monitor(monitor: &xcap::Monitor) -> Result<Shot, String> {
    let image = monitor.capture_image().map_err(to_message)?;

    Ok(Shot {
        x: monitor.x().map_err(to_message)?,
        y: monitor.y().map_err(to_message)?,
        width: monitor.width().map_err(to_message)?,
        height: monitor.height().map_err(to_message)?,
        png: encode_png_fast(&image)?,
    })
}

/// Ưu tiên tốc độ hơn dung lượng: PNG chỉ đi tới webview của chính app.
fn encode_png_fast(image: &RgbaImage) -> Result<Vec<u8>, String> {
    let mut png = Vec::new();
    let encoder = PngEncoder::new_with_quality(
        &mut png,
        CompressionType::Fast,
        FilterType::NoFilter,
    );

    encoder
        .write_image(
            image,
            image.width(),
            image.height(),
            ExtendedColorType::Rgba8,
        )
        .map_err(to_message)?;

    Ok(png)
}

#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
unsafe extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}

fn ensure_permission() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    // SAFETY: hai hàm CoreGraphics không tham số, gọi được ở mọi luồng
    unsafe {
        if !CGPreflightScreenCaptureAccess() {
            CGRequestScreenCaptureAccess();
            return Err(PERMISSION_MESSAGE.into());
        }
    }
    Ok(())
}
