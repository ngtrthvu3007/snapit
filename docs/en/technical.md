# Snapit – technical notes

For whoever's about to read or change the code. For using the app, see [How to use](./usage.md).

## The short version

Tauri 2: the Rust side handles screen capture, windows, shortcuts, clipboard and files; the web side (plain TypeScript, no framework) handles drawing and interaction on a `<canvas>`.

The app only lives in the tray, there's no main window. Each capture goes like this:

```
shortcut / tray / `snapit --capture`
  → Rust captures every monitor (xcap) and keeps the PNGs in memory
  → one borderless, always-on-top overlay window per monitor
  → the overlay page loads its image from `shot://localhost/<monitor>`
  → the user selects and draws
  → the web side combines crop + drawings at real resolution → PNG
  → the PNG goes to Rust: copy_png (clipboard) or save_png (save dialog)
  → Rust closes the overlays and releases the capture
```

Why "freeze first, then select" instead of a transparent overlay: transparent windows are flaky on Linux, and Wayland only lets you capture through a portal. Capturing once and showing a still image behaves the same everywhere, and it's what Lightshot does too.

## Code layout

```
src/                     web pages (overlay + Change hotkey window)
  main.ts                overlay startup, copy/save, overlay shortcuts
  editor.ts              selection + drawings state, pointer handling
  renderer.ts            draws everything onto the canvas
  geometry.ts            rect maths: normalise, grab edges, drag, clip
  shapes.ts              shape model + one draw function per tool
  text-input.ts          the text box floating over the canvas
  toolbar.ts             toolbar + where it goes
  export.ts              builds the exported image at real resolution
  settings.ts            the "Change hotkey…" window
  accelerator.ts         key press → shortcut string like "Command+Shift+Digit2"
  ipc.ts                 every call into Rust (command names live here)
  keyboard.ts, dom.ts    shared helpers
  notice.ts              error messages inside the overlay
  constants.ts           every number / colour / size

src-tauri/src/
  lib.rs                 only wires things together (plugins, commands, events)
  capture.rs             screen capture, CaptureGuard, macOS permission
  overlay.rs             open/close/hide/show overlays, the shot:// scheme
  output.rs              copy_png, save_png
  hotkey.rs              global shortcut, changing it at runtime
  settings.rs            the Change hotkey window
  tray.rs                tray menu
  autostart.rs           start at login
  config.rs              read/write config.json
  dialog.rs              error dialogs
  tests/                 Rust unit tests

tests/                   TypeScript unit tests (Vitest)
dev/                     browser-only preview pages, no Tauri needed
docs/                    these docs (VitePress); testing.md is the manual checklist
web/index.html           the hand-written landing page
```

## Things to know before you change stuff

- **CaptureGuard** stops captures from stacking: it's held from the key press until the overlays close. Every way out (capture error, overlay failing to open, an overlay killed with Alt+F4, the page failing at startup) must call `release_capture`, or the capture key "dies" until the app restarts.
- **Overlay labels** are `overlay-<capture number>-<monitor>`. The capture number keeps a late "destroyed" event from the previous capture from releasing the new one. The page reads its monitor from the last part of the label.
- **Resolution:** images in memory are real pixels, page coordinates are CSS px. `editor.scale` (separate x/y, read live because the window can resize after showing) converts between them. On export the crop origin is rounded so images stay sharp at 1.25× / 1.5×.
- **Errors while an overlay is up** go into the overlay (`showNotice`), because system dialogs sit underneath it.
- **Saving:** Rust hides the overlays → opens the dialog → only closes them once the file is written; cancel brings them back with the drawings intact.
- **macOS:** overlays sit at window level 1000 to cover the menu bar and Dock; the app runs as an Accessory, so no Dock icon. Screen Recording permission is tied to the app's signature, so unsigned builds can lose it after reinstalling.
- **Wayland:** no global shortcuts (users bind `snapit --capture` themselves), and apps can't position windows (overlays use fullscreen on the builder to hit the right monitor). xcap calls the portal once per monitor, see the `ponytail:` comment in `capture.rs`.
- **Dev builds never register a login item**, only release builds start at login.

## Config

`config.json` in the app's config folder (paths are on the [Troubleshooting](./troubleshooting.md) page):

```json
{ "hotkey": "CommandOrControl+Shift+2", "autostart_initialized": true }
```

- No file yet → defaults (treated as the first launch: autostart gets turned on).
- File with a typo → error message, runs with defaults, does **not** overwrite the file or touch autostart.
- `hotkey` uses the global-shortcut plugin's syntax; the "Change hotkey…" window writes it for you.

## Running it locally

You need Rust (stable) and Node 22+.

```sh
npm install --min-release-age=7
npm run tauri dev
```

No Screen Recording permission (like on the company Mac)? You can still work on the UI: run `npm run dev` and open

- `http://localhost:1420/dev/preview.html`: the overlay editor on a fake 2× screenshot (add `?image=<path>` to use a real picture as the screen)
- `http://localhost:1420/dev/settings-preview.html`: the Change hotkey window with a fake backend; add `?wayland` for the Wayland view

