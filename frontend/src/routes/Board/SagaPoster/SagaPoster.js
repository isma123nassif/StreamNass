// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const styles = require('./styles');

const SagaPoster = ({ className, name, poster, onClick }) => {
    const renderFallback = React.useCallback(() => (
        <div className={styles['poster-fallback']}>{name}</div>
    ), [name]);

    return (
        <Button className={classnames(className, styles['saga-poster-container'])} title={name} onClick={onClick}>
            <div className={styles['poster-layer']}>
                <Image
                    className={styles['poster-image']}
                    src={poster}
                    alt={' '}
                    renderFallback={renderFallback}
                />
            </div>
        </Button>
    );
};

SagaPoster.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    poster: PropTypes.string,
    onClick: PropTypes.func,
};

module.exports = SagaPoster;
