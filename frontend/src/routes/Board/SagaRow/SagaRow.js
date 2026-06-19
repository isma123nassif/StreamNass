// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const SagaPoster = require('../SagaPoster');
const styles = require('./styles');

const SagaRow = ({ className, title, items, wrap, onItemClick, onSeeAll, seeAllLabel }) => {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    return (
        <div className={classnames(className, styles['saga-row-container'])}>
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
            <div className={classnames(styles['posters-container'], { [styles['wrap']]: wrap })}>
                {items.map((item) => (
                    <SagaPoster
                        key={item.id}
                        className={styles['saga-poster']}
                        name={item.title || item.name}
                        poster={item.poster}
                        onClick={typeof onItemClick === 'function' ? () => onItemClick(item) : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

SagaRow.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    wrap: PropTypes.bool,
    onItemClick: PropTypes.func,
    onSeeAll: PropTypes.func,
    seeAllLabel: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        title: PropTypes.string,
        poster: PropTypes.string,
    })),
};

module.exports = SagaRow;
