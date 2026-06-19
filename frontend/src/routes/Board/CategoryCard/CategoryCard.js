// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const styles = require('./styles');

const CategoryCard = ({ className, label, logo, background, href, brand, color, videoSrc }) => {
    const videoRef = React.useRef(null);

    const playVideo = React.useCallback(() => {
        const video = videoRef.current;
        if (video) {
            try {
                video.currentTime = 0;
                const playback = video.play();
                if (playback && typeof playback.catch === 'function') {
                    playback.catch(() => {});
                }
            } catch (error) { /* ignore */ }
        }
    }, []);

    const stopVideo = React.useCallback(() => {
        const video = videoRef.current;
        if (video) {
            try {
                video.pause();
                video.currentTime = 0;
            } catch (error) { /* ignore */ }
        }
    }, []);

    const renderLabel = React.useCallback(() => (
        <div className={styles['label']}>{label}</div>
    ), [label]);

    const containerStyle = typeof color === 'string' && color.length > 0 ?
        { '--brand-color': color }
        :
        undefined;

    return (
        <Button
            className={classnames(className, styles['category-card-container'], brand ? styles[`brand-${brand}`] : null)}
            style={containerStyle}
            href={href}
            title={label}
            onFocus={playVideo}
            onBlur={stopVideo}
            onMouseEnter={playVideo}
            onMouseLeave={stopVideo}
        >
            {
                typeof background === 'string' && background.length > 0 ?
                    <div className={styles['background-layer']}>
                        <Image className={styles['background-image']} src={background} alt={' '} />
                    </div>
                    :
                    null
            }
            {
                typeof videoSrc === 'string' && videoSrc.length > 0 ?
                    <video
                        ref={videoRef}
                        className={styles['video-layer']}
                        src={videoSrc}
                        muted={true}
                        loop={true}
                        playsInline={true}
                        preload={'none'}
                    />
                    :
                    null
            }
            <div className={styles['shade-layer']} />
            <div className={styles['sheen-layer']} />
            {
                typeof logo === 'string' && logo.length > 0 ?
                    <Image
                        className={styles['logo']}
                        src={logo}
                        alt={' '}
                        title={label}
                        renderFallback={renderLabel}
                    />
                    :
                    renderLabel()
            }
        </Button>
    );
};

CategoryCard.propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    logo: PropTypes.string,
    background: PropTypes.string,
    href: PropTypes.string,
    brand: PropTypes.string,
    color: PropTypes.string,
    videoSrc: PropTypes.string,
};

module.exports = CategoryCard;
