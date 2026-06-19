// Copyright (C) 2017-2025 Smart code 203358507

import React from 'react';

const RouteFocusedContext = React.createContext(true);

const useRouteFocused = () => {
    const routeFocused = React.useContext(RouteFocusedContext);
    // On webOS / TV the app window reports document.hasFocus() === false even while
    // fully visible and interactive. Gating model-state updates on hasFocus() would
    // wrongly freeze them, leaving async-loaded models (board, Discover catalogs)
    // permanently empty. Page visibility is the correct signal for a fullscreen TV
    // app — it still pauses updates when webOS backgrounds the app.
    const [isVisible, setIsVisible] = React.useState(() => document.visibilityState !== 'hidden');

    React.useEffect(() => {
        const handleVisibility = () => setIsVisible(document.visibilityState !== 'hidden');

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return routeFocused && isVisible;
};

export const RouteFocusedProvider = RouteFocusedContext.Provider;

export default useRouteFocused;
