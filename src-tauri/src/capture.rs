use std::sync::{
    Mutex,
    atomic::{AtomicBool, Ordering},
};

use image::{
    ExtendedColorType, ImageEncoder,
    codecs::png::{CompressionType, FilterType, PngEncoder},
};

/// One monitor's frozen image. Geometry is logical (points); `png` is physical pixels.
pub struct Shot {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub png: Vec<u8>,
}

#[derive(Default)]
pub struct Shots(pub Mutex<Vec<Shot>>);

/// Prevents a second capture while overlays are open.
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

pub fn capture_all() -> Result<Vec<Shot>, String> {
    ensure_permission()?;
    let e = |e: xcap::XCapError| e.to_string();
    // ponytail: on Wayland xcap calls the portal once per monitor; capture once + crop if that shows N dialogs
    xcap::Monitor::all()
        .map_err(e)?
        .iter()
        .map(|m| {
            let img = m.capture_image().map_err(e)?;
            let mut png = Vec::new();
            PngEncoder::new_with_quality(&mut png, CompressionType::Fast, FilterType::NoFilter)
                .write_image(&img, img.width(), img.height(), ExtendedColorType::Rgba8)
                .map_err(|e| e.to_string())?;
            Ok(Shot {
                x: m.x().map_err(e)?,
                y: m.y().map_err(e)?,
                width: m.width().map_err(e)?,
                height: m.height().map_err(e)?,
                png,
            })
        })
        .collect()
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
            return Err("Snapit needs Screen Recording permission. Enable it in System Settings → \
                 Privacy & Security → Screen Recording, then restart Snapit."
                .into());
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
