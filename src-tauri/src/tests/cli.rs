use crate::wants_capture;

#[test]
fn capture_flag_detected() {
    assert!(wants_capture(&["snapit", "--capture"]));
    assert!(!wants_capture(&["snapit"]));
}
