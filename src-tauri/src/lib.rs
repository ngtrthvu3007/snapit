use tauri::{
    AppHandle, RunEvent,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
};

pub fn trigger_capture(_app: &AppHandle) {
    eprintln!("capture requested");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let capture = MenuItem::with_id(app, "capture", "Capture", true, None::<&str>)?;
            let autostart =
                CheckMenuItem::with_id(app, "autostart", "Start at login", true, false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&capture, &autostart, &quit])?;

            TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "capture" => trigger_capture(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_, e| {
            // keep running in tray when the last overlay window closes
            if let RunEvent::ExitRequested { code: None, api, .. } = e {
                api.prevent_exit();
            }
        });
}
