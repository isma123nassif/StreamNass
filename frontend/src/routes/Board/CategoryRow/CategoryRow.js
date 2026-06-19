// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const CategoryCard = require('../CategoryCard');
const styles = require('./styles');

const CategoryRow = ({ className, title, items, wrap, onSeeAll, seeAllLabel }) => {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    return (
        <div className={classnames(className, styles['category-row-container'])}>
            {
                (typeof title === 'string' && title.length > 0) || typeof onSeeAll === 'function' ?
                    <div className={styles['header-container']}>
                        {
                            typeof title === 'string' && title.length > 0 ?
                                <div className={styles['title-container']} title={title}>{title}</div>
                                :
                                <div className={styles['title-container']} />
                        }
                        {
                            typeof onSeeAll === 'function' ?
                                <Button className={styles['see-all-container']} title={seeAllLabel} onClick={onSeeAll}>
                                    <div className={styles['label']}>{seeAllLabel}</div>
                                    <Icon className={styles['icon']} name={'chevron-forward'} />
                                </Button>
                                :
                                null
                        }
                    </div>
                    :
                    null
            }
            <div className={classnames(styles['cards-container'], { [styles['wrap']]: wrap })}>
                {items.map((item) => (
                    <CategoryCard
                        key={item.id}
                        className={styles['category-card']}
                        label={item.label}
                        logo={item.logo}
                        background={item.background}
                        href={item.href}
                        brand={item.brand}
                        color={item.color}
                        videoSrc={item.videoSrc}
                    />
                ))}
            </div>
        </div>
    );
};

CategoryRow.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    wrap: PropTypes.bool,
    onSeeAll: PropTypes.func,
    seeAllLabel: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        logo: PropTypes.string,
        background: PropTypes.string,
        href: PropTypes.string,
    })),
};

module.exports = CategoryRow;
