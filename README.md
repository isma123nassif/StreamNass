# StreamNass

**Stremio for LG webOS, redesigned and optimized for the TV-with-remote experience.**

StreamNass is a fork of [Stremio](https://www.stremio.com/) for LG webOS TVs. It takes the [stremio-web](https://github.com/Stremio/stremio-web) frontend and the official streaming server, gives them a Nuvio-style *facelift*, and adapts everything so it can be driven comfortably from the remote — no mouse or keyboard needed.

> Monorepo: includes both the **webOS wrapper** (`app/`, `service/`) and the modified **frontend** (`frontend/`). A single `make deploy` builds and installs it on the TV.

---

## ✨ Improvements over official Stremio

### 🎮 Remote (D-pad) navigation
- Custom navigation engine (`useTVNavigation`) with **topbar / sidebar / content** regions and edge-to-edge jumps.
- **Per-route focus memory**: when you return to a screen, you land back on the element you left, not the top.
- Selects the **visible** instance (the stremio-web router keeps several routes mounted at once).
- Auto-scroll that **centers** the focused element.
- Clear focus indicator on the sidebar and tabs.

### 🏠 Nuvio-style Home (Board)
- **Continue Watching** as the first block, resuming with the last source used.
- Featured hero, rows by **genre** and **platform**, and **saga collections**.
- Your **recommendations** and addon catalogs at the bottom.

### 🔎 Discover
- **Large** posters (no right sidebar).
- Year, runtime and IMDb rating under the title.

### 📺 Source selection (StreamsList)
- *Pill*-style tabs per addon.
- Streams grouped with **quality badges**.

### ▶️ Player
- Remote-friendly key scheme, visible focus in menus, and larger buttons.
- **Automatic audio-language selection** based on your Stremio profile (fixes the official Stremio bug that always plays the first track, ignoring your preferred language). Tracks are read from the TV's native pipeline so the indices line up.

### ⚙️ Stability and webOS platform
- **Native webOS video**: `device.ts` with the correct `webOS` casing for `selectVideoImplementation`, plus a `window.webOS` shim over `PalmServiceBridge`.
- **Native playback on direct URLs** (`use-native-decode-on-direct-url` patch).
- **Relaunch fix**: the app reopens from the TV icon even after going Home and back.
- **Server port relocated** `11470 → 11548` to avoid colliding with the LG Content Store's Stremio (which caused an `EADDRINUSE` crash on boot).
- Search keyboard fixes.

---

## 🗂 Structure

```
app/        # webOS app shell — starts the service and redirects to http://127.0.0.1:8080
service/    # webOS service — serves the frontend on :8080 and proxies the API to the streaming server
frontend/   # stremio-web fork with the facelift and TV navigation
patches/    # Patches applied during the build (audio, keyboard, native decode)
Makefile    # build / package / deploy / restart / clean
```

Some files are **downloaded or generated during the build** and are not in the repo:
`service/server.js` (official streaming server), `service/bin/ffmpeg`+`ffprobe`, `service/www/` (frontend build) and `frontend/node_modules`. Run `make build` to generate them.

---

## 🚀 Installation

### Requirements
1. [webOS ares CLI](https://www.npmjs.com/package/@webosose/ares-cli) — `npm i -g @webosose/ares-cli` (needs Node.js 20).
2. [Developer Mode](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) enabled on the TV, or [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel) if it's rooted.
3. The TV registered as an ares device — `ares-setup-device`.

### Build and install
```sh
make deploy                 # downloads deps, builds, packages the IPK, installs and launches
make deploy DEVICE=mytv     # if your ares device is named something other than "tv"
```

### Other commands
```sh
make build      # download deps + build the frontend (no install)
make package    # build + create the IPK
make restart    # close and relaunch on the TV
make clean      # remove build artifacts
```

---

## 🙏 Credits

Built on top of the work of:
- [Stremio](https://www.stremio.com/) and [stremio-web](https://github.com/Stremio/stremio-web)
- [kieranbrown/stremio-webos](https://github.com/kieranbrown/stremio-webos) — base webOS wrapper
- [webOS Homebrew Project](https://www.webosbrew.org/)

The visual style is inspired by [Nuvio](https://github.com/tapframe/NuvioStreams).

> Personal project. Stremio is a trademark of Smart Code Ltd. StreamNass is not affiliated with Stremio or LG.
