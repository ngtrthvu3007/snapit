# Snapit — Design

Date: 2026-11-18
Status: awaiting approval

## Intent

A Lightshot-style screenshot tool for **macOS and Linux**, built with Tauri. v1 audience: the owner and a few technical friends (not public distribution).

Why: the owner uses Lightshot daily, but Lightshot is poor on macOS/Linux, and macOS's Cmd+Shift+4 lacks Lightshot's "select, annotate in place, copy" flow. Snapit is not a full Lightshot clone; it must cover the core flow well enough for everyday use.

## Goals

1. Trigger capture with a hotkey (or tray menu).
2. Screen freezes; user drags to select a region (size shown live); region can be moved/resized after.
3. Annotate in place on the selection: pen, line, arrow, rectangle, marker (semi-transparent highlight), text. Color picker (small fixed palette + custom). Undo (Cmd/Ctrl+Z).
4. Output: Cmd/Ctrl+C copies PNG to clipboard and closes; Cmd/Ctrl+S opens a save dialog (default `~/Pictures`, filename `Snapit_YYYY-MM-DD_HH-MM-SS.png`) and closes; Esc cancels. A small toolbar next to the selection exposes the same actions with the mouse.
5. Runs in the background with a tray / menu-bar icon (Capture, Start at login ✓, Quit).
6a. Autostart: enabled by default on first launch (`tauri-plugin-autostart`: macOS Login Item, Linux `~/.config/autostart/*.desktop`); toggle in tray menu, state persisted.
6. Output is at native (physical-pixel) resolution on HiDPI/Retina screens.
7. Works on: macOS 13+, Linux **GNOME on Wayland (Ubuntu 26.04 — primary Linux target)**, Linux X11 best-effort (see Platform targets).
8. Multi-monitor: user can capture on whichever monitor they choose. A selection spanning two monitors is not required.

## Non-goals (v1)

Upload / share link, "search similar images", print, capture history, scrolling capture, screen recording, blur/pixelate, settings UI beyond hotkey, Windows support, code signing / notarization, CI release pipeline, auto-update. Add later if asked (signing + CI + updates become relevant if Snapit goes public).

## Anti-goals

- Slower than Lightshot to go from hotkey to frozen overlay (target: overlay visible < ~300 ms on mac/X11; on Wayland the portal adds its own latency, accept it).
- Blurry output on Retina/HiDPI.
- Clipboard that silently ends up empty after copy.
- Needing a terminal to use day-to-day (except the one-time Wayland hotkey setup, documented).

## Constraints

- macOS: requires Screen Recording permission. On first capture without it, show a clear message explaining how to grant it (System Settings → Privacy & Security → Screen Recording) instead of failing silently. Unsigned dev builds lose the permission on rebuild — expected during development.
- Wayland: apps cannot grab the screen or register global hotkeys directly, and cannot position windows.
  - Capture goes through xdg-desktop-portal (Screenshot). GNOME may show a permission dialog; this is acceptable.
  - Hotkey: app supports `snapit --capture` (via single-instance: a second launch forwards to the running instance). README documents binding it in GNOME Settings → Keyboard → Custom Shortcuts. Using the GlobalShortcuts portal is a later improvement, not v1.
- Linux tray: Ubuntu ships the AppIndicator extension, so tray works there; other GNOME distros may not show it — acceptable, `--capture` still works.
- Clipboard on Linux is owned by the process; Snapit keeps running in the tray, so copied images stay available.
- Toolchain on the dev Mac: Rust 1.100, Node 26, pnpm. New dependencies must be published ≥ 7 days ago (`--min-release-age=7` for npm-family installs).

## Approaches considered

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| **A** | **Freeze-then-select**: Rust captures full screen(s) instantly → borderless fullscreen always-on-top window shows the frozen image with a dark mask → select + annotate on canvas → export | Matches Lightshot; no real window transparency needed (the most fragile thing on Linux); on Wayland only one portal call. Multi-monitor overlay placement on Wayland needs verification | **Chosen** |
| B | Use OS region picker (`screencapture -i`, portal interactive) then open a separate editor window | Simple and robust, but loses "annotate in place" — the reason for the project | Rejected |
| C | Live transparent overlay over the real desktop | Doesn't work on Wayland, flaky transparency on Linux | Rejected |

## Design (approach A)

**Rust side (Tauri 2)**
- Capture: `xcap` crate (macOS, X11, Wayland). Capture each monitor as an RGBA image at physical resolution, keep in memory (no temp files needed).
- Overlay: one borderless, always-on-top, fullscreen window per monitor, each showing that monitor's frozen image. On macOS it must appear above fullscreen apps and the menu bar.
- Hotkey: `tauri-plugin-global-shortcut` on macOS and X11, default `PrintScreen` (macOS laptops lack it, so mac default `Cmd+Shift+2` — builder may adjust if it collides). Hotkey stored in a small config file; editing it by hand is fine for v1.
- `--capture` CLI flag + `tauri-plugin-single-instance` on all platforms.
- Tray: Capture / Quit.
- Copy: clipboard image write (via `tauri-plugin-clipboard-manager` or `arboard`; must verify it works on GNOME Wayland). Save: `tauri-plugin-dialog` save dialog, PNG encoding.

**Web side**
- Vanilla TypeScript + Vite + `<canvas>`, no UI framework.
- Layers: frozen image → dark mask with selection cut out → annotations → selection handles + toolbar.
- Annotations kept as a list of shapes (for undo); final image = crop of frozen image at physical pixels + shapes rendered scaled to physical pixels.
- After selecting, the user can still move/resize the selection; annotations stay where they were drawn on screen.

**Packaging**
- macOS: `.dmg` (unsigned / ad-hoc). Linux: `.deb` + AppImage. Built manually by the owner.
- README covers: opening an unsigned app on macOS (System Settings → Open Anyway), granting Screen Recording (and re-granting after updates), binding `snapit --capture` to a key in GNOME Wayland.

## Known risks (verify early with a spike)

1. Overlay placement per monitor on GNOME Wayland (cannot set window position; fullscreen-on-monitor behavior must be tested).
2. Portal screenshot permission behavior on GNOME 50 for a non-Flatpak app (dialog every time vs. remembered).
3. Image clipboard on GNOME Wayland from a Tauri app.
4. macOS overlay above fullscreen Spaces.

None of these block v1; each becomes a documented limitation if it can't be solved (designer's call):
- (1) fails → on Wayland, overlay only the primary monitor.
- (2) non-interactive portal capture denied → fall back to the portal's interactive mode (GNOME's own picker), then open the Snapit overlay on the result.
- (3) → write the clipboard while the overlay window still has focus, then hide (not destroy) the window; process stays alive in tray. If still unreliable, Ctrl+C also saves to `~/Pictures` and shows a notice.
- (4) fails → ship with "doesn't cover fullscreen apps" limitation.

## Platform targets (designer's call)

- macOS minimum **13 (Ventura)** — ScreenCaptureKit path, covers Apple Silicon + late Intel Macs.
- Linux primary: **Ubuntu 26.04, GNOME, Wayland** (tested on the owner's laptop).
- Linux X11: **best-effort**, smoke-tested on Ubuntu 24.04 Xorg session if available; not a release gate.

## Left to the builder

Exact palette colors, toolbar layout/icons, stroke widths, config file location/format, crate versions, project layout, how to test on Linux (VM or the owner's Ubuntu laptop).
