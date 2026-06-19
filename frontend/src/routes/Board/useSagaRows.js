// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');

// Backdrops are pulled from Cinemeta's search catalog; tiles link to the
// in-app search for the saga so all installed addons contribute results.
const CINEMETA_BASE = 'https://v3-cinemeta.strem.io';

// How many sagas are shown directly in the home row (the rest appear in the
// "Ver más" grid and only load their backdrops when that grid is opened).
const HOME_COUNT = 8;

// Top sagas / franchises. `query` is the term used both to fetch a backdrop
// and as the in-app search target. `label` is the tile text.
const SAGAS = [
    { id: 'harry-potter', label: 'Harry Potter', query: 'Harry Potter' },
    { id: 'star-wars', label: 'Star Wars', query: 'Star Wars' },
    { id: 'marvel', label: 'Marvel', query: 'Avengers' },
    { id: 'jurassic', label: 'Jurassic Park', query: 'Jurassic Park' },
    { id: 'fast-furious', label: 'Fast & Furious', query: 'Fast & Furious' },
    { id: 'john-wick', label: 'John Wick', query: 'John Wick' },
    { id: 'godfather', label: 'El Padrino', query: 'Godfather' },
    { id: 'mission-impossible', label: 'Misión Imposible', query: 'Mission Impossible' },
    { id: 'lotr', label: 'El Señor de los Anillos', query: 'Lord of the Rings' },
    { id: 'pirates', label: 'Piratas del Caribe', query: 'Pirates of the Caribbean' },
    { id: 'james-bond', label: 'James Bond', query: 'James Bond' },
    { id: 'rocky', label: 'Rocky', query: 'Rocky' },
    { id: 'indiana-jones', label: 'Indiana Jones', query: 'Indiana Jones' },
    { id: 'terminator', label: 'Terminator', query: 'Terminator' },
    { id: 'matrix', label: 'Matrix', query: 'Matrix' },
    { id: 'transformers', label: 'Transformers', query: 'Transformers' },
    { id: 'x-men', label: 'X-Men', query: 'X-Men' },
    { id: 'hunger-games', label: 'Los Juegos del Hambre', query: 'Hunger Games' },
    { id: 'toy-story', label: 'Toy Story', query: 'Toy Story' },
    { id: 'shrek', label: 'Shrek', query: 'Shrek' },
    { id: 'batman', label: 'Batman', query: 'Batman' },
    { id: 'planet-apes', label: 'El Planeta de los Simios', query: 'Planet of the Apes' },
];

const searchHref = (query) => (
    `#/search?search=${encodeURIComponent(query)}`
);

const fetchBackground = async (query, signal) => {
    const url = `${CINEMETA_BASE}/catalog/movie/top/search=${encodeURIComponent(query)}.json`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
        return null;
    }
    const body = await response.json();
    const metas = Array.isArray(body.metas) ? body.metas : [];
    const withBackground = metas.find((meta) => typeof meta.background === 'string' && meta.background.length > 0);
    return withBackground ? withBackground.background : (metas[0] && metas[0].poster) || null;
};

const fetchBackgrounds = async (sagas, signal) => (
    Promise.all(sagas.map(async (saga) => {
        try {
            return { id: saga.id, background: await fetchBackground(saga.query, signal) };
        } catch (error) {
            return { id: saga.id, background: null };
        }
    }))
);

const useSagaRows = () => {
    const [tiles, setTiles] = React.useState(() => SAGAS.map((saga) => ({
        id: saga.id,
        label: saga.label,
        href: searchHref(saga.query),
        background: null,
    })));
    const allRequested = React.useRef(false);

    const applyBackgrounds = React.useCallback((results) => {
        const map = new Map(results.map((result) => [result.id, result.background]));
        setTiles((prev) => prev.map((tile) => (
            map.has(tile.id) ? { ...tile, background: map.get(tile.id) ?? tile.background } : tile
        )));
    }, []);

    React.useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        fetchBackgrounds(SAGAS.slice(0, HOME_COUNT), controller.signal).then((results) => {
            if (!cancelled) {
                applyBackgrounds(results);
            }
        });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [applyBackgrounds]);

    const loadAll = React.useCallback(() => {
        if (allRequested.current) {
            return;
        }
        allRequested.current = true;
        fetchBackgrounds(SAGAS.slice(HOME_COUNT), new AbortController().signal).then(applyBackgrounds);
    }, [applyBackgrounds]);

    return [tiles, loadAll];
};

module.exports = useSagaRows;
