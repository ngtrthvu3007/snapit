use crate::capture::{CaptureGuard, Shot, require_monitors};

#[test]
fn guard_rejects_second_capture_until_end() {
    let guard = CaptureGuard::default();
    assert!(guard.try_begin());
    assert!(!guard.try_begin());
    guard.end();
    assert!(guard.try_begin());
}

#[test]
fn no_monitors_is_an_error() {
    // nếu không, không overlay nào mở và lần chụp không bao giờ được giải phóng
    assert!(require_monitors(Vec::new()).is_err());
    let one_monitor = vec![Shot {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        png: Vec::new(),
    }];
    assert_eq!(require_monitors(one_monitor).unwrap().len(), 1);
}
