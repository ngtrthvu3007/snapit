use crate::hotkey::parse;

#[test]
fn parse_accepts_recorded_accelerators() {
    for accelerator in [
        "Command+Shift+Digit2",
        "Control+Alt+KeyS",
        "F12",
        "PrintScreen",
    ] {
        assert!(parse(accelerator).is_ok(), "{accelerator}");
    }
}

#[test]
fn parse_rejects_garbage_with_a_readable_error() {
    let message = parse("Nope+Q").unwrap_err();
    assert!(message.contains("Nope+Q"), "{message}");
}
