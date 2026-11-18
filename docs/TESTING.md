# Manual test checklist

Things automated tests can't cover. Run on a Mac with Screen Recording allowed (not the company Mac) and on Ubuntu 26.04 (GNOME Wayland). Write results into the spec's "Spike results" section.

Run with `npm run tauri dev` (stderr shows `captured N monitor(s) in …`).

## Linux first-time build

`sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libxdo-dev libssl-dev build-essential curl libpipewire-0.3-dev libclang-dev libxcb1-dev libxrandr-dev libdbus-1-dev`, Rust via rustup, Node 22+. Linux-only code has never been compiled yet — fix compile errors first.

## Task 2 — capture + overlay

- [ ] Tray icon visible (Mac menu bar / GNOME top bar); no Dock icon on Mac.
- [ ] Mac without permission: Capture → macOS permission prompt + Snapit error dialog explaining how to enable it.
- [ ] Capture → frozen screen appears, pixel-sharp on Retina/HiDPI, no black flash.
- [ ] Mac: overlay covers the menu bar and the Dock.
- [ ] Mac: overlay appears on top of a fullscreen app (risk 4).
- [ ] Esc closes; Capture again works.
- [ ] Capture while overlay open is ignored (no second overlay).
- [ ] Hotkey → overlay visible feels < 300 ms on Mac (note `captured … in` value).
- [ ] Multi-monitor: one overlay per monitor, each showing its own screen.
- [ ] **Ubuntu Wayland:** does a portal permission dialog appear? Every capture or only once? With 2 monitors, once per monitor? (risk 2)
- [ ] **Ubuntu Wayland:** which monitor does each overlay land on? (risk 1)

## Task 5 — copy / save

- [ ] ⌘C / Ctrl+C → overlay closes; paste into Preview (File → New from Clipboard) / GIMP / LibreOffice shows the crop with annotations.
- [ ] Retina: pasted image is 2× the selection's on-screen size (label shows the same numbers).
- [ ] ⌘S / Ctrl+S → overlay closes, save dialog opens in ~/Pictures with `Snapit_YYYY-MM-DD_HH-MM-SS.png`; saved file opens correctly. Cancel → nothing saved, no error.
- [ ] Toolbar copy/save buttons do the same.
- [ ] Text box still open when pressing copy → typed text is included.
- [ ] **Ubuntu Wayland (risk 3):** after copy and overlay closed, paste still works in another app. If not → spec fallback (copy also saves to ~/Pictures + notification).

## Task 6 — hotkey / --capture

Verified on the company Mac (log only): `--capture` at launch, second `snapit --capture` forwarding to the running instance, ⌘⇧2 triggering capture.

- [ ] Mac: the permission error appears as a visible dialog (not only in the log).
- [ ] Linux X11: PrintScreen triggers capture (GNOME/KDE may already own PrintScreen → error dialog naming the config file; change `hotkey` there).
- [ ] **Ubuntu Wayland:** Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → add command `snapit --capture` (full path for dev: `…/src-tauri/target/debug/snapit --capture`) bound to Print (remove GNOME's own Print binding first). Press → capture.
- [ ] Config file: edit `hotkey` (e.g. `"F12"`), restart → new key works. Location: macOS `~/Library/Application Support/com.snapit.app/config.json`, Linux `~/.config/com.snapit.app/config.json`.

## Task 7 — start at login

Verified on the company Mac: first launch writes `config.json` (`autostart_initialized: true`) + `~/Library/LaunchAgents/Snapit.plist`; after removing the plist, relaunch does not re-create it.

- [ ] Tray "Start at login" check mark matches reality; toggling off/on removes/creates the login item.
- [ ] Installed `.app`: after logout/login Snapit is running in the tray. (macOS may show a "background item added" notice — expected.)
- [ ] **Ubuntu:** `~/.config/autostart/Snapit.desktop` appears/disappears with the toggle; Snapit starts after re-login.
