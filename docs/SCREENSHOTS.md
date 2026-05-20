# Screenshot Refresh Guide

Miniverto keeps README screenshots in `docs/assets/`. These images should use English UI text and English demo data so GitHub visitors can understand the product flow without translation.

## Assets

- `docs/assets/hero-dashboard.png`: project dashboard.
- `docs/assets/project-detail.png`: project detail and plan tree.
- `docs/assets/learning-workspace.png`: task learning workspace.
- `docs/assets/miniverto-demo.gif`: 30-second README and launch preview generated from the screenshot set.
- `docs/assets/product-loop.svg`: product loop diagram.
- `docs/assets/local-first-architecture.svg`: architecture diagram.

The SVG diagrams are already English-first. The three PNG screenshots are the ones that usually need recapturing after UI or demo-data changes.

## Capture Setup

Use the web app for screenshot capture because it is faster and deterministic:

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Before capturing, clear stored app state and force English:

```js
localStorage.clear()
localStorage.setItem('i18nextLng', 'en-US')
```

Capture the app at `1280x720` so the README images stay consistent.

## Capture Targets

- Dashboard: `http://127.0.0.1:5173/`
- Project detail: `http://127.0.0.1:5173/project/1`
- Learning workspace: `http://127.0.0.1:5173/project/1/task/t3/learn`

Overwrite the existing PNG files in `docs/assets/`, then run:

```bash
npm run check
```

Review the images visually before committing. The PNGs should not contain Chinese demo data unless the README section explicitly targets the Chinese-language documentation.

After refreshing the PNGs, regenerate the demo loop:

```bash
python scripts/create_demo_gif.py
```
