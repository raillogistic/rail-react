import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../EventBus';
import { AuthEventPayloads } from '../../types';

describe('EventBus', () => {
  let eventBus: EventBus;
  const channelName = 'test-auth-events';

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus = new EventBus({
      channelName,
      debounceMs: 100,
      enableCrossTab: false, // Mock BroadcastChannel if needed, but for unit test simpler to disable or mock
    });
  });

  afterEach(() => {
    eventBus.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('subscribes and emits local events', () => {
    const handler = vi.fn();
    eventBus.on('auth:login_started', handler);

    eventBus.emitLocal('auth:login_started', { username: 'testuser' });

    expect(handler).toHaveBeenCalledWith({ username: 'testuser' });
  });

  it('unsubscribes correctly', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('auth:login_started', handler);

    unsubscribe();
    eventBus.emitLocal('auth:login_started', { username: 'testuser' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('debounces events when using emit()', () => {
    const handler = vi.fn();
    eventBus.on('auth:login_started', handler);

    // Emit multiple times rapidly
    eventBus.emit('auth:login_started', { username: 'user1' });
    eventBus.emit('auth:login_started', { username: 'user1' });
    eventBus.emit('auth:login_started', { username: 'user1' });

    // Should not have been called yet
    expect(handler).not.toHaveBeenCalled();

    // Fast forward time
    vi.advanceTimersByTime(100);

    // Should be called once
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ username: 'user1' });
  });

  it('does not debounce different events/payloads', () => {
    const handler = vi.fn();
    eventBus.on('auth:login_started', handler);

    eventBus.emit('auth:login_started', { username: 'user1' });
    eventBus.emit('auth:login_started', { username: 'user2' });

    vi.advanceTimersByTime(100);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith({ username: 'user1' });
    expect(handler).toHaveBeenCalledWith({ username: 'user2' });
  });

  it('handles cross-tab communication', () => {
    // Mock BroadcastChannel
    const postMessageMock = vi.fn();
    const closeMock = vi.fn();

    class MockBroadcastChannel {
      postMessage = postMessageMock;
      close = closeMock;
      onmessage = null;
      constructor(name: string) {}
    }

    // @ts-ignore
    global.BroadcastChannel = MockBroadcastChannel;

    const bus = new EventBus({
      channelName,
      debounceMs: 0,
      enableCrossTab: true,
    });

    bus.emitLocal('auth:login_success', {
      user: { id: '1', email: 'test@example.com', roles: [], permissions: [] },
      sessionId: 'sess-1'
    });

    // emitLocal should NOT broadcast
    expect(postMessageMock).not.toHaveBeenCalled();

    bus.emit('auth:login_success', {
      user: { id: '1', email: 'test@example.com', roles: [], permissions: [] },
      sessionId: 'sess-1'
    });

    // emit (debounced) should broadcast eventually
    vi.advanceTimersByTime(0); // Since debounceMs is 0

    expect(postMessageMock).toHaveBeenCalled();
  });
});
