// Ẩn cửa sổ console thừa trên Windows ở bản release, KHÔNG XOÁ
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    snapit_lib::run()
}
