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
