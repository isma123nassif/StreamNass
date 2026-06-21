// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useNavigate } = require('react-router');
const { default: toPath } = require('stremio/common/toPath');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Button, Image, MultiselectMenu } = require('stremio/components');
const { useCore } = require('stremio/core');
const Stream = require('./Stream');
const styles = require('./styles');
const { usePlatform, useProfile } = require('stremio/common');
const { default: SeasonEpisodePicker } = require('../EpisodePicker');

const ALL_ADDONS_KEY = 'ALL';

// --- Filtros de fuentes (TV) -------------------------------------------------
// Detectan idioma/resolucion a partir del texto del stream (name + description),
// que es lo unico fiable que exponen los addons. Son heuristicas: se pueden
// afinar anadiendo palabras clave segun lo que use cada addon real.
const QUALITY_4K_RE = /\b(2160p|4k|uhd)\b/i;
const SPANISH_RE = /(castellano|espa(?:n|ñ)ol|spanish|🇪🇸|\bes-?es\b|\bspa\b|\bcast\b|\besp\b|\bvose?\b)/i;
const LATINO_RE = /(latino|latinoam|mexicano|\blat\b|🇲🇽|🇦🇷|🇨🇴|🇨🇱|🇵🇪|🇻🇪)/i;
const CASTELLANO_EXPLICIT_RE = /(castellano|🇪🇸|\bcast\b|\bes-?es\b)/i;

const streamText = (stream) => `${stream && stream.name || ''} ${stream && stream.description || ''}`;

const streamIs4K = (stream) => QUALITY_4K_RE.test(streamText(stream));

const streamIsCastellano = (stream) => {
    const text = streamText(stream);
    if (!SPANISH_RE.test(text)) {
        return false;
    }
    // Marcadores explicitos de Espana ganan aunque tambien aparezca "latino".
    if (CASTELLANO_EXPLICIT_RE.test(text)) {
        return true;
    }
    // "Spanish/Espanol" generico: solo cuenta como castellano si NO esta marcado latino.
    return !LATINO_RE.test(text);
};
// ----------------------------------------------------------------------------

