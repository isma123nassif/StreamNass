DEVICE ?= tv
APP_ID = org.stremio.lgos
SERVER_VERSION = 4.20.17
# Port our bundled streaming server listens on. The default 11470 collides with
# the LG Content Store Stremio app's server already running on the TV (EADDRINUSE
# crashes our service on boot), so we relocate ours to a free port and proxy to it.
SERVER_PORT = 11548
VIDAA_REF = 208d437e5138adff0865443a2a88c4fcee84ece6
VIDAA_REPO = https://github.com/NoobyGains/stremio-vidaa-tv/archive/$(VIDAA_REF).tar.gz
FFMPEG_VERSION = 7.0.2
FFMPEG_URL = https://johnvansickle.com/ffmpeg/releases/ffmpeg-$(FFMPEG_VERSION)-arm64-static.tar.xz
FFMPEG_SHA256 = f4149bb2b0784e30e99bdda85471c9b5930d3402014e934a5098b41d0f7201b1
VERSION = $(shell python3 -c "import json; print(json.load(open('app/appinfo.json'))['version'])")
IPK = $(APP_ID)_$(VERSION)_all.ipk

.PHONY: build package deploy launch restart clean

service/server.js:
	@echo "==> Downloading Stremio server v$(SERVER_VERSION)..."
	@curl -so $@ "https://dl.strem.io/server/v$(SERVER_VERSION)/webos/server.js"
	@echo "==> Relocating server port 11470 -> $(SERVER_PORT) (avoid TV conflict)..."
	@sed -i 's/11470/$(SERVER_PORT)/g' $@

service/bin/ffmpeg service/bin/ffprobe &:
	@echo "==> Downloading static ffmpeg+ffprobe v$(FFMPEG_VERSION) (aarch64)..."
	@rm -rf /tmp/stremio-ffmpeg && mkdir -p /tmp/stremio-ffmpeg service/bin
	@curl -sLo /tmp/stremio-ffmpeg/ffmpeg.tar.xz $(FFMPEG_URL)
	@echo "$(FFMPEG_SHA256)  /tmp/stremio-ffmpeg/ffmpeg.tar.xz" | shasum -a 256 -c -
	@tar xJ --strip-components=1 -f /tmp/stremio-ffmpeg/ffmpeg.tar.xz -C /tmp/stremio-ffmpeg
	@cp /tmp/stremio-ffmpeg/ffmpeg /tmp/stremio-ffmpeg/ffprobe service/bin/
	@chmod +x service/bin/ffmpeg service/bin/ffprobe
	@rm -rf /tmp/stremio-ffmpeg

build: service/server.js service/bin/ffmpeg service/bin/ffprobe
	@echo "==> Building frontend (stremio-web fork)..."
	@cd frontend && SERVICE_WORKER_DISABLED=true npx pnpm build
	@echo "==> Copying build into service/www/..."
	@rm -rf service/www && mkdir -p service/www
	@cp -r frontend/build/. service/www/
	@echo "==> Injecting streaming-server URL (:8080 proxy) into index.html..."
	@grep -q '__STREMIO_SERVER_URL__' service/www/index.html || \
		sed -i 's#</head>#<script>window.__STREMIO_SERVER_URL__="http://127.0.0.1:8080/";</script></head>#' service/www/index.html
	@if [ -f .tmdb_key ]; then \
		echo "==> Injecting TMDB API key (local .tmdb_key) into index.html..."; \
		KEY=$$(tr -d '\n\r' < .tmdb_key); \
		grep -q '__TMDB_API_KEY__' service/www/index.html || \
			sed -i "s#</head>#<script>window.__TMDB_API_KEY__=\"$$KEY\";</script></head>#" service/www/index.html; \
	fi
	@echo "==> Build complete"

package: build
	@rm -f $(IPK)
	@# ares-cli on Node 20+ throws a harmless "rimraf is not a function" during its
	@# temp-dir cleanup AFTER writing the IPK, exiting non-zero. Tolerate it and just
	@# verify the IPK was actually produced.
	@ares-package --no-minify app service -o . || true
	@test -f $(IPK) || { echo "ERROR: $(IPK) was not created"; exit 1; }

deploy: package
	@for i in 1 2 3 4 5; do \
		ares-install --device $(DEVICE) $(IPK) && break || sleep 3; \
	done
	@ares-launch --device $(DEVICE) $(APP_ID)

launch:
	@ares-launch --device $(DEVICE) $(APP_ID)

restart:
	@-ares-launch --device $(DEVICE) --close $(APP_ID)
	@sleep 1
	@ares-launch --device $(DEVICE) $(APP_ID)

clean:
	rm -rf service/www service/server.js service/bin *.ipk
