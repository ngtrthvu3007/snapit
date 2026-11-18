# Cài đặt

## Tải về

Bấm **Tải về** trên thanh trên cùng (trang Releases trên GitHub), rồi chọn đúng một file trong mục **Assets**:

| Máy | File |
|---|---|
| Mac (chip Apple hay Intel đều được, macOS 13 trở lên) | `Snapit_…_universal.dmg` |
| Ubuntu, Debian | `Snapit_…_amd64.deb` |
| Linux khác | `Snapit_…_amd64.AppImage` |

Không cần clone code hay cài thêm gì.

## macOS

1. Mở file `.dmg`, kéo Snapit vào **Applications**.
2. Lần đầu mở, macOS chặn vì app chưa ký. Vào **System Settings → Privacy & Security**, kéo xuống, bấm **Open Anyway**.
3. Bấm <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>2</kbd> một lần. macOS hỏi quyền **Screen Recording**: bật Snapit trong **Privacy & Security → Screen Recording**, rồi thoát Snapit (icon trên menu bar → **Quit**) và mở lại.

Xong. Từ giờ Snapit nằm trên menu bar và tự chạy khi mở máy.

::: tip Cài bản mới đè bản cũ
macOS có thể "quên" quyền chụp màn hình. Nếu chụp không được: vào lại **Screen Recording**, xoá Snapit (nút **−**), thêm lại, mở lại app.
:::

## Ubuntu / Debian

```sh
sudo apt install ./Snapit_*_amd64.deb
```

Hoặc double-click file `.deb`.

## Linux khác (AppImage)

```sh
chmod +x Snapit_*_amd64.AppImage
./Snapit_*_amd64.AppImage
```

## Gán phím chụp trên Wayland

Ubuntu mặc định chạy Wayland, mà Wayland không cho app tự giữ phím tắt. Gán tay một lần:

1. **Settings → Keyboard → View and Customize Shortcuts → Screenshots**: gỡ phím <kbd>Print</kbd> khỏi công cụ chụp của GNOME (hoặc chọn phím khác ở bước sau).
2. **Custom Shortcuts → +**: tên `Snapit`, phím <kbd>Print</kbd>, lệnh:

   ```sh
   snapit --capture
   ```

   Dùng AppImage thì ghi đường dẫn đầy đủ tới file, kèm `--capture` phía sau.
3. Lần đầu chụp GNOME có thể hỏi quyền, cứ cho phép.

Máy chạy X11 thì bỏ qua phần này, phím <kbd>PrintScreen</kbd> tự chạy. Không chắc máy chạy gì thì gõ `echo $XDG_SESSION_TYPE` trong Terminal.
