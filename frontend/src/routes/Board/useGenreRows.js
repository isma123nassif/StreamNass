// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');

// Default metadata addon (everyone has Cinemeta installed). Genre tiles are
// built directly from it because stremio-core only exposes a single catalog
// model slot, so per-genre data cannot go through the core.
const CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
const CINEMETA_MANIFEST = `${CINEMETA_BASE}/manifest.json`;

// Cinemeta genre id -> Spanish display label, in display order.
const GENRES = [
    { id: 'Action', label: 'Acción' },
    { id: 'Drama', label: 'Drama' },
    { id: 'Comedy', label: 'Comedia' },
    { id: 'Thriller', label: 'Suspense' },
    { id: 'Horror', label: 'Terror' },
    { id: 'Sci-Fi', label: 'Ciencia ficción' },
    { id: 'Animation', label: 'Animación' },
    { id: 'Documentary', label: 'Documentales' },
];

const discoverHref = (genreId) => (
    `#/discover/${encodeURIComponent(CINEMETA_MANIFEST)}/movie/top?genre=${encodeURIComponent(genreId)}`
);

const fetchBackground = async (genreId, signal) => {
    const url = `${CINEMETA_BASE}/catalog/movie/top/genre=${encodeURIComponent(genreId)}.json`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
        return null;
    }
    const body = await response.json();
    const metas = Array.isArray(body.metas) ? body.metas : [];
    const withBackground = metas.find((meta) => typeof meta.background === 'string' && meta.background.length > 0);
    return withBackground ? withBackground.background : (metas[0] && metas[0].poster) || null;
};

const useGenreRows = () => {
    const [tiles, setTiles] = React.useState(() => GENRES.map((genre) => ({
        id: genre.id,
        label: genre.label,
        href: discoverHref(genre.id),
        background: null,
    })));

    React.useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        Promise.all(GENRES.map(async (genre) => {
            try {
                const background = await fetchBackground(genre.id, controller.signal);
                return { id: genre.id, label: genre.label, href: discoverHref(genre.id), background };
            } catch (error) {
                return { id: genre.id, label: genre.label, href: discoverHref(genre.id), background: null };
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

module.exports = useGenreRows;
