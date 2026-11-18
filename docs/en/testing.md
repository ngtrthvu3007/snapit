# Manual test checklist

The stuff automated tests can't reach. Run it on a Mac that has Screen Recording allowed (not the company Mac) and on Ubuntu (GNOME, Wayland), with `npm run tauri dev`. The terminal log shows `captured N monitor(s) in …` and every error as `error: …`.

Already checked on the company Mac (through the log only, since it can't capture): `--capture`, a second launch handing off to the running instance, ⌘⇧2, autostart, a broken config. The Change hotkey window was tried in the browser with a fake backend.

## Ubuntu: first build

The Linux-only code has **never been compiled**. The first release run on GitHub Actions will tell, or install the packages from [Technical notes](./technical.md#running-it-locally) and run it on the laptop.

## Capture & overlay

- [ ] Tray icon shows up (Mac menu bar / GNOME top bar); no Dock icon on the Mac.
- [ ] Mac without permission: pressing capture → macOS asks + Snapit shows a dialog explaining what to do.
- [ ] Capture → the screen freezes, sharp on Retina/HiDPI, no black flash.
- [ ] From key press to overlay feels under 0.3 s on the Mac.
- [ ] Mac: the overlay covers the menu bar, the Dock, and a fullscreen app.
- [ ] Esc closes; you can capture again right away. Pressing capture while the overlay is open does nothing.
- [ ] Tray → Capture: the fading tray menu doesn't end up in the shot.
- [ ] Several monitors: one overlay each, each with its own picture. Dragging straight away on an unfocused monitor starts a selection without an extra click.
- [ ] Alt+F4 on an overlay (Linux) → the capture key still works afterwards.
- [ ] Mac: press ⌘H / ⌘Q while an overlay is open → note what happens.
- [ ] **Wayland:** is there a permission prompt? Every capture or only the first? Two monitors, two prompts?
- [ ] **Wayland:** does each overlay land on the right monitor? Does drawing line up with the cursor?

## Copy & save

- [ ] ⌘C / Ctrl+C → the overlay closes; pasting into Preview (File → New from Clipboard) / GIMP / LibreOffice shows the right crop with the drawings.
- [ ] The pasted image has exactly the pixel size the label showed (2× on Retina).
- [ ] Copy while a text box is still open → the text is in the image.
- [ ] ⌘S / Ctrl+S → the dialog opens in `~/Pictures` with a `Snapit_….png` name; the file opens fine.
- [ ] Cancel in the save dialog → back to the overlay, drawings intact. Pressing capture while the dialog is open does nothing.
- [ ] Typing `foo` with no extension → saved as `foo.png`.
- [ ] The toolbar's copy/save buttons behave like the shortcuts.
- [ ] Ubuntu at 1.25× / 1.5× scaling → the image isn't blurry and matches the label.
- [ ] **Wayland:** after copying and the overlay closing, pasting into another app still works. If not, report it so we can add the fallback (copy also saves a file).

## Shortcuts

- [ ] Linux X11: PrintScreen captures. If the desktop already owns that key → Snapit shows an error at startup.
- [ ] **Wayland:** bind `snapit --capture` to Print under Custom Shortcuts (dev build: `…/src-tauri/target/debug/snapit --capture`) → pressing it captures.
- [ ] Tray → Change hotkey… opens the window on top (even while another app is active).
- [ ] With the window open, the old capture key doesn't capture.
- [ ] Save a new key → works right away, the old one stops, and it survives a restart.
- [ ] Cancel / close the window → the old key works again.
- [ ] Pick a key another app owns → red error; after closing, the old key still works.
- [ ] **Wayland:** the window shows the GNOME instructions instead of the key recorder.

## Start at login (release build)

- [ ] The "Start at login" check mark matches reality; toggling removes/adds the login item.
- [ ] Log out and back in → Snapit is already in the tray.
- [ ] First launch from the mounted DMG, then copy to Applications and relaunch → the login item points at `/Applications`.
- [ ] **Ubuntu:** `~/.config/autostart/Snapit.desktop` appears/disappears with the toggle.

## Installers

- [ ] First release run on GitHub Actions: both the Mac and Linux jobs go green (the Linux job is the first time the Linux code compiles).
- [ ] Download the `.dmg` from Releases onto a personal Mac and follow the [Install](./install.md) page exactly: no "damaged" warning, just "Open Anyway".
- [ ] Download the `.deb` / `.AppImage` onto Ubuntu, install and run it.
