# Snapit – Tài liệu kỹ thuật

Dành cho ai sắp đọc hoặc sửa code. Cách dùng app thì xem [README](../README.md).

## Tóm tắt

Tauri 2: phần Rust lo chụp màn hình, cửa sổ, phím tắt, clipboard, file; phần web (TypeScript thuần, không framework) lo vẽ và tương tác trên `<canvas>`.

App chỉ sống trên tray, không có cửa sổ chính. Mỗi lần chụp:

```
phím tắt / tray / `snapit --capture`
  → Rust chụp mọi màn hình (xcap), giữ PNG trong RAM
  → mở mỗi màn hình một cửa sổ overlay không viền, luôn trên cùng
  → trang overlay tải ảnh qua `shot://localhost/<số màn hình>`
  → người dùng chọn vùng + vẽ
  → web ghép ảnh cắt + hình vẽ ở độ phân giải thật → PNG
  → gửi PNG cho Rust: copy_png (clipboard) hoặc save_png (hộp thoại lưu)
  → Rust đóng overlay, giải phóng lần chụp
```

Vì sao "đóng băng rồi mới chọn" thay vì overlay trong suốt: cửa sổ trong suốt trên Linux rất hay lỗi, còn Wayland chỉ cho chụp qua portal. Chụp một lần rồi hiện ảnh tĩnh thì chạy giống nhau ở mọi nơi, và cũng là cách Lightshot làm.

## Cấu trúc code

```
src/                     trang web (overlay + cửa sổ đổi phím)
  main.ts                khởi động overlay, copy/lưu, phím tắt trong overlay
  editor.ts              trạng thái vùng chọn + hình vẽ, xử lý chuột
  renderer.ts            vẽ mọi thứ lên canvas
  geometry.ts            toán rect: chuẩn hoá, nắm cạnh, kéo, cắt
  shapes.ts              model hình vẽ + hàm vẽ từng công cụ
  text-input.ts          ô gõ chữ nổi trên canvas
  toolbar.ts             thanh công cụ + tính vị trí của nó
  export.ts              ghép ảnh xuất ở độ phân giải thật
  settings.ts            cửa sổ "Change hotkey…"
  accelerator.ts         phím bấm → chuỗi phím tắt kiểu "Command+Shift+Digit2"
  ipc.ts                 mọi lời gọi sang Rust (tên command nằm ở đây)
  keyboard.ts, dom.ts    tiện ích dùng chung
  notice.ts              báo lỗi ngay trong overlay
  constants.ts           mọi con số / màu / kích thước

src-tauri/src/
  lib.rs                 chỉ nối các phần lại (plugin, command, sự kiện)
  capture.rs             chụp màn hình, CaptureGuard, quyền macOS
  overlay.rs             mở/đóng/ẩn/hiện overlay, scheme shot://
  output.rs              copy_png, save_png
  hotkey.rs              phím tắt toàn cục, đổi phím lúc đang chạy
  settings.rs            cửa sổ đổi phím
  tray.rs                menu tray
  autostart.rs           tự khởi động cùng máy
  config.rs              đọc/ghi config.json
  dialog.rs              hộp thoại lỗi
  tests/                 unit test Rust

