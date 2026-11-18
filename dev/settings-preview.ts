// Chạy trang cài đặt hotkey trong trình duyệt thường, IPC giả lập (không cần Tauri).
// Mở http://localhost:1420/dev/settings-preview.html khi `npm run dev` đang chạy. Thêm ?wayland để xem nhánh Wayland.
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";

const TAKEN_HOTKEY = "Command+KeyQ";
const state = { hotkey: "CommandOrControl+Shift+Digit2", global: !location.search.includes("wayland") };

mockWindows("settings");
mockIPC((command, args) => {
  if (command === "hotkey_info") return { ...state };
  if (command === "set_hotkey") {
    const { hotkey } = args as { hotkey: string };
    if (hotkey === TAKEN_HOTKEY) throw "This shortcut is taken by another app or the system. Try another one.";
    state.hotkey = hotkey;
  }
});
(window as unknown as { snapitState: typeof state }).snapitState = state;

// trang thật đọc HTML từ settings.html
document.body.innerHTML = new DOMParser()
  .parseFromString(await (await fetch("/settings.html")).text(), "text/html").body.innerHTML;
await import("../src/settings");
