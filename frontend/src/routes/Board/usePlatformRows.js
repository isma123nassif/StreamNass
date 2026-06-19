// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');

// Public "Streaming Catalogs" addon (rleroi) — provides per-platform catalogs
// (Netflix, HBO Max, Disney+, Prime Video, Apple TV+) with IMDB ids, no API key.
const ADDON_BASE = 'https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club';
const ADDON_MANIFEST = `${ADDON_BASE}/manifest.json`;

// Catalog id -> display info, in display order.
// `brand` drives the per-brand colour/animation; `videoSrc` is where a real
// platform ident clip (WebM/MP4) would be wired in — drop a file under
// frontend/assets/platforms/<brand>.webm and set videoSrc to its URL.
const PLATFORMS = [
    { id: 'nfx', label: 'Netflix', brand: 'netflix', color: '#E50914', logo: '/platforms/netflix.png', videoSrc: null },
    { id: 'amp', label: 'Prime Video', brand: 'prime', color: '#1FB6FF', logo: '/platforms/prime.png', videoSrc: null },
    { id: 'hbm', label: 'HBO Max', brand: 'hbomax', color: '#A24BFF', logo: '/platforms/hbomax.png', videoSrc: null },
    { id: 'atp', label: 'Apple TV+', brand: 'appletv', color: '#FFFFFF', logo: '/platforms/appletv.png', videoSrc: null },
    { id: 'dnp', label: 'Disney+', brand: 'disney', color: '#3AACF0', logo: '/platforms/disney.png', videoSrc: null },
];

const discoverHref = (catalogId) => (
    `#/discover/${encodeURIComponent(ADDON_MANIFEST)}/movie/${encodeURIComponent(catalogId)}`
);

const fetchBackground = async (catalogId, signal) => {
    const url = `${ADDON_BASE}/catalog/movie/${encodeURIComponent(catalogId)}.json`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
        return null;
    }
    const body = await response.json();
    const metas = Array.isArray(body.metas) ? body.metas : [];
    const withBackground = metas.find((meta) => typeof meta.background === 'string' && meta.background.length > 0);
    return withBackground ? withBackground.background : (metas[0] && metas[0].poster) || null;
};

const usePlatformRows = () => {
    const [tiles, setTiles] = React.useState(() => PLATFORMS.map((platform) => ({
        id: platform.id,
        label: platform.label,
        brand: platform.brand,
        color: platform.color,
        logo: platform.logo,
        videoSrc: platform.videoSrc,
        href: discoverHref(platform.id),
        background: null,
    })));

    React.useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        Promise.all(PLATFORMS.map(async (platform) => {
            try {
                const background = await fetchBackground(platform.id, controller.signal);
                return {
                    id: platform.id,
                    label: platform.label,
                    brand: platform.brand,
                    color: platform.color,
                    logo: platform.logo,
                    videoSrc: platform.videoSrc,
                    href: discoverHref(platform.id),
                    background,
                };
            } catch (error) {
                return {
                    id: platform.id,
                    label: platform.label,
                    brand: platform.brand,
                    color: platform.color,
                    logo: platform.logo,
                    videoSrc: platform.videoSrc,
                    href: discoverHref(platform.id),
                    background: null,
                };
            }
        })).then((resolved) => {
            if (!cancelled) {
                setTiles(resolved);
            }
        });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    return tiles;
};

module.exports = usePlatformRows;
