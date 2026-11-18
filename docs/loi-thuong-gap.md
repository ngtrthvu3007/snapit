# Gặp lỗi

## Bấm phím chụp mà không có gì xảy ra

Xem icon Snapit có trên menu bar hoặc tray không. Không có thì mở lại app. Trên Wayland, kiểm tra phím đã gán ở **Custom Shortcuts** (xem [Cài đặt](./cai-dat.md#gan-phim-chup-tren-wayland)).

## Báo thiếu quyền Screen Recording

Vào **System Settings → Privacy & Security → Screen Recording**, bật Snapit, rồi thoát (menu bar → **Quit**) và mở lại app.

## Cài bản mới xong thì không chụp được nữa

macOS hay "quên" quyền khi app được thay. Trong **Screen Recording**, xoá Snapit bằng nút **−**, thêm lại, mở lại app.

## macOS báo "Snapit is damaged"

Không nên gặp với bản tải từ trang Releases. Nếu gặp, chạy lệnh này trong Terminal rồi mở lại app:

```sh
xattr -cr /Applications/Snapit.app
```

## Báo phím chụp bị chiếm lúc mở app

Phím đó đang thuộc về app khác. Chọn phím khác qua menu bar → **Change hotkey…**

## Báo "Ignoring broken settings"

File cài đặt bị sửa sai cú pháp. Snapit vẫn chạy với cài đặt mặc định và không đụng vào file. Sửa lại file, hoặc xoá đi cho Snapit tạo mới:

- macOS: `~/Library/Application Support/com.snapit.app/config.json`
- Linux: `~/.config/com.snapit.app/config.json`

## Có bản Windows, upload lấy link không?

Chưa. Snapit giữ gọn: chụp, vẽ, copy, lưu. Cần thêm thì mở issue trên GitHub.
