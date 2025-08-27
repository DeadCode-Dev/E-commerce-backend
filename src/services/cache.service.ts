export class Cache<T> {
  private data: Map<string, T> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  set(key: string, value: T, ttl?: number) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    if (ttl) {
      this.timers.set(
        key,
        setTimeout(() => this.delete(key), ttl),
      );
    }
    this.data.set(key, value);
  }

  get(key: string): T | undefined {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): boolean {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.data.delete(key);
  }

  clear() {
    this.data.clear();
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
