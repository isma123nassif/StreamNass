// Filas extra al pie de la pagina de detalle (optimizado TV):
//  1) Parrilla del reparto con foto (TMDB).
//  2) Recomendaciones similares (addon Watch Next).
// Solo presentacion + navegacion con mando; no toca el core.

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { default: Image } = require('stremio/components/Image');
const { default: Button } = require('stremio/components/Button');
const useMetaExtras = require('../useMetaExtras');
const styles = require('./styles');

const initials = (name) => {
    if (typeof name !== 'string') {
        return '?';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const MetaExtras = ({ className, type, id }) => {
    const { t } = useTranslation();
    const { cast, recommendations } = useMetaExtras({ type, id });

    if (cast.length === 0 && recommendations.length === 0) {
        return null;
    }

    return (
        <div className={classnames(className, styles['meta-extras'])}>
            {
                cast.length > 0 ?
                    <div className={styles['extras-section']}>
                        <div className={styles['section-title']}>{t('CAST') || 'Cast'}</div>
                        <div className={styles['row']}>
                            {cast.map((person) => (
                                <div key={person.id} className={styles['cast-card']} tabIndex={0} title={person.name}>
                                    <div className={styles['avatar']}>
                                        {
                                            person.photo ?
                                                <Image
                                                    className={styles['avatar-image']}
                                                    src={person.photo}
                                                    alt={' '}
                                                    renderFallback={() => (
                                                        <div className={styles['avatar-fallback']}>{initials(person.name)}</div>
                                                    )}
                                                />
                                                :
                                                <div className={styles['avatar-fallback']}>{initials(person.name)}</div>
                                        }
                                    </div>
                                    <div className={styles['cast-name']}>{person.name}</div>
                                    {
                                        person.character ?
                                            <div className={styles['cast-character']}>{person.character}</div>
                                            :
                                            null
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                    :
                    null
            }
            {
                recommendations.length > 0 ?
                    <div className={styles['extras-section']}>
                        <div className={styles['section-title']}>{t('SIMILAR') || 'Recommended'}</div>
                        <div className={styles['row']}>
                            {recommendations.map((item) => (
                                <Button key={item.id} className={styles['rec-card']} href={item.deepLink} title={item.name} tabIndex={0}>
                                    <div className={styles['poster']}>
                                        <Image
                                            className={styles['poster-image']}
                                            src={item.poster}
                                            alt={' '}
                                            renderFallback={() => (
                                                <div className={styles['poster-fallback']}>{item.name}</div>
                                            )}
                                        />
                                    </div>
                                    <div className={styles['rec-name']}>{item.name}</div>
                                </Button>
                            ))}
                        </div>
                    </div>
                    :
                    null
            }
        </div>
    );
};

MetaExtras.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    id: PropTypes.string
};

module.exports = MetaExtras;