Ubuntu also needs:

```sh
sudo apt install build-essential curl libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
  librsvg2-dev libxdo-dev libssl-dev libpipewire-0.3-dev libclang-dev libxcb1-dev \
  libxrandr-dev libdbus-1-dev libgbm-dev
```

## Tests & formatting

```sh
npm test                         # TypeScript
(cd src-tauri && cargo test)     # Rust
npm run format                   # Prettier + rustfmt
```

What needs real hardware (capture, clipboard, several monitors, Wayland) is in the [manual test checklist](./testing.md).

## Shipping a release

GitHub Actions does it all (`.github/workflows/release.yml`):

```sh
npm version 0.2.0          # bumps package.json + creates tag v0.2.0
git push --follow-tags     # pushes code + tag
```

About 10–15 minutes later the Releases page has `v0.2.0` with a `.dmg` (universal), `.deb` and `.AppImage`. People download it themselves, nobody has to ping you.

- The version only lives in `package.json` (`tauri.conf.json` points at it).
- The Mac build is ad-hoc signed (`signingIdentity: "-"`): free, and avoids "app is damaged" on downloads; users still click "Open Anyway" the first time. Getting rid of that needs an Apple Developer ID ($99/year).
- The workflow runs `npm test` first; red tests, no release.
- Private repo: macOS build minutes count 10×, so a release costs roughly 100–200 of the 2,000 free minutes a month.

Building by hand (to try an installer):

```sh
npm run tauri build                                     # for the machine you're on
npm run tauri build -- --target universal-apple-darwin  # Mac build that also runs on Intel
```

Output lands in `src-tauri/target/…/release/bundle/`. The universal build needs `rustup target add aarch64-apple-darwin x86_64-apple-darwin`.

## Docs & landing page

- The docs are `.md` files in `docs/` (Vietnamese) and `docs/en/` (English), rendered by VitePress. Change a page, change it in both languages.
- The landing page is `web/index.html`, hand-written, no build step; the English copy lives in the script at the bottom of the file.
- Doc images live in `docs/public/images/`, captured from `dev/preview.html?image=…` (the real Snapit UI over a backdrop picture).
- Preview: `npm run docs:dev`; for the landing page just open `web/index.html`.
- Pushing to `main` makes `.github/workflows/pages.yml` build both and publish them to GitHub Pages: landing page at the root, docs under `/docs/`. The first time, turn on **Settings → Pages → Source: GitHub Actions** in the repo.

## Conventions

- Named constants, no bare numbers/strings in logic (`constants.ts`, or a `const` at the top of the Rust file).
- Full variable names; short code comments (in Vietnamese).
- Always add npm packages with `--min-release-age=7` (company rule). New Rust crates should also be at least 7 days old.
- Deliberate shortcuts with a known limit get a `ponytail:` comment saying how to upgrade them.
