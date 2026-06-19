// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');
const { fetchCollections } = require('./tmdbCollections');

const useSagaCollections = () => {
    const [items, setItems] = React.useState([]);

    React.useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        fetchCollections('ctmdb.topRated', controller.signal).then((resolved) => {
            if (!cancelled) {
                setItems(resolved);
            }
        }).catch(() => {});
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    return items;
};

module.exports = useSagaCollections;
