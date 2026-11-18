# Snapit

A small Lightshot-style screenshot tool for macOS and Linux: press a key, the screen freezes, drag a region, scribble on it, copy or save.

## Install

### macOS (13 Ventura or newer)

1. Open `Snapit_<version>_<arch>.dmg` and drag Snapit to Applications.
2. Snapit isn't signed, so the first launch is blocked. Open **System Settings → Privacy & Security**, scroll down and click **Open Anyway** next to the Snapit message.
3. Press the hotkey once. macOS asks for **Screen Recording** permission: enable Snapit in **System Settings → Privacy & Security → Screen Recording**, then quit Snapit from the menu bar and start it again.

After installing a new version, macOS may forget the permission. If captures fail, remove Snapit from the Screen Recording list with **−**, add it again, and restart Snapit.

### Ubuntu / Linux

```sh
sudo apt install ./Snapit_<version>_amd64.deb
# or: chmod +x Snapit_<version>_amd64.AppImage && ./Snapit_<version>_amd64.AppImage
```

**Hotkey on Wayland (Ubuntu's default session).** Wayland doesn't let apps grab keys, so bind one yourself:

1. **Settings → Keyboard → View and Customize Shortcuts → Screenshots**: remove the binding for **Print** (or choose another key below).
2. **Custom Shortcuts → +**: name `Snapit`, command `snapit --capture` (for the AppImage use its full path plus ` --capture`), shortcut **Print**.

GNOME may ask for permission to take screenshots the first time.

On X11 the built-in hotkey (PrintScreen) works without this.

## Use

| Action | macOS | Linux |
|---|---|---|
| Capture | ⌘⇧2 | PrintScreen (X11) / your custom shortcut (Wayland) |
| Copy to clipboard and close | ⌘C | Ctrl+C |
| Save as PNG | ⌘S | Ctrl+S |
| Undo last drawing | ⌘Z | Ctrl+Z |
| Cancel | Esc | Esc |

You can also click **Capture** in the tray / menu bar icon.

Drag to select a region, then drag its edges or inside it to adjust. Pick a tool from the toolbar (pen, line, arrow, rectangle, marker, text) and a color, then draw inside the selection. Once something is drawn, clicking outside no longer starts a new selection. Press Esc to start over.

Saved files default to `~/Pictures/Snapit_YYYY-MM-DD_HH-MM-SS.png`. Images are saved at the screen's full resolution, so Retina captures come out at 2×.

Snapit starts at login. Turn this off with **Start at login** in the tray menu.

## Configuration

`config.json`, created on first launch:

- macOS: `~/Library/Application Support/com.snapit.app/config.json`
- Linux: `~/.config/com.snapit.app/config.json`

```json
{
  "hotkey": "CommandOrControl+Shift+2",
  "autostart_initialized": true
}
```

`hotkey` uses names like `F12`, `PrintScreen`, `CommandOrControl+Shift+S`. Restart Snapit after editing. If the key is already taken, Snapit shows an error at startup.

## Known limitations

- Unsigned builds: macOS shows the "Open Anyway" step, and the permission may need to be granted again after updates.
- Linux on Wayland: no built-in hotkey (see above). With several monitors, the overlay placement and the number of permission prompts depend on GNOME. See `docs/TESTING.md`.
- No upload, history, blur or Windows support (yet).

## Build from source

Requires Rust (stable) and Node 22+.

```sh
npm install --min-release-age=7
npm run tauri dev      # run
npm test               # TS unit tests
(cd src-tauri && cargo test)
npm run tauri build    # macOS: .app + .dmg, Linux: .deb + .AppImage
```

Linux build dependencies (Ubuntu):

```sh
sudo apt install build-essential curl libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
  librsvg2-dev libxdo-dev libssl-dev libpipewire-0.3-dev libclang-dev libxcb1-dev \
  libxrandr-dev libdbus-1-dev libgbm-dev
```

`dev/preview.html` (open `http://localhost:1420/dev/preview.html` while `npm run dev` runs) runs the editor in a normal browser on a fake screenshot, useful for UI work without screen-capture permission.

Manual test checklist: [docs/TESTING.md](docs/TESTING.md).
