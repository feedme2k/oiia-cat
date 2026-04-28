# OIIA Spinning Cat Chrome Extension

For situations where a website is clearly missing one critical feature: a rotating 3D cat performing the ancient `oiiaioooooiai` ritual directly on top of the page.

This is a small Chrome extension that summons spinning cats on any regular website and plays the local meme soundtrack. Serious productivity tool? No. Cultural artifact? Absolutely.

## What It Does

- Adds a fullscreen transparent overlay to the current tab.
- Loads a local 3D cat model: `assets/oiiaioooooiai_cat.glb`.
- Plays the local audio file: `assets/W.mp3`.
- Spawns multiple cats across the screen.
- Spins them horizontally, because vertical chaos was too powerful.
- Speeds up the spin on audio peaks from the meme soundtrack.
- Adds optional rave flashes, color washes, scanlines, and laser-ish beams on stronger audio moments.
- Lets you tune volume, cat count, spin intensity, and rave effect sensitivity from the extension popup.
- Keeps everything local. No CDN. No remote server. Just cat.

## Run Locally

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder.
5. Open any normal website.
6. Click the `OIIA Cat` extension button.
7. Adjust volume and cat count if the ritual is too weak or too strong.
8. Watch the page achieve enlightenment.

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

The extension also analyzes that audio with Web Audio and sends beat-like energy signals into the Three.js scene. Quiet intros keep the cats still, prelude-level energy starts a controlled spin, and only stronger drops snap them into maximum rotation. The same signal drives the rave overlay: flashes on beats, shifting color washes, scanlines, and moving light beams.

## Important Cat Notes

- If cats appear but do not move, reload the extension and refresh the page.
- If there is no sound, click the extension button again after interacting with the page.
- If the browser console mentions WebGL shader warnings, the cat is probably fine. Some drivers just like complaining.
- If your laptop fans become part of the soundtrack, reduce the cat count in the popup.
- Browser extensions cannot freely listen to all system audio or music from another tab. That requires explicit tab/screen capture permissions. This version reacts to its own local soundtrack.

## Tuning

Open `viewer.js` and adjust:

- `spinY` range for rotation speed.
- `targetSpinLevel`, `spinLevel`, `beatKick`, and `spinScale` in `viewer.js` for audio-reactive spin behavior.
- `baseScale` range for cat size.
- `camera.position` if the cats are too close or too far.

The popup currently supports:

- `Volume`: 0-100%.
- `Cats`: 1-80.
- `Spin`: 0-200% multiplier for audio-reactive rotation.
- `GO RAVE`: enables visual rave effects. Off by default.
- `Rave`: 0-100% sensitivity for flashes and color changes. Low values react only to major drops, high values react to quieter beat/onset changes while staying synced to the music.

## Philosophy

Some extensions block ads.
Some extensions manage passwords.
This one answers a harder question:

> What if every website had more spinning cat?
