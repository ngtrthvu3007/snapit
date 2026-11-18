# Checklist test tay

Những thứ test tự động không với tới được. Chạy trên Mac có quyền Screen Recording (không phải máy công ty) và Ubuntu (GNOME, Wayland), bằng `npm run tauri dev`. Log ở terminal có dòng `captured N monitor(s) in …` và mọi lỗi dạng `error: …`.

Đã kiểm trên máy công ty (chỉ qua log, vì không chụp được): `--capture`, chạy lần hai chuyển sang instance đang chạy, ⌘⇧2, autostart, config hỏng. Cửa sổ đổi phím đã thử trong trình duyệt với backend giả.

## Ubuntu: build lần đầu

Code riêng cho Linux **chưa từng được compile**. Lần ra bản đầu tiên trên GitHub Actions sẽ biết ngay; hoặc cài gói theo [Kỹ thuật](./technical.md#chạy-dev) rồi chạy trên laptop.

## Chụp & overlay

- [ ] Icon tray hiện (menu bar Mac / thanh trên GNOME); Mac không có icon Dock.
- [ ] Mac chưa cấp quyền: bấm chụp → macOS hỏi quyền + Snapit hiện hộp thoại hướng dẫn.
- [ ] Chụp → màn hình đứng hình, nét căng trên Retina/HiDPI, không chớp đen.
- [ ] Từ lúc bấm phím tới lúc thấy overlay: cảm giác dưới 0,3 giây trên Mac.
- [ ] Mac: overlay đè cả menu bar, Dock, và app đang fullscreen.
- [ ] Esc đóng; chụp lại được ngay. Bấm chụp lúc overlay đang mở → không có gì xảy ra.
- [ ] Tray → Capture: menu tray đang tắt dần không lọt vào ảnh.
- [ ] Nhiều màn hình: mỗi màn hình một overlay, đúng ảnh của nó. Kéo ngay trên màn hình chưa focus → chọn vùng luôn, không cần click trước.
- [ ] Alt+F4 overlay (Linux) → phím chụp vẫn dùng lại được.
- [ ] Mac: bấm ⌘H / ⌘Q lúc overlay đang mở → ghi lại chuyện gì xảy ra.
- [ ] **Wayland:** có hộp thoại xin quyền không? Mỗi lần chụp hay chỉ lần đầu? 2 màn hình thì hỏi 2 lần?
- [ ] **Wayland:** overlay có nằm đúng màn hình không? Có lệch so với con trỏ khi vẽ không?

## Copy & lưu

- [ ] ⌘C / Ctrl+C → overlay đóng; dán vào Preview (File → New from Clipboard) / GIMP / LibreOffice thấy đúng vùng cắt kèm hình vẽ.
- [ ] Ảnh dán ra đúng số pixel ghi trên nhãn kích thước (Retina là 2×).
- [ ] Đang gõ chữ dở mà bấm copy → chữ vẫn có trong ảnh.
- [ ] ⌘S / Ctrl+S → hộp thoại mở ở `~/Pictures`, tên `Snapit_….png`; file mở được.
- [ ] Cancel ở hộp thoại lưu → quay lại overlay, hình vẽ còn nguyên. Bấm phím chụp lúc hộp thoại đang mở → không có gì.
- [ ] Gõ tên `foo` không đuôi → lưu thành `foo.png`.
- [ ] Nút copy/lưu trên toolbar chạy giống phím tắt.
- [ ] Ubuntu scale 1.25× / 1.5× → ảnh không mờ, kích thước khớp nhãn.
- [ ] **Wayland:** copy xong, overlay đóng rồi vẫn dán được sang app khác. Không được thì báo lại để làm phương án dự phòng (copy kiêm lưu file).

## Phím tắt

- [ ] Linux X11: PrintScreen chụp được. Nếu desktop đã giữ phím này → Snapit báo lỗi lúc mở app.
- [ ] **Wayland:** gán `snapit --capture` vào Print trong Custom Shortcuts (bản dev: đường dẫn `…/src-tauri/target/debug/snapit --capture`) → bấm là chụp.
- [ ] Tray → Change hotkey… mở cửa sổ ở trên cùng (kể cả khi đang dùng app khác).
- [ ] Cửa sổ đang mở → bấm phím chụp cũ không chụp.
- [ ] Save phím mới → dùng được ngay, phím cũ hết tác dụng, mở lại app vẫn giữ.
- [ ] Cancel / đóng cửa sổ → phím cũ dùng lại được.
- [ ] Chọn phím app khác đang chiếm → báo lỗi đỏ, đóng cửa sổ thì phím cũ vẫn chạy.
- [ ] **Wayland:** cửa sổ hiện hướng dẫn GNOME thay cho ô ghi phím.

## Tự khởi động (bản release)

- [ ] Dấu check "Start at login" khớp thực tế; tắt/bật thì login item mất/có.
- [ ] Đăng xuất / đăng nhập lại → Snapit có sẵn trên tray.
- [ ] Mở lần đầu từ DMG đang mount, sau đó chép vào Applications rồi mở lại → login item trỏ về `/Applications`.
- [ ] **Ubuntu:** `~/.config/autostart/Snapit.desktop` có/mất theo nút bật/tắt.

## Bản cài

- [ ] Lần ra bản đầu tiên trên GitHub Actions: cả job Mac lẫn Linux đều xanh (Linux là lần compile đầu tiên của code Linux).
- [ ] Tải `.dmg` từ Releases về Mac cá nhân, cài đúng theo trang [Cài đặt](./cai-dat.md): không bị báo "damaged", chỉ cần "Open Anyway".
- [ ] Tải `.deb` / `.AppImage` về Ubuntu, cài và chạy được.
