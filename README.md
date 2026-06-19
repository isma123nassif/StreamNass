# StreamNass

**Stremio para LG webOS, rediseñado y optimizado para la experiencia en TV con mando.**

StreamNass es un fork de [Stremio](https://www.stremio.com/) para televisores LG webOS. Toma el frontend de [stremio-web](https://github.com/Stremio/stremio-web) y el servidor de streaming oficial, les aplica un *facelift* estilo Nuvio y los adapta para que todo se maneje cómodamente desde el mando a distancia, sin ratón ni teclado.

> Monorepo: incluye tanto el **wrapper de webOS** (`app/`, `service/`) como el **frontend** modificado (`frontend/`). Un solo `make deploy` lo compila e instala en la TV.

---

## ✨ Mejoras sobre el Stremio oficial

### 🎮 Navegación con mando (D-pad)
- Motor de navegación propio (`useTVNavigation`) con regiones **topbar / sidebar / contenido** y saltos entre bordes.
- **Memoria de foco por ruta**: al volver a una pantalla recuperas el elemento donde estabas, no el principio.
- Selección del elemento **visible** (el router de stremio-web mantiene varias rutas montadas a la vez).
- Auto-scroll que **centra** el elemento enfocado.
- Indicador de foco claro en la barra lateral y las pestañas.

### 🏠 Inicio (Board) tipo Nuvio
- **Continuar viendo** como primer bloque, reanudando con la última fuente usada.
- Hero destacado, filas por **género** y **plataforma**, y **colecciones de sagas**.
- Tus **recomendaciones** y catálogos de addons al final.

### 🔎 Discover
- Pósters a **tamaño grande** (sin barra lateral derecha).
- Año, duración y nota IMDb bajo el título.

### 📺 Selección de fuente (StreamsList)
- Pestañas tipo *pill* por addon.
- Streams agrupados con **badges de calidad**.

### ▶️ Reproductor
- Esquema de teclas pensado para mando, foco visible en los menús y botones más grandes.
- **Selección automática del idioma de audio** según tu perfil de Stremio (corrige el bug del Stremio oficial, que siempre reproduce la primera pista ignorando tu idioma preferido). Las pistas se leen del *pipeline* nativo de la TV para que los índices coincidan.

### ⚙️ Estabilidad y plataforma webOS
- **Vídeo nativo webOS**: `device.ts` con el *casing* `webOS` correcto para `selectVideoImplementation`, y un *shim* de `window.webOS` sobre `PalmServiceBridge`.
- **Reproducción nativa en URLs directas** (parche `use-native-decode-on-direct-url`).
- **Arreglo del relaunch**: la app vuelve a abrir desde el icono de la TV aunque hayas ido al Home y vuelto.
- **Puerto del servidor reubicado** `11470 → 11548` para no chocar con el Stremio de la LG Content Store (que provocaba un `EADDRINUSE` al arrancar).
- Arreglos de teclado en la búsqueda.

---

## 🗂 Estructura

```
app/        # Shell de la app webOS — arranca el servicio y redirige a http://127.0.0.1:8080
service/    # Servicio webOS — sirve el frontend en :8080 y proxea la API al servidor de streaming
frontend/   # Fork de stremio-web con el facelift y la navegación TV
patches/    # Parches aplicados durante el build (audio, teclado, decode nativo)
Makefile    # build / package / deploy / restart / clean
```

Algunos ficheros se **descargan o generan en el build** y no están en el repo:
`service/server.js` (servidor de streaming oficial), `service/bin/ffmpeg`+`ffprobe`, `service/www/` (build del frontend) y `frontend/node_modules`. Ejecuta `make build` para generarlos.

---

## 🚀 Instalación

### Requisitos
1. [webOS ares CLI](https://www.npmjs.com/package/@webosose/ares-cli) — `npm i -g @webosose/ares-cli` (necesita Node.js 20).
2. [Modo desarrollador](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) activado en la TV, o [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel) si está rooteada.
3. La TV dada de alta como dispositivo en ares — `ares-setup-device`.

### Compilar e instalar
```sh
make deploy                 # descarga deps, compila, empaqueta el IPK, instala y lanza
make deploy DEVICE=mytv     # si tu dispositivo ares se llama distinto a "tv"
```

### Otros comandos
```sh
make build      # descarga deps + compila el frontend (sin instalar)
make package    # build + crea el IPK
make restart    # cierra y relanza en la TV
make clean      # borra los artefactos de build
```

---

## 🙏 Créditos

Construido sobre el trabajo de:
- [Stremio](https://www.stremio.com/) y [stremio-web](https://github.com/Stremio/stremio-web)
- [kieranbrown/stremio-webos](https://github.com/kieranbrown/stremio-webos) — wrapper de webOS base
- [webOS Homebrew Project](https://www.webosbrew.org/)

El estilo visual se inspira en [Nuvio](https://github.com/tapframe/NuvioStreams).

> Proyecto personal. Stremio es marca de Smart Code Ltd. StreamNass no está afiliado a Stremio ni a LG.
