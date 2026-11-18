use std::{
    sync::{
        Mutex,
        atomic::{AtomicBool, Ordering},
    },
    time::Instant,
};

use image::{
    ExtendedColorType, ImageEncoder,
    codecs::png::{CompressionType, FilterType, PngEncoder},
};
use tauri::{AppHandle, Manager};

use crate::{dialog::show_error, overlay};

const PERMISSION_MESSAGE: &str = "Snapit needs Screen Recording permission. Enable it in System Settings → \
     Privacy & Security → Screen Recording, then restart Snapit.";

/// One monitor's frozen image. Geometry is logical (points); `png` is physical pixels.
pub struct Shot {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub png: Vec<u8>,
}

/// The current capture, one shot per monitor; empty when no overlay is open.
#[derive(Default)]
pub struct Shots(pub Mutex<Vec<Shot>>);

/// Held from the hotkey press until the overlays close, so a second press doesn't stack captures.
#[derive(Default)]
pub struct CaptureGuard(AtomicBool);

impl CaptureGuard {
    pub fn try_begin(&self) -> bool {
        self.0.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire).is_ok()
    }
    pub fn end(&self) {
        self.0.store(false, Ordering::Release);
    }
}

/// Captures every monitor off the main thread, then opens the overlays on it.
pub fn trigger(app: &AppHandle) {
    if !app.state::<CaptureGuard>().try_begin() {
        return;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        let started = Instant::now();
        let shots = match capture_all() {
            Ok(shots) => shots,
            Err(e) => {
                app.state::<CaptureGuard>().end();
                return show_error(&app, &e);
            }
        };
        eprintln!("captured {} monitor(s) in {:?}", shots.len(), started.elapsed());
        *app.state::<Shots>().0.lock().unwrap() = shots;
        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            if let Err(e) = overlay::open_overlays(&handle) {
                overlay::close_overlays(handle.clone());
                show_error(&handle, &e.to_string());
            }
        });
    });
}

fn capture_all() -> Result<Vec<Shot>, String> {
    ensure_permission()?;
    let err = |e: xcap::XCapError| e.to_string();
    // ponytail: on Wayland xcap calls the portal once per monitor; capture once + crop if that shows N dialogs
    xcap::Monitor::all()
        .map_err(err)?
        .iter()
        .map(|m| {
            let img = m.capture_image().map_err(err)?;
            Ok(Shot {
                x: m.x().map_err(err)?,
                y: m.y().map_err(err)?,
                width: m.width().map_err(err)?,
                height: m.height().map_err(err)?,
                png: encode_png_fast(&img)?,
            })
        })
        .collect()
}

/// Speed over size: the PNG only travels to our own webview.
fn encode_png_fast(img: &image::RgbaImage) -> Result<Vec<u8>, String> {
    let mut png = Vec::new();
    PngEncoder::new_with_quality(&mut png, CompressionType::Fast, FilterType::NoFilter)
        .write_image(img, img.width(), img.height(), ExtendedColorType::Rgba8)
        .map_err(|e| e.to_string())?;
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
    unsafe {
        if !CGPreflightScreenCaptureAccess() {
            CGRequestScreenCaptureAccess();
            return Err(PERMISSION_MESSAGE.into());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guard_rejects_second_capture_until_end() {
        let g = CaptureGuard::default();
        assert!(g.try_begin());
        assert!(!g.try_begin());
        g.end();
        assert!(g.try_begin());
    }
}
