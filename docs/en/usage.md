<script setup>
import { withBase } from "vitepress";
</script>

# How to use

<video :src="withBase('/images/demo-en.webm')" :poster="withBase('/images/draw-en.png')" autoplay muted loop playsinline style="width:100%;border-radius:8px"></video>

## Taking a screenshot

1. Press the capture key: <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>2</kbd> on a Mac, <kbd>PrintScreen</kbd> on Linux (or whatever you set). Clicking **Capture** in the menu bar icon works too.
2. The screen freezes and dims. Drag to select an area; drag an edge or corner to adjust, drag inside to move it. The label on top shows the size of the image you'll get, in real pixels.

![A fresh selection: everything outside is dimmed, dashed border, size label, toolbar underneath](/images/select-en.png)

3. Pick a tool from the toolbar and draw inside the selection.

![The selection on a trip plan: a red box around the lighthouse, an arrow, a note, the 06:30 start highlighted](/images/draw-en.png)

4. <kbd>⌘</kbd> <kbd>C</kbd> to copy (then paste it anywhere), or <kbd>⌘</kbd> <kbd>S</kbd> to save a file.

## The toolbar

![Snapit's toolbar](/images/toolbar.png)

Left to right: pen, line, arrow, rectangle, highlighter, text · 8 colours plus a custom colour picker · undo, copy, save, close.

Click the active tool again to turn it off; dragging inside the selection then moves it again.

**Typing text:** pick **T**, click where you want it. <kbd>Enter</kbd> to place it, <kbd>Shift</kbd> <kbd>Enter</kbd> for a new line, <kbd>Esc</kbd> to drop it.

## Shortcuts

| What | macOS | Linux |
|---|---|---|
| Copy to clipboard (and close) | <kbd>⌘</kbd> <kbd>C</kbd> | <kbd>Ctrl</kbd> <kbd>C</kbd> |
| Save as PNG | <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> |
| Undo the last stroke | <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> |
| Cancel and close | <kbd>Esc</kbd> | <kbd>Esc</kbd> |

## Good to know

- Once you've drawn something, clicking outside **won't** throw your selection away. Want to start over? <kbd>Esc</kbd> and capture again.
- Images come out at your screen's real resolution: on a Retina screen, a 460 × 350 selection becomes a 920 × 700 image.
- Saves go to `~/Pictures` by default, named after the time, like `Snapit_2026-11-18_09-05-07.png`.
- Hit **Cancel** in the save dialog and you're back on the capture, drawings and all.

## Changing the capture key

Menu bar icon → **Change hotkey…** → press the new combination → **Save**. It works right away, no restart needed.

![The Change hotkey window showing the combination just pressed](/images/hotkey.png)

- Letters and numbers need a <kbd>⌘</kbd>/<kbd>Ctrl</kbd>/<kbd>Alt</kbd>/<kbd>Shift</kbd> with them; F1–F24 and PrintScreen work on their own.
- If another app already owns that key, Snapit tells you and keeps the old one.
- On Wayland this window just explains how to set the key in your system settings, same as on the [Install](./install.md#setting-the-capture-key-on-wayland) page.

## Start at login

Snapit starts with your computer, on by default. Toggle it from the menu bar icon → **Start at login**.

<small>Lighthouse photo in the examples: Nick Diamantidis, Unsplash.</small>
