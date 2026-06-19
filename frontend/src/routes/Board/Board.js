// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const classnames = require('classnames');
const debounce = require('lodash.debounce');
const useTranslate = require('stremio/common/useTranslate');
const useBinaryState = require('stremio/common/useBinaryState');
const { useStreamingServer, useNotifications, withCoreSuspender, getVisibleChildrenRange, useProfile } = require('stremio/common');
const { ContinueWatchingItem, EventModal, MainNavBars, MetaItem, MetaRow } = require('stremio/components');
const useBoard = require('./useBoard');
const useGenreRows = require('./useGenreRows');
const useSagaCollections = require('./useSagaCollections');
const usePlatformRows = require('./usePlatformRows');
const useContinueWatchingPreview = require('./useContinueWatchingPreview');
const { fetchCollectionMeta } = require('./tmdbCollections');
const styles = require('./styles');
const BoardHero = require('./BoardHero');
const CategoryRow = require('./CategoryRow');
const SagaRow = require('./SagaRow');
const SagaList = require('./SagaList');
const SagaCollection = require('./SagaCollection');
const { default: StreamingServerWarning } = require('./StreamingServerWarning');

const THRESHOLD = 5;

const Board = () => {
    const t = useTranslate();
    const streamingServer = useStreamingServer();
    const continueWatchingPreview = useContinueWatchingPreview();
    const [board, loadBoardRows] = useBoard();
    const genreTiles = useGenreRows();
    const sagaCollections = useSagaCollections();
    const platformTiles = usePlatformRows();
    const [sagasModalOpen, openSagasModal, closeSagasModal] = useBinaryState(false);
    const [selectedCollection, setSelectedCollection] = React.useState(null);
    const onSelectSaga = React.useCallback((item) => {
        closeSagasModal();
        setSelectedCollection({
            loading: true,
            data: { id: item.id, title: item.title, name: item.name, background: item.background, films: [] }
        });
        fetchCollectionMeta(item.id).then((meta) => {
            setSelectedCollection((current) => (
                current && current.data.id === item.id ? { loading: false, data: meta || current.data } : current
            ));
        }).catch(() => {
            setSelectedCollection((current) => (
                current && current.data.id === item.id ? { loading: false, data: current.data } : current
            ));
        });
    }, [closeSagasModal]);
    const onCloseCollection = React.useCallback(() => setSelectedCollection(null), []);
    const topSagaCollections = React.useMemo(() => sagaCollections.slice(0, 12), [sagaCollections]);
    const notifications = useNotifications();
    const profile = useProfile();
    const featuredItems = React.useMemo(() => {
        const seen = new Set();
        const result = [];
        for (const catalog of board.catalogs) {
            if (catalog.content?.type !== 'Ready' || !Array.isArray(catalog.content.content)) {
                continue;
            }
            for (const item of catalog.content.content) {
                if (typeof item.background === 'string' && item.background.length > 0 && !seen.has(item.id)) {
                    seen.add(item.id);
                    result.push(item);
                    if (result.length >= 8) {
                        return result;
                    }
                }
            }
        }
        return result;
    }, [board.catalogs]);
    const boardCatalogsOffset = continueWatchingPreview.items.length > 0 ? 1 : 0;
    const scrollContainerRef = React.useRef();
    const showStreamingServerWarning = React.useMemo(() => {
        return streamingServer.settings !== null && streamingServer.settings.type === 'Err' && (
            isNaN(profile.settings.streamingServerWarningDismissed.getTime()) ||
            profile.settings.streamingServerWarningDismissed.getTime() < Date.now());
    }, [profile.settings, streamingServer.settings]);
    const onVisibleRangeChange = React.useCallback(() => {
        const range = getVisibleChildrenRange(scrollContainerRef.current);
        if (range === null) {
            return;
        }

        const start = Math.max(0, range.start - boardCatalogsOffset - THRESHOLD);
        const end = range.end - boardCatalogsOffset + THRESHOLD;
        if (end < start) {
            return;
        }

        loadBoardRows({ start, end });
    }, [boardCatalogsOffset]);
    const onScroll = React.useCallback(debounce(onVisibleRangeChange, 250), [onVisibleRangeChange]);
    React.useLayoutEffect(() => {
        onVisibleRangeChange();
    }, [board.catalogs, onVisibleRangeChange]);
    return (
        <div className={styles['board-container']}>
            <EventModal />
            <MainNavBars className={styles['board-content-container']} route={'board'}>
                <div ref={scrollContainerRef} className={styles['board-content']} onScroll={onScroll}>
                    {
                        featuredItems.length > 0 ?
                            <BoardHero className={styles['board-hero']} items={featuredItems} />
                            :
                            null
                    }
                    {
                        continueWatchingPreview.items.length > 0 ?
                            <MetaRow
                                className={classnames(styles['board-row'], styles['continue-watching-row'], 'animation-fade-in')}
                                title={t.string('BOARD_CONTINUE_WATCHING')}
                                catalog={continueWatchingPreview}
                                itemComponent={ContinueWatchingItem}
                                notifications={notifications}
                            />
                            :
                            null
                    }
                    <CategoryRow
                        className={classnames(styles['board-row'], 'animation-fade-in')}
                        title={'Plataformas de Streaming'}
                        items={platformTiles}
                    />
                    <CategoryRow
                        className={classnames(styles['board-row'], 'animation-fade-in')}
                        title={'Géneros'}
                        items={genreTiles}
                    />
                    <SagaRow
                        className={classnames(styles['board-row'], 'animation-fade-in')}
                        title={'Saga de películas favoritas'}
                        items={topSagaCollections}
                        onItemClick={onSelectSaga}
                        onSeeAll={openSagasModal}
                        seeAllLabel={'Ver más'}
                    />
                    {board.catalogs.map((catalog, index) => {
                        switch (catalog.content?.type) {
                            case 'Ready': {
                                return (
                                    <MetaRow
                                        key={index}
                                        className={classnames(styles['board-row'], styles[`board-row-${catalog.content.content[0].posterShape}`], 'animation-fade-in')}
                                        catalog={catalog}
                                        itemComponent={MetaItem}
                                    />
                                );
                            }
                            case 'Err': {
                                if (catalog.content.content !== 'EmptyContent') {
                                    return (
                                        <MetaRow
                                            key={index}
                                            className={classnames(styles['board-row'], 'animation-fade-in')}
                                            catalog={catalog}
                                            message={catalog.content.content}
                                        />
                                    );
                                }
                                return null;
                            }
                            default: {
                                return (
                                    <MetaRow.Placeholder
                                        key={index}
                                        className={classnames(styles['board-row'], styles['board-row-poster'], 'animation-fade-in')}
                                        catalog={catalog}
                                        title={t.catalogTitle(catalog)}
                                    />
                                );
                            }
                        }
                    })}
                </div>
            </MainNavBars>
            {
                showStreamingServerWarning ?
                    <StreamingServerWarning className={styles['board-warning-container']} />
                    :
                    null
            }
            {
                sagasModalOpen ?
                    <SagaList
                        title={'Todas las sagas'}
                        items={sagaCollections}
                        onItemClick={onSelectSaga}
                        onClose={closeSagasModal}
                    />
                    :
                    null
            }
            {
                selectedCollection ?
                    <SagaCollection
                        collection={selectedCollection.data}
                        loading={selectedCollection.loading}
                        onClose={onCloseCollection}
                    />
                    :
                    null
            }
        </div>
    );
};

const BoardFallback = () => (
    <div className={styles['board-container']}>
        <MainNavBars className={styles['board-content-container']} route={'board'} />
    </div>
);

module.exports = withCoreSuspender(Board, BoardFallback);
