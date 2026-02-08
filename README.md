# rvfc-legacy-polyfill

Legacy `HTMLVideoElement.requestVideoFrameCallback` polyfill using `requestAnimationFrame` + `video.currentTime`.

## What it does

* Adds `requestVideoFrameCallback` / `cancelVideoFrameCallback` **only if** the browser does not provide native RVFC.
* Uses frame counters when available (`getVideoPlaybackQuality`, `webkitDecodedFrameCount`, `mozPresentedFrames/mozPaintedFrames`) to detect new presented frames more reliably.
* Falls back to `currentTime` changes when counters are not available.
* Reports `mediaTime` as `video.currentTime` (no RAF-based drift correction).

## Install

```bash
npm i rvfc-legacy-polyfill
```

## Usage

Import once at startup (side-effect import):

```js
import "rvfc-legacy-polyfill";
```

Or in CommonJS:

```js
require("rvfc-legacy-polyfill");
```

## Notes / Accuracy

This polyfill runs on `requestAnimationFrame`, so timestamps are **window-framerate-bound** and not decoder-accurate. It may:

* introduce jitter,
* miss frames when video FPS > display FPS,
* report renderer-aligned timestamps (not true decode timestamps).

## Compatibility

This package ships as plain JS (no build step). If your target browser requires transpilation/polyfills, **your app/bundler must provide them**.

## License

Apache-2.0
