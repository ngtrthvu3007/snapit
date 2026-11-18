<script setup>
import { withBase } from "vitepress";
</script>

# Cách dùng

<video :src="withBase('/images/demo-vi.webm')" :poster="withBase('/images/draw-vi.png')" autoplay muted loop playsinline style="width:100%;border-radius:8px"></video>

## Chụp

1. Bấm phím chụp: <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>2</kbd> trên Mac, <kbd>PrintScreen</kbd> trên Linux (hoặc phím bạn đã gán). Bấm **Capture** trên icon menu bar cũng được.
2. Màn hình đứng hình và tối lại. Kéo chuột để chọn vùng; kéo cạnh hoặc góc để chỉnh, kéo bên trong để di chuyển. Góc trên ghi kích thước ảnh sẽ ra, tính theo pixel thật.

![Vừa kéo chọn vùng: ngoài vùng tối lại, viền nét đứt, nhãn kích thước, thanh công cụ ở dưới](/images/select-vi.png)

3. Chọn công cụ trên thanh công cụ rồi vẽ trong vùng chọn.

![Vùng chọn trên trang kế hoạch chuyến đi: khung đỏ quanh ngọn hải đăng, mũi tên, ghi chú, giờ 06:30 tô vàng](/images/draw-vi.png)

4. <kbd>⌘</kbd> <kbd>C</kbd> để copy (rồi dán đi đâu cũng được), hoặc <kbd>⌘</kbd> <kbd>S</kbd> để lưu file.

## Thanh công cụ

![Thanh công cụ của Snapit](/images/toolbar.png)

Từ trái sang: bút, đường thẳng, mũi tên, khung chữ nhật, bút dạ quang, gõ chữ · 8 màu và ô chọn màu tuỳ ý · undo, copy, lưu, đóng.

Bấm lại công cụ đang chọn để tắt nó; lúc đó kéo bên trong vùng chọn lại là di chuyển vùng.

**Gõ chữ:** chọn công cụ **T**, click vào chỗ cần gõ. <kbd>Enter</kbd> để chốt, <kbd>Shift</kbd> <kbd>Enter</kbd> để xuống dòng, <kbd>Esc</kbd> để bỏ.

## Phím tắt

| Việc | macOS | Linux |
|---|---|---|
| Copy vào clipboard (rồi đóng) | <kbd>⌘</kbd> <kbd>C</kbd> | <kbd>Ctrl</kbd> <kbd>C</kbd> |
| Lưu file PNG | <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> |
| Undo nét vừa vẽ | <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> |
| Huỷ, đóng màn chụp | <kbd>Esc</kbd> | <kbd>Esc</kbd> |

## Mấy điều nên biết

- Đã vẽ gì rồi thì click ra ngoài **không** xoá vùng chọn, khỏi lo mất công. Muốn chọn lại thì <kbd>Esc</kbd> rồi chụp lại.
- Ảnh ra đúng độ phân giải thật của màn hình: trên Retina, vùng 460 × 350 thành ảnh 920 × 700.
- Lưu mặc định vào `~/Pictures`, tên theo giờ chụp, ví dụ `Snapit_2026-11-18_09-05-07.png`.
- Bấm **Cancel** ở hộp thoại lưu thì quay lại màn chụp, hình vẽ vẫn còn nguyên.

## Đổi phím chụp

Icon menu bar → **Change hotkey…** → bấm tổ hợp phím mới → **Save**. Có hiệu lực ngay, không cần mở lại app.

![Cửa sổ Change hotkey đang hiện tổ hợp phím vừa bấm](/images/hotkey.png)

- Phím chữ hoặc số phải đi kèm <kbd>⌘</kbd>/<kbd>Ctrl</kbd>/<kbd>Alt</kbd>/<kbd>Shift</kbd>; riêng F1–F24 và PrintScreen dùng một mình được.
- Phím đã bị app khác chiếm thì Snapit báo và giữ phím cũ.
- Trên Wayland, cửa sổ này chỉ hướng dẫn gán phím trong cài đặt máy, như ở trang [Cài đặt](./cai-dat.md#gan-phim-chup-tren-wayland).

## Tự khởi động

Snapit tự chạy cùng máy, mặc định bật. Tắt hoặc bật lại ở icon menu bar → **Start at login**.

<small>Ảnh hải đăng trong ví dụ: Nick Diamantidis, Unsplash.</small>
