# penpot-lucide-icons

<!-- https://github.com/Ileriayo/markdown-badges -->
![Vite](./readme/badges/vite.svg)
![penpot](./readme/badges/penpot.svg)
![Svelte](./readme/badges/svelte.svg)
![lucide](./readme/badges/lucide.svg)

[Lucide](https://lucide.dev) icons for [Penpot](https://penpot.app), inspired by the Lucide plugin for Figma.

![Demonstration](./readme/images/example.png)

## Installation

In Penpot open **Plugins** (`Ctrl/⌘ + Alt + P`) and install the plugin from its manifest URL:

```
https://jirkacepelka.github.io/penpot-lucide-icons/manifest.json
```

> The URL has to point to `manifest.json`, not just to the site. If you deploy your own fork,
> use `https://<user>.github.io/<repo>/manifest.json` (Settings → Pages → Source: **GitHub Actions**).

## Features

- **Icons** – all Lucide icons, fuzzy search (names, old names, tags) and category filter.
  Click an icon to insert it:
  - as a board named after the icon (strokes stay editable, ready to be turned into a component),
  - into the selected board (respecting its flex / grid layout),
  - next to a selected, previously inserted icon (quickly build icon sets),
  - centered on top of any other selected shape,
  - or in the center of the viewport when nothing is selected.
  
  Each insertion is a single undo step.
- **Settings** – color, size, stroke width and absolute stroke width (same semantics as Lucide's
  `absoluteStrokeWidth`). Settings are remembered.
- **Info** – Lucide version, usage, links.

## Development

```sh
pnpm i
pnpm dev            # http://localhost:5173/manifest.json – load this URL in Penpot
pnpm check          # svelte-check + type checks (UI, scripts, plugin code)
pnpm build          # production build into dist/
```

The icon index (`src/lib/lucide.json`) is generated from the latest Lucide release on the first
`dev` / `build` / `check`. To update it:

```sh
pnpm generate-icons run              # latest Lucide release
pnpm generate-icons run --ref=1.57.0 # a specific release
```

Code layout:

- `src/plugin.penpot.ts` – plugin code running inside Penpot (`penpot` API), `src/insert-icon.penpot.ts` does the SVG → board conversion
- `src/app.svelte`, `src/tabs-content/*` – the plugin UI (iframe)
- `src/messages/*` – messages between the two, validated with valibot
