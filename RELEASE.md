# OIIA Cat Release Notes

Use this text for the GitHub Release description.

## Download

Download the release ZIP from the assets section:

```text
oiia-cat-extension.zip
```

Chrome does not allow normal one-click installation for unpacked extensions outside the Chrome Web Store. This release is installed manually through Developer Mode.

## Install in Chrome

1. Download `oiia-cat-extension.zip`.
2. Unzip it somewhere permanent, for example:

```text
C:\Users\YourName\Extensions\oiia-cat
```

3. Open Chrome and go to:

```text
chrome://extensions
```

4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped `oiia-cat` folder.
7. Open any normal website.
8. Click the `OIIA Cat` extension icon.
9. Press `Start`.

The cat ritual should now begin.

## Update

1. Download the new release ZIP.
2. Delete the old unzipped extension folder.
3. Unzip the new version into the same location.
4. Open `chrome://extensions`.
5. Click the reload button on `OIIA Spinning Cat`.

If Chrome says files are missing, remove the extension and load the new unzipped folder again.

## Remove

1. Open `chrome://extensions`.
2. Find `OIIA Spinning Cat`.
3. Click `Remove`.
4. Delete the unzipped folder if you no longer need it.

## Notes

- The extension does not run on Chrome internal pages like `chrome://extensions`.
- The extension is local and does not need a remote server.
- The music and 3D model are bundled in the ZIP.
- `GO RAVE` is off by default. Turn it on in the popup if you want visual rave effects.

## Files to Include in the ZIP

You can build the ZIP with:

```powershell
.\scripts\package-release.ps1
```

The output will be:

```text
dist\oiia-cat-extension.zip
```

Include:

```text
assets/
vendor/
content.js
manifest.json
popup.css
popup.html
popup.js
viewer.html
viewer.js
```

Do not include:

```text
.git/
node_modules/
```
