import { getCurrentWindow } from "@tauri-apps/api/window";
import { displayAccelerator, toAccelerator } from "./accelerator";
import { hotkeyInfo, setHotkey } from "./ipc";

const IS_MAC = navigator.platform.startsWith("Mac");
const MODIFIER_HINT = IS_MAC ? "⌘ ⌃ ⌥ ⇧" : "Ctrl, Alt, Shift or Super";
const TEXT = {
  idle: "Click the box and press a new shortcut.",
  recording: "Press the new shortcut…",
  needsModifier: `Letters, digits and Space need ${MODIFIER_HINT}. F-keys and PrintScreen work alone.`,
  ready: "Press Save to use it.",
} as const;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const close = () => getCurrentWindow().close();

const info = await hotkeyInfo();
if (info.global) setUpRecorder(info.hotkey);
else showWaylandHelp();

function showWaylandHelp() {
  byId("wayland").hidden = false;
  byId("close").addEventListener("click", close);
  byId("close").focus();
}

function setUpRecorder(current: string) {
  const recorder = byId<HTMLButtonElement>("recorder");
  const status = byId("status");
  const save = byId<HTMLButtonElement>("save");
  let picked: string | null = null;

  const say = (text: string, isError = false) => {
    status.textContent = text;
    status.classList.toggle("error", isError);
  };

  byId("record").hidden = false;
  recorder.textContent = displayAccelerator(current);
  say(TEXT.idle);
  recorder.addEventListener("focus", () => say(picked ? TEXT.ready : TEXT.recording));
  recorder.addEventListener("keydown", (e) => {
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
    if (plain && e.key === "Tab") return; // keep keyboard navigation
    e.preventDefault();
    if (plain && e.key === "Escape") return close();
    const accelerator = toAccelerator(e, IS_MAC);
    if (!accelerator) {
      if (plain || !/^(Shift|Control|Alt|Meta|OS)/.test(e.code)) say(TEXT.needsModifier);
      return;
    }
    picked = accelerator;
    recorder.textContent = displayAccelerator(accelerator);
    save.disabled = false;
    say(TEXT.ready);
  });

  save.addEventListener("click", async () => {
    if (!picked) return;
    try {
      await setHotkey(picked);
      await close();
    } catch (e) {
      say(String(e), true);
    }
  });
  byId("cancel").addEventListener("click", close);
  recorder.focus();
}
