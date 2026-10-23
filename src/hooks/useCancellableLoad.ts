import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

const sameDeps = (a: DependencyList, b: DependencyList): boolean =>
  a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

/**
 * Runs `loader` on mount and whenever `deps` change, delivering the result to
 * `onData` only if it is still the current load — any response that resolves
 * after unmount, after a deps change, or after a `refetch()` is discarded
 * without touching state (KTD4's mount/cleanup/resolve ordering).
 *
 * `loading` starts true, re-arms on every deps change and on `refetch()`, and
 * clears only when the current load settles (resolve or rejection); a stale
 * load never clears it.
 */
export function useCancellableLoad<T>(
  loader: () => Promise<T | null | undefined>,
  deps: DependencyList,
  onData: (data: T) => void
): { loading: boolean; refetch: () => void } {
  const [loading, setLoading] = useState(true);
  const [prevDeps, setPrevDeps] = useState<DependencyList>(deps);
  const tokenRef = useRef(0);
  const loaderRef = useRef(loader);
  const onDataRef = useRef(onData);

  // Re-arm loading during render when deps change — the React-sanctioned
  // "adjust state when props change" pattern, so the effect body itself never
  // calls setState synchronously.
  if (!sameDeps(prevDeps, deps)) {
    setPrevDeps(deps);
    setLoading(true);
  }

  // Keep the latest loader/callback for any run the effects below start.
  useLayoutEffect(() => {
    loaderRef.current = loader;
    onDataRef.current = onData;
  });

  const run = useCallback(() => {
    const token = ++tokenRef.current;
    loaderRef.current().then(
      (rows) => {
        if (token !== tokenRef.current) return; // superseded or unmounted
        if (rows != null) onDataRef.current(rows);
        setLoading(false);
      },
      () => {
        if (token !== tokenRef.current) return;
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    run();
    return () => {
      // Invalidate in-flight work whenever deps change again or we unmount.
      tokenRef.current += 1;
    };
    // Caller-supplied deps are the contract; prevDeps above mirrors them for
    // the loading re-arm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    setLoading(true);
    run();
  }, [run]);

  return { loading, refetch };
}
