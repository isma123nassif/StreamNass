// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const styles = require('./styles');

const FilmCard = ({ film }) => {
    const renderFallback = React.useCallback(() => (
        <div className={styles['poster-fallback']}>{film.title}</div>
    ), [film.title]);

    return (
        <Button className={styles['film-card']} href={film.href} title={film.title}>
            <div className={styles['poster-layer']}>
                <Image
                    className={styles['poster-image']}
                    src={film.poster}
                    alt={' '}
                    renderFallback={renderFallback}
                />
            </div>
            <div className={styles['film-title']} title={film.title}>{film.title}</div>
            {
                film.year ?
                    <div className={styles['film-year']}>{film.year}</div>
                    :
                    null
            }
        </Button>
    );
};

FilmCard.propTypes = {
    film: PropTypes.shape({
        title: PropTypes.string,
        year: PropTypes.string,
        poster: PropTypes.string,
        href: PropTypes.string,
    }),
};

const SagaCollection = ({ collection, loading, onClose }) => {
    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.code === 'Escape' || event.key === 'Escape' || event.key === 'GoBack' || event.keyCode === 461) {
                event.preventDefault();
                if (typeof onClose === 'function') {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    if (!collection) {
        return null;
    }

    const title = collection.title || collection.name || '';
    const films = Array.isArray(collection.films) ? collection.films : [];

    return (
        <div data-tv-scope="saga-collection" className={styles['saga-collection-container']}>
            {
                typeof collection.background === 'string' && collection.background.length > 0 ?
                    <div className={styles['backdrop-layer']}>
                        <Image className={styles['backdrop-image']} src={collection.background} alt={' '} />
                    </div>
                    :
                    null
            }
            <div className={styles['backdrop-shade']} />
            <div className={styles['content']}>
                <div className={styles['header']}>
                    <Button className={styles['back-button']} title={'Atrás'} onClick={onClose}>
                        <Icon className={styles['back-icon']} name={'chevron-back'} />
                    </Button>
                    <div className={styles['title']}>{title}</div>
                </div>
                <div className={styles['subtitle']}>
                    {`Colección de ${title} (Películas)`}
                </div>
                {
                    loading && films.length === 0 ?
                        <div className={styles['loading']}>Cargando…</div>
                        :
                        <div className={styles['films-container']}>
                            {films.map((film) => (
                                <FilmCard key={film.id} film={film} />
                            ))}
                        </div>
                }
            </div>
        </div>
    );
};

SagaCollection.propTypes = {
    collection: PropTypes.shape({
        name: PropTypes.string,
        title: PropTypes.string,
        background: PropTypes.string,
        films: PropTypes.array,
    }),
    loading: PropTypes.bool,
    onClose: PropTypes.func,
};

module.exports = SagaCollection;
