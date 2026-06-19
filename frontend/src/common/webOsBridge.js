// Copyright (C) 2017-2024 Smart code 203358507

// Minimal `window.webOS.service.request` implementation for webOS, built on the
// native `window.PalmServiceBridge`. The official webOSTV.js library is not
// bundled in this build; stremio-video's WebOsVideo (the native media pipeline,
// luna://com.webos.media) only needs `webOS.service.request`, so we provide a
// faithful implementation here. Without it, WebOsVideo would throw and the player
// silently falls back to plain HTMLVideo (limited Chrome codecs → "video not
// supported"). No-op on non-webOS platforms.

(function () {
    if (typeof window === 'undefined') {
        return;
    }
    // Already provided (e.g. webOSTV.js present) — don't clobber it.
    if (window.webOS && window.webOS.service && typeof window.webOS.service.request === 'function') {
        return;
    }
    if (typeof window.PalmServiceBridge !== 'function') {
        return;
    }

    function ServiceRequest(uri, params) {
        params = params || {};
        var self = this;
        this.cancelled = false;
        this.subscribed = !!(params.subscribe || params.resubscribe);
        this.bridge = new window.PalmServiceBridge();

        this.bridge.onservicecallback = function (msg) {
            if (self.cancelled) {
                return;
            }
            var response;
            try {
                response = (typeof msg === 'string' && msg.length > 0) ? JSON.parse(msg) : {};
            } catch (e) {
                response = { returnValue: false, errorCode: -1, errorText: 'JSON parse error' };
            }
            var failed = response.returnValue === false ||
                (typeof response.errorCode !== 'undefined' && response.errorCode !== 0);
            if (failed) {
                if (typeof params.onFailure === 'function') {
                    params.onFailure(response);
                }
            } else if (typeof params.onSuccess === 'function') {
                params.onSuccess(response);
            }
            if (typeof params.onComplete === 'function') {
                params.onComplete(response);
            }
            if (!self.subscribed) {
                self.cancel();
            }
        };

        var url = uri + (params.method ? '/' + params.method : '');
        var args = params.parameters || params.params || {};
        if (self.subscribed && typeof args.subscribe === 'undefined') {
            args.subscribe = true;
        }
        try {
            this.bridge.call(url, JSON.stringify(args));
        } catch (e) {
            if (typeof params.onFailure === 'function') {
                params.onFailure({ returnValue: false, errorCode: -1, errorText: String(e) });
            }
        }
    }

    ServiceRequest.prototype.cancel = function () {
        if (this.cancelled) {
            return;
        }
        this.cancelled = true;
        try {
            if (this.bridge && typeof this.bridge.cancel === 'function') {
                this.bridge.cancel();
            }
        } catch (e) {
            // noop
        }
        this.bridge = null;
    };

    window.webOS = window.webOS || {};
    window.webOS.service = window.webOS.service || {};
    window.webOS.service.request = function (uri, params) {
        return new ServiceRequest(uri, params);
    };
})();
