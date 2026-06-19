import Bowser from 'bowser';

const APPLE_MOBILE_DEVICES = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod',
];

const { userAgent, platform, maxTouchPoints } = globalThis.navigator;

// Vision Pro uniquely supports the WebXR Device API (navigator.xr),
// while iPads and iPhones do not — this is the most reliable discriminator.
// Both Vision Pro and iPads (iPadOS 13+) report 'Macintosh' in the UA
// and have maxTouchPoints > 1, so we cannot rely on those alone.
const isMacLikeWithTouch = userAgent.includes('Macintosh') && maxTouchPoints > 1;
const isVisionOS = isMacLikeWithTouch && 'xr' in globalThis.navigator;

// Detect iOS/iPadOS devices:
// - Older iPads expose 'iPad' in navigator.platform
// - iPadOS 13+ exposes 'MacIntel' but has touch support ('ontouchend' in document)
// - Exclude Vision OS devices which also pass the touch check
const isIOS = !isVisionOS && (
    APPLE_MOBILE_DEVICES.includes(platform) ||
    (userAgent.includes('Mac') && 'ontouchend' in document)
);

const bowser = Bowser.getParser(userAgent);
const os = bowser.getOSName().toLowerCase();

// stremio-video's selectVideoImplementation matches the platform name with EXACT
// casing ('webOS', 'Tizen', 'Vidaa'); Bowser lowercases it ('webos'), which would
// silently fall back to plain HTMLVideo (Chrome codecs only → "video not supported"
// for HEVC/MKV/etc). Detect the TV platforms from the UA and use the exact name so
// the native video pipeline (WebOsVideo/TizenVideo) is selected.
const isWebOS = /web0s|webos/i.test(userAgent);
const isTizen = /tizen/i.test(userAgent);

const name = isVisionOS ? 'visionos'
    : isIOS ? 'ios'
        : isWebOS ? 'webOS'
            : isTizen ? 'Tizen'
                : os || 'unknown';
const isMobile = ['ios', 'android'].includes(name);

export {
    name,
    isMobile,
};
