import type { AuthEventType, AuthEventPayloads, Unsubscribe } from '../types';

interface EventBusConfig {
  channelName: string;
  debounceMs: number;
  enableCrossTab: boolean;
}

export class EventBus {
  private config: EventBusConfig;
  private channel: BroadcastChannel | null = null;
  private listeners = new Map<AuthEventType, Set<Function>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(config: EventBusConfig) {
    this.config = config;
    if (config.enableCrossTab && typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(config.channelName);
      this.channel.onmessage = this.handleCrossTabMessage.bind(this);
    }
  }

  emit<T extends AuthEventType>(event: T, payload: AuthEventPayloads[T]): void {
    // Debounce rapid events
    const key = `${event}-${JSON.stringify(payload)}`;
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(key, setTimeout(() => {
      this.emitImmediate(event, payload);
      this.debounceTimers.delete(key);
    }, this.config.debounceMs));
  }

  private emitImmediate<T extends AuthEventType>(
    event: T,
    payload: AuthEventPayloads[T]
  ): void {
    // Local listeners
    const handlers = this.listeners.get(event);
    handlers?.forEach(handler => handler(payload));

    // Cross-tab broadcast
    if (this.channel) {
      this.channel.postMessage({ event, payload, timestamp: Date.now() });
    }
  }

  emitLocal<T extends AuthEventType>(event: T, payload: AuthEventPayloads[T]): void {
    const handlers = this.listeners.get(event);
    handlers?.forEach(handler => handler(payload));
  }

  on<T extends AuthEventType>(
    event: T,
    handler: (payload: AuthEventPayloads[T]) => void
  ): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private handleCrossTabMessage(event: MessageEvent): void {
    const { event: eventType, payload } = event.data;
    this.emitLocal(eventType, payload);
  }

  destroy(): void {
    this.channel?.close();
    this.listeners.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
