// Copyright (C) 2017-2024 Smart code 203358507

const React = require('react');

// Every element the content area treats as focusable. Button always renders
// tabindex="0"; native links/buttons/inputs are focusable too.
const FOCUSABLE_SELECTOR = [
    '[tabindex="0"]',
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])'
].join(', ');

// The nav bars (top + left) use tabindex="-1" on purpose (Stremio drives them
// with its own gamepad service). For our engine we still want to reach them, so
// inside those regions we also accept tabindex="-1" elements.
const NAV_FOCUSABLE_SELECTOR = [
    '[tabindex]',
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])'
].join(', ');

const DIR_BY_KEY = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const DIR_BY_CODE = { 38: 'up', 40: 'down', 37: 'left', 39: 'right' };
const directionOf = (event) => DIR_BY_KEY[event.key] || DIR_BY_CODE[event.keyCode] || null;

// webOS remote Back button = keyCode 461 (also exposed as the 'GoBack' key).
const isBackKey = (event) => event.keyCode === 461 || event.key === 'GoBack' || event.key === 'BrowserBack';

// Home/root route (stremio-web board): hash '#/', '#' or '#/board'.
const isRootRoute = () => {
    const path = (window.location.hash || '').replace(/^#/, '').split('?')[0];
    return /^\/?(?:board)?$/.test(path);
};

// Identity of the current route for focus memory: the hash path without its
// query string. Different catalogs / genres (different path) get their own
// slot, so switching genre seeds fresh while returning from a detail page
// restores the previous position.
const routeKey = () => (window.location.hash || '').replace(/^#/, '').split('?')[0] || '/';

// Close whatever overlay (modal / popup / our saga pages) is open by synthesising
// an Escape key press: ModalDialog/Popup close on code 'Escape', the saga overlays
// on key 'Escape'.
const dispatchEscape = () => {
    const target = document.activeElement || document;
    target.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
    }));
};

// Tolerance (px) so roughly-aligned items still count as being in a direction.
const TOL = 6;
// Cross-axis penalty: horizontal moves must stay on the same row (big penalty);
// vertical moves prefer the nearest column but may shift.
const CROSS_WEIGHT = { up: 2, down: 2, left: 30, right: 30 };

const isVisible = (el) => el.offsetParent !== null || el.getClientRects().length > 0;

// The video player owns the arrow keys (seek / volume / its own control nav), so
// we step aside there and let the player + the spatial-navigation polyfill work.
const isPlayerRoute = () => (window.location.hash || '').indexOf('#/player') === 0;

// ---- Regions -------------------------------------------------------------
// MainNavBars marks three regions: the top bar (search / fullscreen / menu),
// the left side bar (Board / Discover / Library / …) and the content area.
// Navigating between them is explicit (edge jumps), so the side bar is always
// reachable regardless of how the content rows happen to be scrolled.
//
// IMPORTANT: Stremio's router keeps several routes mounted at once (the inactive
// ones are hidden), so there can be MORE THAN ONE of each marker in the DOM. We
// must always operate on the VISIBLE (current route) instance — picking the
// first match would target a hidden route and make navigation appear dead.
const visibleMarker = (selector) => {
    const nodes = document.querySelectorAll(selector);
    let fallback = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
        if (fallback === null) {
            fallback = nodes[i];
        }
        if (isVisible(nodes[i])) {
            return nodes[i];
        }
    }
    return fallback;
};
const getTopbar = () => visibleMarker('[data-tv-topbar]');
const getSidebar = () => visibleMarker('[data-tv-sidebar]');
const getContent = () => visibleMarker('[data-tv-content]') ||
    document.querySelector('.routes-container') || document.body;

// Overlay that traps focus (native modals, popups, our full-screen saga pages).
const hasVisibleFocusable = (root, selector) => {
    const nodes = root.querySelectorAll(selector || FOCUSABLE_SELECTOR);
    for (let i = 0; i < nodes.length; i++) {
        if (isVisible(nodes[i])) {
            return true;
        }
    }
    return false;
};

