// Copyright (C) 2017-2024 Smart code 203358507

// TMDB Collections addon (public instance). Each "collection" is a movie saga
// (id prefix `ctmdb.`); its `meta.videos` are the films of the saga.
// The path segment after the host is the addon CONFIG (language, etc.) — swap
// this whole constant for your own configured install URL (without the
// trailing `/manifest.json`) to get your language/region.
const ADDON = 'https://61ab9c85a149-tmdb-collections.baby-beamup.club/%7B%22language%22%3A%22es-ES%22%7D';

const cleanName = (name) => (
    typeof name === 'string' ?
        name.replace(/\s*(Collection|Colección|Saga)\s*$/i, '').trim()
        :
        ''
);

const yearOf = (released) => {
    if (typeof released !== 'string' || released.length === 0) {
        return '';
    }
    const year = new Date(released).getFullYear();
    return Number.isFinite(year) ? String(year) : '';
};

const fetchCollections = async (catalogId, signal) => {
    const response = await fetch(`${ADDON}/catalog/collections/${catalogId}.json`, { signal });
    if (!response.ok) {
        return [];
    }
    const body = await response.json();
    const metas = Array.isArray(body.metas) ? body.metas : [];
    return metas
        .filter((meta) => meta && meta.id && meta.poster)
        .map((meta) => ({
            id: meta.id,
            name: meta.name,
            title: cleanName(meta.name),
            poster: meta.poster,
            background: meta.background || null,
        }));
};

const fetchCollectionMeta = async (collectionId, signal) => {
    const response = await fetch(`${ADDON}/meta/movie/${encodeURIComponent(collectionId)}.json`, { signal });
    if (!response.ok) {
        return null;
    }
    const body = await response.json();
    const meta = body.meta || {};
    const films = (Array.isArray(meta.videos) ? meta.videos : [])
        .filter((video) => video && video.id)
        .map((video) => ({
            id: video.id,
            title: video.title || video.name || '',
            year: yearOf(video.released),
            released: video.released || '',
            // Films expose a landscape `thumbnail` (fanart); use Stremio's metahub
            // for a proper portrait poster keyed by the film's IMDB id.
            poster: /^tt/.test(video.id) ?
                `https://images.metahub.space/poster/medium/${video.id}/img`
                :
                (video.thumbnail || meta.poster || null),
            href: `#/metadetails/movie/${encodeURIComponent(video.id)}`,
        }))
        .sort((a, b) => b.released.localeCompare(a.released));
    return {
        id: collectionId,
        name: meta.name,
        title: cleanName(meta.name),
        background: meta.background || meta.poster || null,
        description: meta.description || '',
        films,
    };
};

module.exports = { fetchCollections, fetchCollectionMeta, cleanName };
