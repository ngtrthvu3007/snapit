# Snapit

Tool chụp màn hình kiểu Lightshot cho macOS và Linux. Bấm phím, màn hình đứng hình, kéo chọn vùng, vẽ vời vài nét, rồi copy hoặc lưu. Hết.

## Cài đặt

Vào trang **Releases** của repo trên GitHub (`…/snapit/releases/latest`), tải đúng một file theo máy:

- Mac (chip Apple hay Intel đều được): `Snapit_…_universal.dmg`
- Ubuntu/Debian: `Snapit_…_amd64.deb`
- Linux khác: `Snapit_…_amd64.AppImage`

Không cần clone repo hay cài thêm gì khác.

### macOS (13 Ventura trở lên)

1. Mở file `Snapit_….dmg`, kéo Snapit vào **Applications**.
2. Lần đầu mở, macOS sẽ chặn vì app chưa ký. Vào **System Settings → Privacy & Security**, kéo xuống, bấm **Open Anyway**.
3. Bấm ⌘⇧2 một lần. macOS hỏi quyền **Screen Recording**: bật Snapit trong **Privacy & Security → Screen Recording**, rồi thoát Snapit (icon trên menu bar → Quit) và mở lại.

> Cài bản mới đè lên bản cũ thì macOS có thể "quên" quyền. Nếu chụp không được: vào lại Screen Recording, xoá Snapit (nút **−**), thêm lại, mở lại app.

### Ubuntu / Linux

```sh
sudo apt install ./Snapit_…_amd64.deb
```

Hoặc dùng bản AppImage, không cần cài:

```sh
chmod +x Snapit_…_amd64.AppImage
./Snapit_…_amd64.AppImage
```

**Ubuntu mặc định chạy Wayland**, mà Wayland không cho app tự giữ phím tắt. Bạn gán tay một lần:

1. **Settings → Keyboard → View and Customize Shortcuts → Screenshots**: gỡ phím **Print** khỏi công cụ chụp của GNOME (hoặc chọn phím khác ở bước sau).
2. **Custom Shortcuts → +**: tên `Snapit`, lệnh `snapit --capture` (AppImage thì ghi đường dẫn đầy đủ tới file, kèm `--capture` phía sau), phím **Print**.

Lần đầu chụp GNOME có thể hỏi quyền, cứ cho phép. Nếu máy chạy X11 thì không cần bước này, phím PrintScreen tự chạy.


## Cách dùng

1. Bấm phím chụp: **⌘⇧2** trên Mac, **PrintScreen** trên Linux (hoặc phím bạn đã gán). Bấm **Capture** trên icon tray cũng được.
2. Màn hình đứng hình và tối lại. Kéo chuột để chọn vùng; kéo cạnh/góc để chỉnh, kéo bên trong để di chuyển.
3. Chọn công cụ trên thanh công cụ rồi vẽ trong vùng chọn: bút, đường thẳng, mũi tên, khung chữ nhật, bút dạ quang, chữ. Có 8 màu sẵn + ô chọn màu tuỳ ý. Bấm lại công cụ đang chọn để tắt nó (lúc đó kéo bên trong lại là di chuyển vùng).
4. Copy hoặc lưu.

| Việc | macOS | Linux |
|---|---|---|
| Copy vào clipboard (rồi đóng) | ⌘C | Ctrl+C |
| Lưu file PNG | ⌘S | Ctrl+S |
| Undo nét vừa vẽ | ⌘Z | Ctrl+Z |
| Huỷ, đóng màn chụp | Esc | Esc |

Mấy điều nên biết:

- **Gõ chữ:** chọn công cụ **T**, click vào chỗ cần gõ. Enter để chốt, Shift+Enter để xuống dòng, Esc để bỏ.
- Đã vẽ gì rồi thì click ra ngoài **không** xoá vùng chọn, khỏi lo mất công. Muốn chọn lại thì Esc rồi chụp lại.
- Ảnh lưu ra đúng độ phân giải thật của màn hình (Retina là 2×). Mặc định lưu vào `~/Pictures` với tên `Snapit_năm-tháng-ngày_giờ-phút-giây.png`.
- Bấm Cancel ở hộp thoại lưu thì quay lại màn chụp, hình vẽ vẫn còn nguyên.

## Đổi phím chụp

Icon tray → **Change hotkey…** → bấm tổ hợp phím mới → **Save**. Có hiệu lực ngay, không cần mở lại app.

Phím chữ/số phải đi kèm ⌘/Ctrl/Alt/Shift; riêng F1–F24 và PrintScreen dùng một mình được. Phím đã bị app khác chiếm thì Snapit báo và giữ phím cũ.

Trên Wayland cửa sổ này chỉ hướng dẫn gán phím trong cài đặt GNOME (như phần cài đặt ở trên).

## Tự khởi động

Snapit tự chạy cùng máy, mặc định bật. Tắt/bật ở icon tray → **Start at login**.

## Gặp lỗi?

- **Bấm phím không có gì xảy ra:** xem icon Snapit có trên menu bar/tray không. Không có thì mở lại app. Trên Wayland thì kiểm tra lại phím đã gán ở Custom Shortcuts.
- **Báo thiếu quyền Screen Recording:** làm lại bước 3 phần cài đặt macOS.
- **Báo phím chụp bị chiếm lúc mở app:** đổi phím khác qua **Change hotkey…**.
- **Báo "Ignoring broken settings":** file cấu hình bị sửa sai cú pháp. Snapit vẫn chạy với cài đặt mặc định và không đụng vào file của bạn. Sửa lại file, hoặc xoá đi cho Snapit tạo mới:
  - macOS: `~/Library/Application Support/com.snapit.app/config.json`
  - Linux: `~/.config/com.snapit.app/config.json`

## Chưa có

Upload lấy link, lịch sử ảnh, làm mờ, Windows. Cần thì tính sau.

---

Sửa code? Đọc [tài liệu kỹ thuật](docs/technical.md).