const getOverlayScope = () => {
    const modals = document.querySelector('.modals-container');
    if (modals && hasVisibleFocusable(modals)) {
        return modals;
    }
    const scopes = document.querySelectorAll('[data-tv-scope]');
    for (let i = scopes.length - 1; i >= 0; i--) {
        if (isVisible(scopes[i]) && hasVisibleFocusable(scopes[i])) {
            return scopes[i];
        }
    }
    return null;
};

const collectFocusables = (root, selector) => {
    const out = [];
    if (!root) {
        return out;
    }
    const nodes = root.querySelectorAll(selector || FOCUSABLE_SELECTOR);
    for (let i = 0; i < nodes.length; i++) {
        // [data-tv-skip] marks a subtree as off-limits to the D-pad (e.g. the
        // movie/series meta info — genre/cast/director links and synopsis — so the
        // remote stays on the source list instead of wandering into read-only text).
        if (isVisible(nodes[i]) && !nodes[i].closest('[data-tv-skip]')) {
            out.push(nodes[i]);
        }
    }
    return out;
};

const regionOf = (el) => {
    if (!el) {
        return null;
    }
    const sidebar = getSidebar();
    if (sidebar && sidebar.contains(el)) {
        return 'sidebar';
    }
    const topbar = getTopbar();
    if (topbar && topbar.contains(el)) {
        return 'topbar';
    }
    return 'content';
};

// Geometrically nearest focusable from `origin` in direction `dir`.
const bestCandidate = (origin, dir, items) => {
    const o = origin.getBoundingClientRect();
    const ocx = o.left + o.width / 2;
    const ocy = o.top + o.height / 2;
    const weight = CROSS_WEIGHT[dir];
    let best = null;
    let bestScore = Infinity;

    for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (el === origin) {
            continue;
        }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        let primary;
        let cross;
        switch (dir) {
            case 'up':
                if (r.bottom > o.top + TOL) { continue; }
                primary = o.top - r.bottom;
                cross = Math.abs(cx - ocx);
                break;
            case 'down':
                if (r.top < o.bottom - TOL) { continue; }
                primary = r.top - o.bottom;
                cross = Math.abs(cx - ocx);
                break;
            case 'left':
                if (r.right > o.left + TOL) { continue; }
                primary = o.left - r.right;
                cross = Math.abs(cy - ocy);
                break;
            case 'right':
                if (r.left < o.right - TOL) { continue; }
                primary = r.left - o.right;
                cross = Math.abs(cy - ocy);
                break;
            default:
                continue;
        }

        const score = Math.max(primary, 0) + cross * weight;
        if (score < bestScore) {
            bestScore = score;
            best = el;
        }
    }
    return best;
};

// Closest focusable in `items` to `origin` along one axis ('y' = vertical
// centre, 'x' = horizontal centre). Used for edge jumps between regions.
const nearestByAxis = (origin, items, axis) => {
    if (!origin || items.length === 0) {
        return items[0] || null;
    }
    const o = origin.getBoundingClientRect();
    const oc = axis === 'y' ? o.top + o.height / 2 : o.left + o.width / 2;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const c = axis === 'y' ? r.top + r.height / 2 : r.left + r.width / 2;
        const dist = Math.abs(c - oc);
        if (dist < bestDist) {
            bestDist = dist;
            best = items[i];
        }
    }
    return best;
};

const moveFocus = (el) => {
    if (!el) {
        return;
    }
    el.focus();
    // Keep the focused item centered (content slides under a fixed focus). Instant,
    // not smooth — smooth scrolling stutters on the TV's browser.
    try {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
    } catch (_) {
        el.scrollIntoView(false);
    }
};

