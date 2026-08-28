import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** Tracks whether the viewport is narrow enough to be treated as mobile.
 *
 *  Read through useSyncExternalStore rather than an effect: the media
 *  query is external state, and subscribing to it directly avoids the
 *  extra render an effect-plus-setState pair would cause. */
export function useIsMobile() {
  const subscribe = React.useCallback((onChange: () => void) => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    // The server has no viewport; assume desktop and let the client
    // correct it on hydration.
    () => false,
  );
}
