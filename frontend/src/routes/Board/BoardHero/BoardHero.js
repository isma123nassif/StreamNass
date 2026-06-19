// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const { default: useInterval } = require('stremio/common/useInterval');
const styles = require('./styles');

const ROTATE_INTERVAL = 7500;

const BoardHero = ({ className, items }) => {
    const { t } = useTranslation();
    const interval = useInterval(ROTATE_INTERVAL);
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);

    const count = Array.isArray(items) ? items.length : 0;
    const safeIndex = count > 0 ? index % count : 0;
    const item = count > 0 ? items[safeIndex] : null;

    React.useEffect(() => {
        setIndex(0);
    }, [count]);

    React.useEffect(() => {
        if (count > 1 && !paused) {
            interval.start(() => setIndex((prev) => (prev + 1) % count));
        } else {
            interval.cancel();
        }
        return () => interval.cancel();
    }, [count, paused]);

    const onFocus = React.useCallback(() => setPaused(true), []);
    const onBlur = React.useCallback(() => setPaused(false), []);

    const href = React.useMemo(() => {
        const deepLinks = item && item.deepLinks;
        if (!deepLinks) {
            return null;
        }
        return typeof deepLinks.metaDetailsStreams === 'string' ?
            deepLinks.metaDetailsStreams
            :
            typeof deepLinks.metaDetailsVideos === 'string' ?
                deepLinks.metaDetailsVideos
                :
                typeof deepLinks.player === 'string' ?
                    deepLinks.player
                    :
                    null;
    }, [item]);

    const metaInfo = React.useMemo(() => {
        if (!item) {
            return [];
        }
        const parts = [];
        if (typeof item.releaseInfo === 'string' && item.releaseInfo.length > 0) {
            parts.push(item.releaseInfo);
        }
        if (typeof item.runtime === 'string' && item.runtime.length > 0) {
            parts.push(item.runtime);
        }
        if (Array.isArray(item.genres) && item.genres.length > 0) {
            parts.push(item.genres.slice(0, 3).join(' · '));
        }
        return parts;
    }, [item]);

    const renderLogoFallback = React.useCallback(() => (
        <div className={styles['hero-name']}>{item ? item.name : ''}</div>
    ), [item]);

    if (!item) {
        return null;
    }

    const background = typeof item.background === 'string' && item.background.length > 0 ?
        item.background
        :
        item.poster;

    return (
        <div className={classnames(className, styles['board-hero-container'])} onFocus={onFocus} onBlur={onBlur}>
            <div key={safeIndex} className={classnames(styles['hero-slide'], 'animation-fade-in')}>
                {
                    typeof background === 'string' && background.length > 0 ?
                        <div className={styles['background-layer']}>
                            <Image className={styles['background-image']} src={background} alt={' '} />
                        </div>
                        :
                        null
                }
                <div className={styles['shade-bottom']} />
                <div className={styles['shade-left']} />
                <div className={styles['info-container']}>
                    {
                        typeof item.logo === 'string' && item.logo.length > 0 ?
                            <Image
                                className={styles['hero-logo']}
                                src={item.logo}
                                alt={' '}
                                title={item.name}
                                renderFallback={renderLogoFallback}
                            />
                            :
                            renderLogoFallback()
                    }
                    {
                        metaInfo.length > 0 ?
                            <div className={styles['meta-info']}>
                                {
                                    typeof item.imdbRating === 'string' && item.imdbRating.length > 0 ?
                                        <div className={styles['rating']}>
                                            <Icon className={styles['rating-icon']} name={'imdb'} />
                                            <div className={styles['rating-label']}>{item.imdbRating}</div>
                                        </div>
                                        :
                                        null
                                }
                                {
                                    metaInfo.map((part, partIndex) => (
                                        <div key={partIndex} className={styles['meta-info-item']}>{part}</div>
                                    ))
                                }
                            </div>
                            :
                            null
                    }
                    {
                        typeof item.description === 'string' && item.description.length > 0 ?
                            <div className={styles['description']}>{item.description}</div>
                            :
                            null
                    }
                    {
                        typeof href === 'string' ?
                            <Button className={styles['play-button']} href={href} title={item.name}>
                                <Icon className={styles['play-icon']} name={'play'} />
                                <div className={styles['play-label']}>{t('SHOW')}</div>
                            </Button>
                            :
                            null
                    }
                </div>
            </div>
            {
                count > 1 ?
                    <div className={styles['dots-container']}>
                        {items.map((_, dotIndex) => (
                            <div
                                key={dotIndex}
                                className={classnames(styles['dot'], { [styles['dot-active']]: dotIndex === safeIndex })}
                            />
                        ))}
                    </div>
                    :
                    null
            }
        </div>
    );
};

BoardHero.propTypes = {
    className: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        logo: PropTypes.string,
        poster: PropTypes.string,
        background: PropTypes.string,
        description: PropTypes.string,
        releaseInfo: PropTypes.string,
        runtime: PropTypes.string,
        imdbRating: PropTypes.string,
        genres: PropTypes.arrayOf(PropTypes.string),
        deepLinks: PropTypes.object,
    })),
};

module.exports = BoardHero;
