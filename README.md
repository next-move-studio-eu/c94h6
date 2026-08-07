# c94h6

Desktop and web-shell article editor from [Next Move Studio s.r.o.](https://www.nextmovestudio.eu). It edits the project’s portable article format (JSON + ZIP) and powers content on [nextmovestudio.eu](https://www.nextmovestudio.eu).

- **License:** [EUPL-1.2](LICENSE)
- **Source:** [github.com/next-move-studio-eu/c94h6](https://github.com/next-move-studio-eu/c94h6)

> **This repository does not accept pull requests.**

The root `package.json` sets `"private": false` on purpose: [`license-checker`](https://www.npmjs.com/package/license-checker) forces any `"private": true` package to **UNLICENSED**, which breaks `--onlyAllow` checks even when `license` and the `LICENSE` file are correct. This app is not published to npm by default; avoid `npm publish` unless you intend to.

## Privacy and security

c94h6 is **offline-first**: it does not ship with logins, backend APIs, or in-app handling of service credentials. You edit local article files and optionally point the desktop build at a **UCI chess engine binary on disk** (user-chosen path). There is no designed path for the app to receive, store, or process third-party **secrets**; treat normal care with your own files and engine binaries as you would any local tool.

## Sample content disclaimer

Sample articles were generated using Claude, ChatGPT, Gemini and Mistral as format demonstrations. Content is provided as-is without guarantees of factual accuracy.

## Prerequisites

- Node.js (current LTS recommended)
- [Rust](https://www.rust-lang.org/tools/install) and platform tooling for [Tauri 2](https://v2.tauri.app/start/prerequisites/) when building the desktop app

## Development

```bash
npm install
npm run dev
```

Web UI dev server (Vite) listens on port **1420** (fixed port for Tauri `devUrl`).

### Desktop (Tauri)

```bash
npm run tauri dev
```

## Build

```bash
npm run build
npm run tauri build
```
