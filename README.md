# Snapit

Tool chụp màn hình kiểu Lightshot cho macOS và Linux. Bấm phím, màn hình đứng hình, kéo chọn vùng, vẽ vài nét, rồi copy hoặc lưu.

*A Lightshot-style screenshot tool for macOS and Linux. Press a key, the screen freezes, drag a box, scribble on it, copy or save. English docs: [docs/en](docs/en/index.md).*

- **Tải về:** trang [Releases](../../releases/latest), chọn file cho máy bạn.
- **Hướng dẫn:** [Cài đặt](docs/cai-dat.md) · [Cách dùng](docs/su-dung.md) · [Gặp lỗi](docs/loi-thuong-gap.md)
- **Sửa code:** [Kỹ thuật](docs/technical.md) · [Checklist test tay](docs/testing.md)

Bản web của tài liệu (kèm trang giới thiệu) nằm trên GitHub Pages của repo này, link ở mục **About** bên phải.

## Chạy nhanh

```sh
npm install --min-release-age=7
npm run tauri dev      # chạy app
npm test               # test TypeScript
npm run docs:dev       # xem tài liệu
```
