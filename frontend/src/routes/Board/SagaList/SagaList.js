// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const SagaRow = require('../SagaRow');
const styles = require('./styles');

const SagaList = ({ title, items, onItemClick, onClose }) => {
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

    return (
        <div data-tv-scope="saga-list" className={styles['saga-list-container']}>
            <div className={styles['header']}>
                <Button className={styles['back-button']} title={'Atrás'} onClick={onClose}>
                    <Icon className={styles['back-icon']} name={'chevron-back'} />
                </Button>
                <div className={styles['title']}>{title}</div>
            </div>
            <div className={styles['grid']}>
                <SagaRow wrap items={items} onItemClick={onItemClick} />
            </div>
        </div>
    );
};

SagaList.propTypes = {
    title: PropTypes.string,
    items: PropTypes.array,
    onItemClick: PropTypes.func,
    onClose: PropTypes.func,
};

module.exports = SagaList;