// App-wide D-pad / TV remote focus engine. Replaces the spatial-navigation
// polyfill's key handling. Arrow keys move focus to the nearest element in that
// direction (never page-scroll); at a region edge they jump to the adjacent
// region (content ⇄ side bar ⇄ top bar). Focus always starts in the content.
const useTVNavigation = () => {
    React.useEffect(() => {
        // Per-route memory of the last focused content element. stremio-web keeps
        // inactive routes mounted (hidden), so the stored node typically survives a
        // round-trip (e.g. Discover → details → Back) and can be re-focused. Keyed
        // by route path; also covers returning from the side / top bar in-route.
        const focusByRoute = new Map();
        const getRouteFocus = () => focusByRoute.get(routeKey()) || null;
        const setRouteFocus = (el) => {
            if (!el) {
                return;
            }
            const key = routeKey();
            focusByRoute.delete(key);
            focusByRoute.set(key, el);
            // Bound the memory so long browsing sessions don't grow it unbounded.
            if (focusByRoute.size > 40) {
                focusByRoute.delete(focusByRoute.keys().next().value);
            }
        };

        // Put focus in the content area on load and after a content change.
        const seedContentFocus = () => {
            if (isPlayerRoute()) {
                return;
            }
            // Returning to a route we've visited: restore the element that was
            // focused there, unless the user is already somewhere valid in content.
            const remembered = getRouteFocus();
            if (remembered && document.contains(remembered) && isVisible(remembered)) {
                const current = document.activeElement;
                const alreadyInContent = current && current !== document.body &&
                    isVisible(current) && regionOf(current) === 'content';
                if (!alreadyInContent) {
                    moveFocus(remembered);
                }
                return;
            }
            const content = getContent();
            // A route can nominate where focus should land first (e.g. the poster
            // grid, skipping filter dropdowns) via [data-tv-focus-default].
            const preferred = content.querySelector('[data-tv-focus-default]');
            if (preferred) {
                const items = collectFocusables(preferred);
                if (items.length === 0) {
                    // Not loaded yet — wait for a later retry, don't grab a filter.
                    return;
                }
                const active = document.activeElement;
                if (active && preferred.contains(active)) {
                    // User is already inside the grid — leave their position.
                    return;
                }
                moveFocus(items[0]);
                setRouteFocus(items[0]);
                return;
            }
            // No nominated area: seed when nothing meaningful is focused, or when
            // focus is parked in a nav bar (e.g. the user just opened this section
            // from the side bar — move into its content).
            const active = document.activeElement;
            const inNavBar = active && (regionOf(active) === 'sidebar' || regionOf(active) === 'topbar');
            if (active && active !== document.body && isVisible(active) && !inNavBar) {
                return;
            }
            const items = collectFocusables(content);
            if (items.length > 0) {
                moveFocus(items[0]);
                setRouteFocus(items[0]);
            }
        };

        const enterContent = (origin) => {
            const content = getContent();
            const items = collectFocusables(content);
            if (items.length === 0) {
                return false;
            }
            const remembered = getRouteFocus();
            if (remembered && content.contains(remembered) && isVisible(remembered)) {
                moveFocus(remembered);
                return true;
            }
            const target = origin ? nearestByAxis(origin, items, 'y') : items[0];
            moveFocus(target || items[0]);
            return true;
        };

        // Long-press OK (Enter) on a "Continue Watching" poster removes it; a short
        // press still plays. Such items expose the dismiss target via [data-tv-dismiss].
        let okHeld = false;
        let okTimer = null;
        let okLongFired = false;
        const DISMISS_HOLD_MS = 500;
        const isEnter = (event) => event.key === 'Enter' || event.keyCode === 13;
        const onKeyUp = (event) => {
            if (!isEnter(event) || !okHeld) {
                return;
            }
            okHeld = false;
            clearTimeout(okTimer);
            if (!okLongFired) {
                // Short press: trigger the focused item's normal action (play).
                const active = document.activeElement;
                if (active && typeof active.click === 'function') {
                    active.click();
                }
            }
            okLongFired = false;
        };

        const onKeyDown = (event) => {
            // The video player owns ALL remote keys (its own TV control scheme in
            // Player.js handles arrows / OK / Back). Stay completely out of the way.
            if (isPlayerRoute()) {
                return;
            }
            // Long-press OK removes a Continue Watching item; short press plays it.
            if (isEnter(event)) {
                const active = document.activeElement;
                const dismissEl = active && typeof active.querySelector === 'function' ?
                    active.querySelector('[data-tv-dismiss]') : null;
                if (dismissEl) {
                    // Take over Enter so the button doesn't play immediately; the hold
                    // duration decides (keyup before timer = play, timer fires = dismiss).
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    if (!okHeld) {
                        okHeld = true;
                        okLongFired = false;
                        okTimer = setTimeout(() => {
                            okLongFired = true;
                            dismissEl.click();
                        }, DISMISS_HOLD_MS);
                    }
                    return;
                }
            }
            // Back button: close an open overlay, else go back one route.
            if (isBackKey(event)) {
                const overlay = getOverlayScope();
                if (overlay) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    dispatchEscape();
                    return;
                }
                if (!isRootRoute()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    window.history.back();
                }
                // At the home root: let the system handle it (exit / minimise).
                return;
            }

            const dir = directionOf(event);
            if (!dir) {
                return;
            }
            // Player owns the arrows — stay out of the way entirely.
            if (isPlayerRoute()) {
                return;
            }
            const active = document.activeElement;
            if (active) {
                // Multiline fields keep all arrows for the caret.
                if (active.nodeName === 'TEXTAREA') {
                    return;
                }
                // Single-line fields keep left/right for the caret, but up/down
                // navigate out of the field.
                if (active.nodeName === 'INPUT' && (dir === 'left' || dir === 'right')) {
                    return;
                }
            }

            // We own the arrow keys: no native page scroll, no polyfill handling.
            event.preventDefault();
            event.stopImmediatePropagation();

            // Overlays trap navigation inside themselves.
            const overlay = getOverlayScope();
            if (overlay) {
                const items = collectFocusables(overlay);
                if (items.length === 0) {
                    return;
                }
                if (!active || active === document.body || !overlay.contains(active)) {
                    moveFocus(items[0]);
                } else {
                    moveFocus(bestCandidate(active, dir, items) || active);
                }
                return;
            }

            const region = regionOf(active);

            // ---- Side bar (left column) ----
            if (region === 'sidebar') {
                const items = collectFocusables(getSidebar(), NAV_FOCUSABLE_SELECTOR);
                if (dir === 'up' || dir === 'down') {
                    moveFocus(bestCandidate(active, dir, items) || active);
                } else if (dir === 'right') {
                    enterContent(active);
                }
                // left: already at the far edge — nothing to do.
                return;
            }

            // ---- Top bar (search / fullscreen / menu) ----
            if (region === 'topbar') {
                const items = collectFocusables(getTopbar(), NAV_FOCUSABLE_SELECTOR);
                if (dir === 'left' || dir === 'right') {
                    moveFocus(bestCandidate(active, dir, items) || active);
                } else if (dir === 'down') {
                    enterContent(active);
                }
                // up: nothing above.
                return;
            }

            // ---- Content area ----
            const content = getContent();
            const items = collectFocusables(content);
            if (items.length === 0) {
                return;
            }
            if (!active || active === document.body || !content.contains(active)) {
                moveFocus(items[0]);
                setRouteFocus(items[0]);
                return;
            }
            let next = bestCandidate(active, dir, items);
            if (!next) {
                // At a content edge: jump to the adjacent region.
                if (dir === 'left') {
                    const sidebarItems = collectFocusables(getSidebar(), NAV_FOCUSABLE_SELECTOR);
                    next = nearestByAxis(active, sidebarItems, 'y');
                } else if (dir === 'up') {
                    const topbarItems = collectFocusables(getTopbar(), NAV_FOCUSABLE_SELECTOR);
                    next = nearestByAxis(active, topbarItems, 'x');
                }
            }
            if (next) {
                moveFocus(next);
                if (regionOf(next) === 'content') {
                    setRouteFocus(next);
                }
            }
        };

        // Capture phase so we run before the polyfill's (bubble) window listener.
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);

        // Give focus a home on first load and whenever the route / query changes
        // (e.g. picking a genre reloads the catalog). Content can arrive a beat
        // after the route does (async catalogs), so retry a few times.
        const timers = [100, 400, 900, 1600].map((ms) => setTimeout(seedContentFocus, ms));
        const onHashChange = () => {
            [80, 350, 700, 1200, 1800].forEach((ms) => timers.push(setTimeout(seedContentFocus, ms)));
        };
        window.addEventListener('hashchange', onHashChange);

        return () => {
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
            window.removeEventListener('hashchange', onHashChange);
            clearTimeout(okTimer);
            timers.forEach(clearTimeout);
        };
    }, []);
};

module.exports = useTVNavigation;
