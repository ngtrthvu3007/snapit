use std::path::PathBuf;

use chrono::NaiveDate;
use tauri::ipc::InvokeBody;

use crate::output::{default_filename, png_body, with_png_extension};

#[test]
fn filename_format() {
    let time = NaiveDate::from_ymd_opt(2026, 11, 18).unwrap().and_hms_opt(9, 5, 7).unwrap();
    assert_eq!(default_filename(time), "Snapit_2026-11-18_09-05-07.png");
}

#[test]
fn png_extension_added_when_missing() {
    let cases = [
        ("/tmp/foo", "/tmp/foo.png"),
        ("/tmp/foo.png", "/tmp/foo.png"),
        ("/tmp/foo.PNG", "/tmp/foo.PNG"),
        ("/tmp/v1.2", "/tmp/v1.2.png"),
    ];
    for (input, expected) in cases {
        assert_eq!(with_png_extension(PathBuf::from(input)), PathBuf::from(expected));
    }
}

#[test]
fn png_body_accepts_raw_and_json_array() {
    assert_eq!(png_body(&InvokeBody::Raw(vec![1, 2, 3])).unwrap(), vec![1, 2, 3]);
    assert_eq!(png_body(&InvokeBody::Json(serde_json::json!([1, 2, 3]))).unwrap(), vec![1, 2, 3]);
    assert!(png_body(&InvokeBody::Json(serde_json::json!({ "bytes": 1 }))).is_err());
}
