import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { useCancellableLoad } from './useCancellableLoad';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthorInbox } from '../components/library/AuthorInbox';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useCancellableLoad', () => {
  it('delivers rows when the loader resolves while still current', async () => {
    const held = deferred<string[]>();
    const onData = vi.fn();

    const { result } = renderHook(() => useCancellableLoad(() => held.promise, [1], onData));
    expect(result.current.loading).toBe(true);

    await act(async () => held.resolve(['a row']));

    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith(['a row']);
    expect(result.current.loading).toBe(false);
  });

  it('discards a response that resolves after unmount, logging no React warning', async () => {
    const held = deferred<string[]>();
    const onData = vi.fn();
    const errorSpy = vi.spyOn(console, 'error');

    const { unmount } = renderHook(() => useCancellableLoad(() => held.promise, [1], onData));
    unmount();

    await act(async () => held.resolve(['too late']));

    expect(onData).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('discards the stale response when deps change while it is in flight', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const loaders = [() => first.promise, () => second.promise];
    const onData = vi.fn();

    const { rerender } = renderHook(
      ({ dep }) => useCancellableLoad(loaders[dep], [dep], onData),
      { initialProps: { dep: 0 } }
    );

    rerender({ dep: 1 });

    await act(async () => first.resolve(['stale']));
    expect(onData).not.toHaveBeenCalled();

    await act(async () => second.resolve(['fresh']));
    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith(['fresh']);
  });

  it('re-arms loading on a deps change and delivers only the new result', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const loaders = [() => first.promise, () => second.promise];
    const onData = vi.fn();

    const { rerender, result } = renderHook(
      ({ dep }) => useCancellableLoad(loaders[dep], [dep], onData),
      { initialProps: { dep: 0 } }
    );

    await act(async () => first.resolve(['first']));
    expect(result.current.loading).toBe(false);

    rerender({ dep: 1 });
    expect(result.current.loading).toBe(true);

    await act(async () => second.resolve(['second']));
    expect(result.current.loading).toBe(false);
    expect(onData).toHaveBeenLastCalledWith(['second']);
  });

  it('clears loading without touching data when the loader rejects or resolves null', async () => {
    const onData = vi.fn();

    const nullCase = renderHook(() => useCancellableLoad(() => Promise.resolve(null), [1], onData));
    await act(async () => {});
    expect(onData).not.toHaveBeenCalled();
    expect(nullCase.result.current.loading).toBe(false);

    const held = deferred<string[]>();
    const rejectCase = renderHook(() => useCancellableLoad(() => held.promise, [1], onData));
    await act(async () => held.reject(new Error('network down')));
    expect(onData).not.toHaveBeenCalled();
    expect(rejectCase.result.current.loading).toBe(false);
  });

  it('refetch() supersedes an in-flight call so only its own result lands', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    let call = 0;
    const loader = () => (call++ === 0 ? first.promise : second.promise);
    const onData = vi.fn();

    const { result } = renderHook(() => useCancellableLoad(loader, [1], onData));

    act(() => result.current.refetch());
    expect(result.current.loading).toBe(true);

    await act(async () => first.resolve(['superseded']));
    expect(onData).not.toHaveBeenCalled();

    await act(async () => second.resolve(['refetch result']));
    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith(['refetch result']);
    expect(result.current.loading).toBe(false);
  });
});

describe('AuthorInbox reopen integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed a demo identity so AuthProvider starts a session (unconfigured test env).
    localStorage.setItem(
      'unsent_library_demo_profile',
      JSON.stringify({
        id: 'demo-test-1',
        pen_name: 'Test Heron',
        avatar_color: '#d4a373',
        created_at: new Date().toISOString(),
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shows loading again on reopen before the reload resolves', async () => {
    const view = (isOpen: boolean) => (
      <AuthProvider>
        <AuthorInbox isOpen={isOpen} onClose={() => {}} />
      </AuthProvider>
    );

    const { rerender } = render(view(false));
    rerender(view(true));
    await screen.findByText('Your postbox is quiet');

    rerender(view(false));

    // Reopen: loading must be re-armed at the reopen itself, before the
    // reload's promise has had a chance to resolve.
    rerender(view(true));
    expect(screen.getByText('Gathering correspondence...')).toBeInTheDocument();

    await screen.findByText('Your postbox is quiet');
  });
});
