use tauri::{
    AppHandle,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
};

use crate::{
    autostart, capture,
    dialog::{show_error, to_message},
    settings,
};

const TRAY_ID: &str = "tray";

/// Id các mục menu.
mod item_id {
    pub const CAPTURE: &str = "capture";
    pub const CHANGE_HOTKEY: &str = "hotkey";
    pub const START_AT_LOGIN: &str = "autostart";
    pub const QUIT: &str = "quit";
}

/// Nhãn các mục menu.
mod item_label {
    pub const CAPTURE: &str = "Capture";
    pub const CHANGE_HOTKEY: &str = "Change hotkey…";
    pub const START_AT_LOGIN: &str = "Start at login";
    pub const QUIT: &str = "Quit";
}

/// Icon trên tray / menu bar: Capture, Change hotkey…, Start at login ✓, Quit.
pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let item =
        |id: &str, label: &str| MenuItem::with_id(app, id, label, true, None::<&str>);

    let capture = item(item_id::CAPTURE, item_label::CAPTURE)?;
    let change_hotkey = item(item_id::CHANGE_HOTKEY, item_label::CHANGE_HOTKEY)?;
    let quit = item(item_id::QUIT, item_label::QUIT)?;
    let start_at_login = CheckMenuItem::with_id(
        app,
        item_id::START_AT_LOGIN,
        item_label::START_AT_LOGIN,
        true,
        autostart::is_enabled(app),
        None::<&str>,
    )?;

    let menu =
        Menu::with_items(app, &[&capture, &change_hotkey, &start_at_login, &quit])?;
    let icon = app
        .default_window_icon()
        .expect("bundle has an icon")
        .clone();

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            item_id::CAPTURE => capture::trigger(app),
            item_id::CHANGE_HOTKEY => open_settings(app),
            item_id::START_AT_LOGIN => {
                let _ = start_at_login.set_checked(autostart::toggle(app));
            }
            item_id::QUIT => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

fn open_settings(app: &AppHandle) {
    if let Err(error) = settings::open(app) {
        show_error(app, &to_message(error));
    }
}
