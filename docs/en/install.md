# Install

## Download

Hit **Download** in the top bar (it opens the Releases page on GitHub) and pick one file under **Assets**:

| Machine | File |
|---|---|
| Mac (Apple chip or Intel, macOS 13 or newer) | `Snapit_…_universal.dmg` |
| Ubuntu, Debian | `Snapit_…_amd64.deb` |
| Any other Linux | `Snapit_…_amd64.AppImage` |

No need to clone anything or install extra stuff.

## macOS

1. Open the `.dmg` and drag Snapit into **Applications**.
2. The first time you open it, macOS blocks it because the app isn't signed. Go to **System Settings → Privacy & Security**, scroll down, click **Open Anyway**.
3. Press <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>2</kbd> once. macOS asks for **Screen Recording**: switch Snapit on under **Privacy & Security → Screen Recording**, then quit Snapit (menu bar icon → **Quit**) and open it again.

That's it. Snapit now lives in the menu bar and starts with your Mac.

::: tip Installed a new version over the old one?
macOS sometimes "forgets" the screen permission. If captures stop working: go back to **Screen Recording**, remove Snapit (the **−** button), add it again, reopen the app.
:::

## Ubuntu / Debian

```sh
sudo apt install ./Snapit_*_amd64.deb
```

Or just double-click the `.deb`.

## Other Linux (AppImage)

```sh
chmod +x Snapit_*_amd64.AppImage
./Snapit_*_amd64.AppImage
```

## Setting the capture key on Wayland

Ubuntu runs Wayland by default, and Wayland doesn't let apps grab global shortcuts. You set it up once yourself:

1. **Settings → Keyboard → View and Customize Shortcuts → Screenshots**: take <kbd>Print</kbd> away from GNOME's own screenshot tool (or pick a different key in the next step).
2. **Custom Shortcuts → +**: name it `Snapit`, key <kbd>Print</kbd>, command:

   ```sh
   snapit --capture
   ```

   Using the AppImage? Put the full path to the file, followed by `--capture`.
3. The first capture may trigger a GNOME permission prompt. Allow it.

On X11 you can skip all this, <kbd>PrintScreen</kbd> just works. Not sure which one you're on? Run `echo $XDG_SESSION_TYPE` in a terminal.
