# OIIA Spinning Cat Chrome Extension

For situations where a website is clearly missing one critical feature: a rotating 3D cat performing the ancient `oiiaioooooiai` ritual directly on top of the page.

This is a small Chrome extension that summons spinning cats on any regular website and plays the local meme soundtrack. Serious productivity tool? No. Cultural artifact? Absolutely.

## What It Does

- Adds a fullscreen transparent overlay to the current tab.
- Loads a local 3D cat model: `assets/oiiaioooooiai_cat.glb`.
- Plays the local audio file: `assets/W.mp3`.
- Spawns multiple cats across the screen.
- Spins them horizontally, because vertical chaos was too powerful.
- Keeps everything local. No CDN. No remote server. Just cat.

## Run Locally

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder.
5. Open any normal website.
6. Click the `OIIA Cat` extension button.
7. Watch the page achieve enlightenment.

Chrome blocks extensions on internal pages such as `chrome://extensions`, the Chrome Web Store, and some browser-managed pages. The cat respects browser law, reluctantly.

## Project Structure

```text
oiia-cat/
  assets/
    oiiaioooooiai_cat.glb
    W.mp3
  vendor/
    three.module.js
    GLTFLoader.js
    SkeletonUtils.js
    BufferGeometryUtils.js
  content.js
  manifest.json
  popup.html
  popup.css
  popup.js
  viewer.html
  viewer.js
```

## How It Works

The popup sends a toggle message to the active tab. `content.js` injects a transparent iframe into the page. Inside that iframe, `viewer.html` runs a Three.js scene from `viewer.js`, loads the `.glb` cat model, clones it a bunch of times, and spins everything like the internet intended.

The audio is played from the content script so it starts from the user's button click instead of being blocked by autoplay rules.

## Important Cat Notes

- If cats appear but do not move, reload the extension and refresh the page.
- If there is no sound, click the extension button again after interacting with the page.
- If the browser console mentions WebGL shader warnings, the cat is probably fine. Some drivers just like complaining.
- If your laptop fans become part of the soundtrack, reduce `CAT_COUNT` in `viewer.js`.

## Tuning

Open `viewer.js` and adjust:

- `CAT_COUNT` for more or fewer cats.
- `spinY` range for rotation speed.
- `baseScale` range for cat size.
- `camera.position` if the cats are too close or too far.

## Philosophy

Some extensions block ads.
Some extensions manage passwords.
This one answers a harder question:

> What if every website had more spinning cat?

