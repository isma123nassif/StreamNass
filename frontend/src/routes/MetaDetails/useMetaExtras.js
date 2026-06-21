// Carga extras para la pagina de detalle (optimizado TV):
//  - Reparto con foto: TMDB (find por imdb id -> credits). La API key se
//    inyecta en build como window.__TMDB_API_KEY__ (no vive en el repo).
//  - Recomendaciones similares: addon "Watch Next" (recurso stream); el poster
//    se deriva por imdb id desde metahub (sin API key).
// Solo lectura/red; no toca el core del player.

const React = require('react');
const { useProfile } = require('stremio/common');

const TMDB_KEY = (typeof window !== 'undefined' && window.__TMDB_API_KEY__) || '';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const WATCH_NEXT_ID = 'community.watch.next';

const baseImdbId = (id) => (typeof id === 'string' ? id.split(':')[0] : null);
const isImdb = (s) => typeof s === 'string' && /^tt\d+$/.test(s);

const useMetaExtras = ({ type, id }) => {
    const profile = useProfile();
    const [cast, setCast] = React.useState([]);
    const [recommendations, setRecommendations] = React.useState([]);

    const imdbId = baseImdbId(id);
    const isSeries = type === 'series';

    React.useEffect(() => {
        let cancelled = false;
        setCast([]);
        if (!isImdb(imdbId) || !TMDB_KEY) {
            return;
        }
        const tmdbType = isSeries ? 'tv' : 'movie';
        (async () => {
            try {
                const find = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&api_key=${TMDB_KEY}`).then((r) => r.json());
                const results = tmdbType === 'tv' ? find.tv_results : find.movie_results;
                const tmdbId = results && results[0] && results[0].id;
                if (!tmdbId) {
                    return;
                }
                const credits = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}/credits?api_key=${TMDB_KEY}`).then((r) => r.json());
                const list = (credits.cast || [])
                    .slice(0, 20)
                    .map((p) => ({
                        id: String(p.id),
                        name: p.name,
                        character: p.character || '',
                        photo: p.profile_path ? TMDB_IMG + p.profile_path : null
                    }));
                if (!cancelled) {
                    setCast(list);
                }
            } catch (e) {
                // silencioso: el reparto es un extra, no debe romper la pagina
            }
        })();
        return () => { cancelled = true; };
    }, [imdbId, isSeries]);

    React.useEffect(() => {
        let cancelled = false;
        setRecommendations([]);
        if (!isImdb(imdbId) || !profile || !Array.isArray(profile.addons)) {
            return;
        }
        const wn = profile.addons.find((a) => a && a.manifest && a.manifest.id === WATCH_NEXT_ID);
        if (!wn || typeof wn.transportUrl !== 'string') {
            return;
        }
        const base = wn.transportUrl.replace(/manifest\.json$/, '');
        const wnType = isSeries ? 'series' : 'movie';
        (async () => {
            try {
                const res = await fetch(`${base}stream/${wnType}/${imdbId}.json`).then((r) => r.json());
                const seen = {};
                const items = (res.streams || [])
                    .map((s) => {
                        const m = typeof s.externalUrl === 'string'
                            ? s.externalUrl.match(/detail\/(movie|series)\/(tt\d+)/)
                            : null;
                        if (!m) {
                            return null;
                        }
                        const recType = m[1];
                        const recId = m[2];
                        if (seen[recId]) {
                            return null;
                        }
                        seen[recId] = true;
                        return {
                            id: recId,
                            name: s.name || '',
                            poster: `https://images.metahub.space/poster/medium/${recId}/img`,
                            deepLink: `#/detail/${recType}/${recId}/${recId}`
                        };
                    })
                    .filter(Boolean);
                if (!cancelled) {
                    setRecommendations(items);
                }
            } catch (e) {
                // silencioso
            }
        })();
        return () => { cancelled = true; };
    }, [imdbId, isSeries, profile]);

    return { cast, recommendations };
};

module.exports = useMetaExtras;