const StreamsList = ({ className, video, type, onEpisodeSearch, ...props }) => {
    const { t } = useTranslation();
    const core = useCore();
    const platform = usePlatform();
    const profile = useProfile();
    const navigate = useNavigate();
    const streamsContainerRef = React.useRef(null);
    const [selectedAddon, setSelectedAddon] = React.useState(ALL_ADDONS_KEY);
    const onAddonSelected = React.useCallback((value) => {
        streamsContainerRef.current.scrollTo({ top: 0, left: 0, behavior: platform.name === 'ios' ? 'smooth' : 'instant' });
        setSelectedAddon(value);
    }, [platform]);
    const showInstallAddonsButton = React.useMemo(() => {
        return !profile || profile.auth === null || profile.auth?.user?.isNewUser === true && !video?.upcoming;
    }, [profile, video]);
    const backButtonOnClick = React.useCallback(() => {
        if (video.deepLinks && typeof video.deepLinks.metaDetailsVideos === 'string') {
            const navigateTo = `${video.deepLinks.metaDetailsVideos}${
                typeof video.season === 'number'
                    ? `?${new URLSearchParams({ 'season': video.season })}`
                    : ''}`;
            navigate(toPath(navigateTo), { replace: true });
        } else {
            navigate(-1);
        }
    }, [video]);
    const countLoadingAddons = React.useMemo(() => {
        return props.streams.filter((stream) => stream.content.type === 'Loading').length;
    }, [props.streams]);
    const streamsByAddon = React.useMemo(() => {
        return props.streams
            .filter((streams) => streams.content.type === 'Ready')
            .reduce((streamsByAddon, streams) => {
                streamsByAddon[streams.addon.transportUrl] = {
                    addon: streams.addon,
                    streams: streams.content.content.map((stream) => ({
                        ...stream,
                        onClick: () => {
                            core.transport.analytics({
                                event: 'StreamClicked',
                                args: {
                                    stream
                                }
                            });
                        },
                        addonName: streams.addon.manifest.name
                    }))
                };

                return streamsByAddon;
            }, {});
    }, [props.streams]);
    // Streams shown, grouped by addon. With "All" selected we show every addon's
    // streams under its own header; with one addon selected, just that group.
    const streamGroups = React.useMemo(() => {
        return selectedAddon === ALL_ADDONS_KEY ?
            Object.values(streamsByAddon)
            :
            streamsByAddon[selectedAddon] ?
                [streamsByAddon[selectedAddon]]
                :
                [];
    }, [streamsByAddon, selectedAddon]);
    // Filtros TV combinables: castellano y 4K. Se aplican sobre los grupos ya
    // agrupados por addon; los grupos que quedan vacios se descartan.
    const [onlyCastellano, setOnlyCastellano] = React.useState(false);
    const [only4K, setOnly4K] = React.useState(false);
    const filteredGroups = React.useMemo(() => {
        if (!onlyCastellano && !only4K) {
            return streamGroups;
        }
        return streamGroups
            .map((group) => ({
                ...group,
                streams: group.streams.filter((stream) =>
                    (!only4K || streamIs4K(stream)) &&
                    (!onlyCastellano || streamIsCastellano(stream))
                )
            }))
            .filter((group) => group.streams.length > 0);
    }, [streamGroups, onlyCastellano, only4K]);
    // Total sin filtrar: sirve para distinguir "cargando" de "filtro sin resultados".
    const totalStreams = React.useMemo(() => {
        return streamGroups.reduce((count, group) => count + group.streams.length, 0);
    }, [streamGroups]);
    const filteredTotal = React.useMemo(() => {
        return filteredGroups.reduce((count, group) => count + group.streams.length, 0);
    }, [filteredGroups]);
    // Cuantos streams casan cada filtro (en el alcance del addon seleccionado),
    // para mostrar el contador y desactivar la pildora cuando es 0.
    const castellanoCount = React.useMemo(() => {
        return streamGroups.reduce((n, g) => n + g.streams.filter(streamIsCastellano).length, 0);
    }, [streamGroups]);
    const count4K = React.useMemo(() => {
        return streamGroups.reduce((n, g) => n + g.streams.filter(streamIs4K).length, 0);
    }, [streamGroups]);
    const showGroupHeaders = selectedAddon === ALL_ADDONS_KEY && Object.keys(streamsByAddon).length > 1;
    // Filter pills: "All" + one per addon.
    const addonTabs = React.useMemo(() => {
        return [
            { value: ALL_ADDONS_KEY, label: t('ALL_ADDONS') },
            ...Object.keys(streamsByAddon).map((transportUrl) => ({
                value: transportUrl,
                label: streamsByAddon[transportUrl].addon.manifest.name
            }))
        ];
    }, [streamsByAddon]);

    const handleEpisodePicker = React.useCallback((season, episode) => {
        onEpisodeSearch(season, episode);
    }, [onEpisodeSearch]);

    return (
        <div className={classnames(className, styles['streams-list-container'])}>
            {
                video && typeof video.season === 'number' && typeof video.episode === 'number' ?
                    <div className={styles['episode-title']}>
                        {`S${video.season}E${video.episode}${video.title ? ` ${video.title}` : ''}`}
                    </div>
                    :
                    null
            }
            {
                Object.keys(streamsByAddon).length > 1 ?
                    <div className={styles['addon-tabs']} data-tv-focus-default>
                        {addonTabs.map((tab) => (
                            <Button
                                key={tab.value}
                                title={tab.label}
                                tabIndex={0}
                                className={classnames(styles['addon-tab'], { 'selected': selectedAddon === tab.value })}
                                onClick={() => onAddonSelected(tab.value)}
                            >
                                <div className={styles['addon-tab-label']}>{tab.label}</div>
                            </Button>
                        ))}
                    </div>
                    :
                    null
            }
            {
                totalStreams > 0 ?
                    <div className={styles['addon-tabs']}>
                        <Button
                            title={'Castellano'}
                            tabIndex={0}
                            className={classnames(styles['addon-tab'], { 'selected': onlyCastellano, 'disabled': castellanoCount === 0 })}
                            onClick={castellanoCount === 0 ? null : () => setOnlyCastellano((v) => !v)}
                        >
                            <div className={styles['addon-tab-label']}>🇪🇸 Castellano ({castellanoCount})</div>
                        </Button>
                        <Button
                            title={'4K'}
                            tabIndex={0}
                            className={classnames(styles['addon-tab'], { 'selected': only4K, 'disabled': count4K === 0 })}
                            onClick={count4K === 0 ? null : () => setOnly4K((v) => !v)}
                        >
                            <div className={styles['addon-tab-label']}>4K ({count4K})</div>
                        </Button>
                    </div>
                    :
                    null
            }
            {
                props.streams.length === 0 ?
                    <div className={styles['message-container']}>
                        {
                            type === 'series' ?
                                <SeasonEpisodePicker className={styles['search']} onSubmit={handleEpisodePicker} />
                                : null
                        }
                        <Image className={styles['image']} src={require('/assets/images/empty.png')} alt={' '} />
                        <div className={styles['label']}>{t('ERR_NO_ADDONS_FOR_STREAMS')}</div>
                    </div>
                    :
                    props.streams.every((streams) => streams.content.type === 'Err') ?
                        <div className={styles['message-container']}>
                            {
                                type === 'series' ?
                                    <SeasonEpisodePicker className={styles['search']} onSubmit={handleEpisodePicker} />
                                    : null
                            }
                            {
                                video?.upcoming ?
                                    <div className={styles['label']}>{t('UPCOMING')}...</div>
                                    : null
                            }
                            <Image className={styles['image']} src={require('/assets/images/empty.png')} alt={' '} />
                            <div className={styles['label']}>{t('NO_STREAM')}</div>
                            {
                                showInstallAddonsButton ?
                                    <Button className={styles['install-button-container']} title={t('ADDON_CATALOGUE_MORE')} href={'#/addons'}>
                                        <Icon className={styles['icon']} name={'addons'} />
                                        <div className={styles['label']}>{t('ADDON_CATALOGUE_MORE')}</div>
                                    </Button>
                                    :
                                    null
                            }
                        </div>
                        :
                        totalStreams === 0 ?
                            <div className={styles['streams-container']}>
                                <Stream.Placeholder />
                                <Stream.Placeholder />
                            </div>
                            :
                            filteredTotal === 0 ?
                                <div className={styles['message-container']}>
                                    <Image className={styles['image']} src={require('/assets/images/empty.png')} alt={' '} />
                                    <div className={styles['label']}>{t('NO_STREAM')}</div>
                                    <Button
                                        className={styles['install-button-container']}
                                        title={'Quitar filtros'}
                                        tabIndex={0}
                                        onClick={() => { setOnlyCastellano(false); setOnly4K(false); }}
                                    >
                                        <Icon className={styles['icon']} name={'close'} />
                                        <div className={styles['label']}>Quitar filtros</div>
                                    </Button>
                                </div>
                                :
                            <React.Fragment>
                                <div className={styles['streams-container']} data-tv-focus-default ref={streamsContainerRef}>
                                    {filteredGroups.map((group) => (
                                        <div key={group.addon.transportUrl} className={styles['stream-group']}>
                                            {
                                                showGroupHeaders ?
                                                    <div className={styles['stream-group-header']}>{group.addon.manifest.name}</div>
                                                    :
                                                    null
                                            }
                                            {group.streams.map((stream, index) => (
                                                <Stream
                                                    key={index}
                                                    videoId={video?.id}
                                                    videoReleased={video?.released}
                                                    addonName={stream.addonName}
                                                    name={stream.name}
                                                    description={stream.description}
                                                    thumbnail={stream.thumbnail}
                                                    progress={stream.progress}
                                                    deepLinks={stream.deepLinks}
                                                    onClick={stream.onClick}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                    {
                                        showInstallAddonsButton ?
                                            <Button className={styles['install-button-container']} title={t('ADDON_CATALOGUE_MORE')} href={'#/addons'}>
                                                <Icon className={styles['icon']} name={'addons'} />
                                                <div className={styles['label']}>{t('ADDON_CATALOGUE_MORE')}</div>
                                            </Button>
                                            :
                                            null
                                    }
                                </div>
                                {
                                    countLoadingAddons > 0 ?
                                        <div className={styles['addons-loading-container']}>
                                            <div className={styles['addons-loading']}>
                                                {countLoadingAddons} {t('MOBILE_ADDONS_LOADING')}
                                            </div>
                                            <span className={styles['addons-loading-bar']}></span>
                                        </div>
                                        :
                                        null
                                }
                            </React.Fragment>
            }
        </div>
    );
};

StreamsList.propTypes = {
    className: PropTypes.string,
    streams: PropTypes.arrayOf(PropTypes.object).isRequired,
    video: PropTypes.object,
    type: PropTypes.string,
    onEpisodeSearch: PropTypes.func
};

module.exports = StreamsList;
