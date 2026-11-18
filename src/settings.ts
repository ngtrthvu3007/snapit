// Cửa sổ "Change hotkey…": ghi lại tổ hợp phím mới cho phím chụp.
import { getCurrentWindow } from "@tauri-apps/api/window";
import { displayAccelerator, toAccelerator } from "./accelerator";
import { byId, CLASS, ID } from "./dom";
import { hotkeyInfo, setHotkey } from "./ipc";
import { hasModifier, IS_MAC, isModifierCode, KEY } from "./keyboard";

const MODIFIER_HINT = IS_MAC ? "⌘ ⌃ ⌥ ⇧" : "Ctrl, Alt, Shift or Super";

const MESSAGE = {
  idle: "Click the box and press a new shortcut.",
  recording: "Press the new shortcut…",
  needsModifier: `Letters, digits and Space need ${MODIFIER_HINT}. F-keys and PrintScreen work alone.`,
  ready: "Press Save to use it.",
} as const;

const closeWindow = () => getCurrentWindow().close();

const info = await hotkeyInfo();

if (info.global) {
  setUpRecorder(info.hotkey);
} else {
  showWaylandHelp();
}

function showWaylandHelp() {
  byId(ID.waylandSection).hidden = false;

  const closeButton = byId(ID.close);
  closeButton.addEventListener("click", closeWindow);
  closeButton.focus();
}

function setUpRecorder(currentHotkey: string) {
  const recorder = byId<HTMLButtonElement>(ID.recorder);
  const status = byId(ID.status);
  const saveButton = byId<HTMLButtonElement>(ID.save);

  let picked: string | null = null;

  const showStatus = (message: string, isError = false) => {
    status.textContent = message;
    status.classList.toggle(CLASS.error, isError);
  };

  byId(ID.recordSection).hidden = false;
  recorder.textContent = displayAccelerator(currentHotkey);
  showStatus(MESSAGE.idle);

  recorder.addEventListener("focus", () => {
    showStatus(picked ? MESSAGE.ready : MESSAGE.recording);
  });

  recorder.addEventListener("keydown", (event) => {
    const plain = !hasModifier(event);

    // giữ điều hướng bằng bàn phím
    if (plain && event.key === KEY.tab) {
      return;
    }

    event.preventDefault();

    if (plain && event.key === KEY.escape) {
      return closeWindow();
    }

    const accelerator = toAccelerator(event, IS_MAC);
    if (!accelerator) {
      // chỉ nhắc khi đã bấm phím thật (không nhắc lúc mới giữ ⌘/Shift…)
      if (!isModifierCode(event.code)) {
        showStatus(MESSAGE.needsModifier);
      }
      return;
    }

    picked = accelerator;
    recorder.textContent = displayAccelerator(accelerator);
    saveButton.disabled = false;
    showStatus(MESSAGE.ready);
  });

  saveButton.addEventListener("click", async () => {
    if (!picked) {
      return;
    }

    try {
      await setHotkey(picked);
      await closeWindow();
    } catch (error) {
      showStatus(String(error), true);
    }
  });

  byId(ID.cancel).addEventListener("click", closeWindow);

  recorder.focus();
}
