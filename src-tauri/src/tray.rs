use tauri::{
    AppHandle,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
};

use crate::{autostart, capture, dialog::show_error, settings};

const TRAY_ID: &str = "tray";
const ID_CAPTURE: &str = "capture";
const ID_HOTKEY: &str = "hotkey";
const ID_AUTOSTART: &str = "autostart";
const ID_QUIT: &str = "quit";

/// Tray / menu-bar icon: Capture, Change hotkey…, Start at login ✓, Quit.
pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let capture = MenuItem::with_id(app, ID_CAPTURE, "Capture", true, None::<&str>)?;
    let change_hotkey = MenuItem::with_id(app, ID_HOTKEY, "Change hotkey…", true, None::<&str>)?;
    let start_at_login =
        CheckMenuItem::with_id(app, ID_AUTOSTART, "Start at login", true, autostart::is_enabled(app), None::<&str>)?;
    let quit = MenuItem::with_id(app, ID_QUIT, "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&capture, &change_hotkey, &start_at_login, &quit])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(app.default_window_icon().expect("bundle has an icon").clone())
        .menu(&menu)
        .on_menu_event(move |app, e| match e.id.as_ref() {
            ID_CAPTURE => capture::trigger(app),
            ID_HOTKEY => {
                if let Err(e) = settings::open(app) {
                    show_error(app, &e.to_string());
                }
            }
            ID_AUTOSTART => {
                let on = autostart::toggle(app);
                let _ = start_at_login.set_checked(on);
            }
            ID_QUIT => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}
