# Troubleshooting

## I press the capture key and nothing happens

Check that the Snapit icon is in the menu bar or tray. If it isn't, open the app again. On Wayland, double-check the key under **Custom Shortcuts** (see [Install](./install.md#setting-the-capture-key-on-wayland)).

## It says Screen Recording permission is missing

Go to **System Settings → Privacy & Security → Screen Recording**, switch Snapit on, then quit it (menu bar → **Quit**) and open it again.

## After updating, captures stopped working

macOS tends to "forget" the permission when the app gets replaced. In **Screen Recording**, remove Snapit with the **−** button, add it back, reopen the app.

## macOS says "Snapit is damaged"

You shouldn't see this with a download from the Releases page. If you do, run this in Terminal and open the app again:

```sh
xattr -cr /Applications/Snapit.app
```

## It says the capture key is taken when the app starts

Some other app already owns that key. Pick another one from the menu bar → **Change hotkey…**

## It says "Ignoring broken settings"

The settings file got edited and has a typo. Snapit still runs with the defaults and leaves your file alone. Fix the file, or delete it and Snapit makes a fresh one:

- macOS: `~/Library/Application Support/com.snapit.app/config.json`
- Linux: `~/.config/com.snapit.app/config.json`

## Is there a Windows version, or upload-and-share links?

Not yet. Snapit keeps it small: capture, draw, copy, save. If you need more, open an issue on GitHub.
