import { defineConfig, type DefaultTheme } from "vitepress";

// Workflow GitHub Pages điền các biến này (xem .github/workflows/pages.yml).
// Chạy local thì để trống: tài liệu nằm ở gốc, không có link ra ngoài.
const DOCS_BASE = process.env.DOCS_BASE ?? "/";
const SITE_URL = process.env.SITE_URL; // trang giới thiệu (web/index.html), địa chỉ đầy đủ
/** Đường dẫn trang giới thiệu khi chưa có SITE_URL: thư mục cha của tài liệu. */
const SITE_ROOT = SITE_URL ?? DOCS_BASE.replace(/docs\/$/, "");
const REPO_URL = process.env.REPO_URL;

/** Chữ hiển thị của một ngôn ngữ. Đường dẫn trang giống nhau, chỉ khác tiền tố. */
type Copy = {
  prefix: string;
  intro: string;
  download: string;
  install: string;
  usage: string;
  troubleshooting: string;
  technical: string;
  testing: string;
  useTheApp: string;
  changeTheCode: string;
  ui: Pick<
    DefaultTheme.Config,
    | "outline"
    | "docFooter"
    | "darkModeSwitchLabel"
    | "lightModeSwitchTitle"
    | "darkModeSwitchTitle"
    | "sidebarMenuLabel"
    | "returnToTopLabel"
    | "langMenuLabel"
    | "notFound"
  >;
};

const VI: Copy = {
  prefix: "/",
  intro: "Giới thiệu",
  download: "Tải về",
  install: "Cài đặt",
  usage: "Cách dùng",
  troubleshooting: "Gặp lỗi",
  technical: "Kỹ thuật",
  testing: "Checklist test tay",
  useTheApp: "Dùng app",
  changeTheCode: "Sửa code",
  ui: {
    outline: { label: "Trên trang này" },
    docFooter: { prev: "Trang trước", next: "Trang sau" },
    darkModeSwitchLabel: "Giao diện",
    lightModeSwitchTitle: "Chuyển sang sáng",
    darkModeSwitchTitle: "Chuyển sang tối",
    sidebarMenuLabel: "Mục lục",
    returnToTopLabel: "Lên đầu trang",
    langMenuLabel: "Ngôn ngữ",
    notFound: { title: "Không có trang này", quote: "", linkText: "Về trang tài liệu" },
  },
};

const EN: Copy = {
  prefix: "/en/",
  intro: "About",
  download: "Download",
  install: "Install",
  usage: "How to use",
  troubleshooting: "Troubleshooting",
  technical: "Technical notes",
  testing: "Manual test checklist",
  useTheApp: "Using the app",
  changeTheCode: "Working on the code",
  ui: {},
};

/** Trang tiếng Anh có tên file tiếng Anh. */
const PAGE = {
  install: { vi: "cai-dat", en: "install" },
  usage: { vi: "su-dung", en: "usage" },
  troubleshooting: { vi: "loi-thuong-gap", en: "troubleshooting" },
  technical: { vi: "technical", en: "technical" },
  testing: { vi: "testing", en: "testing" },
} as const;

function theme(copy: Copy, language: "vi" | "en"): DefaultTheme.Config {
  const link = (page: keyof typeof PAGE) => `${copy.prefix}${PAGE[page][language]}`;
  const home = language === "en" ? `${SITE_ROOT}?lang=en` : SITE_ROOT;
  // menu chỉ nhận link ngoài khi là địa chỉ đầy đủ; đường dẫn tương đối sẽ bị gắn thêm /docs/
  const introLink = SITE_URL ? home : undefined;

  return {
    // bấm "Snapit" góc trái là về trang giới thiệu
    logoLink: { link: home, target: "_self" },
    nav: [
      ...(introLink ? [{ text: copy.intro, link: introLink, target: "_self" }] : []),
      { text: copy.install, link: link("install") },
      { text: copy.usage, link: link("usage") },
      ...(REPO_URL ? [{ text: copy.download, link: `${REPO_URL}/releases/latest` }] : []),
    ],
    sidebar: [
      {
        text: copy.useTheApp,
        items: [
          { text: copy.install, link: link("install") },
          { text: copy.usage, link: link("usage") },
          { text: copy.troubleshooting, link: link("troubleshooting") },
        ],
      },
      {
        text: copy.changeTheCode,
        items: [
          { text: copy.technical, link: link("technical") },
          { text: copy.testing, link: link("testing") },
        ],
      },
    ],
    ...copy.ui,
  };
}

export default defineConfig({
  title: "Snapit",
  base: DOCS_BASE,
  srcExclude: ["superpowers/**"],

  locales: {
    root: {
      label: "Tiếng Việt",
      lang: "vi-VN",
      description: "Chụp màn hình kiểu Lightshot cho macOS và Linux",
      themeConfig: theme(VI, "vi"),
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      description: "A Lightshot-style screenshot tool for macOS and Linux",
      themeConfig: theme(EN, "en"),
    },
  },

  themeConfig: {
    socialLinks: REPO_URL ? [{ icon: "github", link: REPO_URL }] : [],
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "Tìm", buttonAriaLabel: "Tìm trong tài liệu" },
              modal: {
                noResultsText: "Không thấy kết quả cho",
                resetButtonTitle: "Xoá",
                footer: { selectText: "chọn", navigateText: "di chuyển", closeText: "đóng" },
              },
            },
          },
        },
      },
    },
  },
});
