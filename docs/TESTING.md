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

## Task 8 — release builds

macOS `.dmg` built on the company Mac: `src-tauri/target/release/bundle/dmg/Snapit_0.1.0_aarch64.dmg` (LSMinimumSystemVersion 13.0).

- [ ] Install the `.dmg` on a personal Mac, follow README install steps exactly; note anything that differs.
- [ ] **Ubuntu:** `npm run tauri build` → `.deb` + `.AppImage` in `src-tauri/target/release/bundle/`; fix README's apt dependency list if something was missing.
- [ ] Full pass of every section above on both machines, then fill the spec's "Spike results" + README "Known limitations".

## After code review (fixes to verify on real hardware)

- [ ] Close an overlay with Alt+F4 (Linux) / force-quit its window → hotkey works again.
- [ ] Multi-monitor Mac: right after the hotkey, drag on the monitor that isn't focused → selection starts on the first drag.
- [ ] Multi-monitor Ubuntu Wayland: each monitor gets its own overlay with its own image.
- [ ] Linux: overlay goes fullscreen after appearing → drawing lines up with the cursor; exported crop matches the selection.
- [ ] Save → Cancel → overlay comes back with selection and drawings intact. Hotkey while the save dialog is open does nothing.
- [ ] Save as `foo` (no extension) → `foo.png` written.
- [ ] Copy failure (hard to force; e.g. no clipboard manager on a minimal Linux session) → red message inside the overlay, overlay stays.
- [ ] Fractional scaling 1.25× / 1.5× (Ubuntu) → exported image is sharp, size label matches the PNG.
- [ ] Broken `config.json` (e.g. trailing comma) → startup error naming the file; file unchanged; autostart unchanged. (Verified on Mac via log.)
- [ ] Tray → Capture: the closing tray menu isn't in the screenshot.
- [ ] macOS: ⌘H / ⌘Q while an overlay is focused — note what happens.
- [ ] Release build first launched from the mounted DMG, then copied to Applications and relaunched → login item points to /Applications.

## Change hotkey…

Verified in the browser (dev/settings-preview.html, mocked IPC): letter alone rejected, taken key → red error, pick + Save stores the new key, Wayland view shows instructions and fits 400×280.

- [ ] Tray → Change hotkey… opens the window in front (Mac: also when another app is active).
- [ ] While it's open, pressing the current hotkey does not capture.
- [ ] Save → new key captures immediately, old one does nothing; survives restart (config.json updated).
- [ ] Cancel / close the window → old key works again.
- [ ] A key taken by another app (e.g. one Spotlight uses) → error, old key still works after closing.
- [ ] **Ubuntu Wayland:** the window shows the GNOME instructions.