tests/                   unit test TypeScript (Vitest)
dev/                     trang chạy thử trong trình duyệt, không cần Tauri
docs/TESTING.md          checklist test tay trên máy thật
```

## Mấy chỗ cần biết trước khi sửa

- **CaptureGuard** chặn chụp chồng: giữ từ lúc bấm phím đến lúc overlay đóng. Mọi đường thoát (lỗi chụp, overlay không mở được, overlay bị Alt+F4, trang lỗi khi khởi động) đều phải gọi `release_capture`, không thì phím chụp "chết" tới khi mở lại app.
- **Nhãn overlay** là `overlay-<lần chụp>-<số màn hình>`. Số lần chụp để sự kiện "destroyed" đến muộn của lần trước không giải phóng nhầm lần mới. Trang đọc số màn hình ở đoạn cuối nhãn.
- **Độ phân giải:** ảnh trong RAM là pixel thật, toạ độ trên trang là CSS px. `editor.scale` (tách x/y, đọc trực tiếp vì cửa sổ có thể đổi cỡ sau khi hiện) đổi qua lại. Lúc xuất, gốc vùng cắt được làm tròn để ảnh không bị mờ ở scale 1.25×/1.5×.
- **Lỗi khi overlay đang hiện** phải báo trong overlay (`showNotice`), vì hộp thoại hệ thống nằm dưới overlay.
- **Lưu file:** Rust ẩn overlay → mở hộp thoại → lưu xong mới đóng; huỷ thì hiện lại overlay, hình vẽ còn nguyên.
- **macOS:** overlay đặt ở level 1000 để đè menu bar và Dock; app chạy kiểu Accessory nên không có icon Dock. Quyền Screen Recording gắn với chữ ký app, bản build chưa ký có thể mất quyền sau mỗi lần cài lại.
- **Wayland:** không có phím tắt toàn cục (người dùng tự gán `snapit --capture`), không tự đặt được vị trí cửa sổ (overlay dùng fullscreen trên builder để nhắm đúng màn hình). xcap gọi portal mỗi màn hình một lần, xem comment `ponytail:` trong `capture.rs`.
- **Bản dev không bao giờ đăng ký login item**, chỉ bản release mới tự khởi động.

## Config

`config.json` trong thư mục config của app (đường dẫn ở README):

```json
{ "hotkey": "CommandOrControl+Shift+2", "autostart_initialized": true }
```

- File chưa có → dùng mặc định (coi là lần chạy đầu: bật autostart).
- File sai cú pháp → báo lỗi, chạy với mặc định, **không** ghi đè file và không đụng autostart.
- `hotkey` theo cú pháp của plugin global-shortcut; cửa sổ "Change hotkey…" tự ghi giúp.

## Chạy dev

Cần Rust (stable) và Node 22+.

```sh
npm install --min-release-age=7
npm run tauri dev
```

Không có quyền Screen Recording (như máy công ty) thì vẫn làm UI được: chạy `npm run dev` rồi mở

- `http://localhost:1420/dev/preview.html`: editor overlay trên ảnh giả 2×
- `http://localhost:1420/dev/settings-preview.html`: cửa sổ đổi phím, backend giả; thêm `?wayland` để xem giao diện Wayland

Ubuntu cần thêm:

```sh
sudo apt install build-essential curl libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
  librsvg2-dev libxdo-dev libssl-dev libpipewire-0.3-dev libclang-dev libxcb1-dev \
  libxrandr-dev libdbus-1-dev libgbm-dev
```

## Test & format

```sh
npm test                         # TypeScript
(cd src-tauri && cargo test)     # Rust
npm run format                   # Prettier + rustfmt
```

Phần cần phần cứng thật (chụp, clipboard, nhiều màn hình, Wayland) nằm trong [TESTING.md](TESTING.md).

## Build bản cài

```sh
npm run tauri build
```

Ra file trong `src-tauri/target/release/bundle/`: `.dmg` khi build trên Mac, `.deb` + `.AppImage` khi build trên Linux. Muốn bản Mac chạy cả chip Intel thì thêm `--target universal-apple-darwin` (cần `rustup target add x86_64-apple-darwin`).

Không có CI, không ký số: tool dùng nội bộ, build tay rồi gửi file là đủ.

## Quy ước

- Hằng số có tên, không viết số/chuỗi trần trong logic (`constants.ts` hoặc `const` đầu file Rust).
- Tên biến đầy đủ, comment tiếng Việt ngắn gọn.
- Thêm package npm luôn kèm `--min-release-age=7` (quy định công ty). Crate Rust mới cũng chọn bản đã ra ít nhất 7 ngày.
- Chỗ cố tình làm đơn giản có giới hạn rõ ràng thì đánh dấu `ponytail:` kèm cách nâng cấp.
