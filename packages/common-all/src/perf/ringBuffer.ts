/**
 * PerfRingBuffer — fixed-capacity high-resolution timing ring for CLI / plugin / engine.
 *
 * Cross-layer perf capture without heap growth. Used by:
 * - ActivationTimer (extension startup marks)
 * - PerformanceTimer (named spans)
 * - `dendron health --verbose` (summary dump)
 *
 * Enable verbose console output with DENDRON_PERF=1.
 */

export interface PerfEntry {
  name: string;
  /** Wall-clock ms since epoch when the sample was recorded */
  ts: number;
  /** Duration in milliseconds */
  durationMs: number;
  meta?: Record<string, unknown> | undefined;
}

export interface PerfSummary {
  totalEntries: number;
  capacity: number;
  avgDurationMs: number;
  p95DurationMs: number;
  topSlow: PerfEntry[];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? 0;
}

export class PerfRingBuffer {
  private buffer: PerfEntry[] = [];
  private readonly capacity: number;
  private cursor = 0;
  private totalWritten = 0;

  constructor(capacity = 1024) {
    this.capacity = Math.max(1, capacity);
  }

  get size(): number {
    return this.buffer.length;
  }

  get written(): number {
    return this.totalWritten;
  }

  push(entry: Omit<PerfEntry, "ts"> & { ts?: number }): void {
    const full: PerfEntry = {
      name: entry.name,
      durationMs: entry.durationMs,
      ts: entry.ts ?? Date.now(),
      meta: entry.meta,
    };
    if (this.buffer.length < this.capacity) {
      this.buffer.push(full);
    } else {
      this.buffer[this.cursor] = full;
      this.cursor = (this.cursor + 1) % this.capacity;
    }
    this.totalWritten += 1;
  }

  /**
   * Chronological view of the last N entries (oldest → newest).
   */
  report(lastN = 50): PerfEntry[] {
    const n = Math.min(lastN, this.buffer.length);
    if (n === 0) return [];
    if (this.buffer.length < this.capacity) {
      return this.buffer.slice(-n);
    }
    // Ring is full: physical order is [cursor ... end) + [0 ... cursor)
    const ordered = [
      ...this.buffer.slice(this.cursor),
      ...this.buffer.slice(0, this.cursor),
    ];
    return ordered.slice(-n);
  }

  summary(lastN = 100): PerfSummary {
    const entries = this.report(lastN);
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        capacity: this.capacity,
        avgDurationMs: 0,
        p95DurationMs: 0,
        topSlow: [],
      };
    }
    const durations = entries.map((e) => e.durationMs).sort((a, b) => a - b);
    const total = durations.reduce((s, d) => s + d, 0);
    const topSlow = [...entries]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5);
    return {
      totalEntries: entries.length,
      capacity: this.capacity,
      avgDurationMs: total / entries.length,
      p95DurationMs: percentile(durations, 95),
      topSlow,
    };
  }

  clear(): void {
    this.buffer = [];
    this.cursor = 0;
    this.totalWritten = 0;
  }

  /**
   * Compact snapshot suitable for doctor JSON / future sqlite health store.
   */
  toSnapshot(lastN = 100): {
    entries: PerfEntry[];
    summary: PerfSummary;
    ts: number;
  } {
    return {
      entries: this.report(lastN),
      summary: this.summary(lastN),
      ts: Date.now(),
    };
  }

  formatReport(lastN = 20): string {
    const entries = this.report(lastN);
    const sum = this.summary(lastN);
    if (entries.length === 0) {
      return "PerfRingBuffer: empty";
    }
    const lines = [
      `PerfRingBuffer: ${sum.totalEntries}/${sum.capacity} entries (written=${this.totalWritten})`,
      `  avg=${sum.avgDurationMs.toFixed(1)}ms p95=${sum.p95DurationMs.toFixed(1)}ms`,
      "  top slow:",
      ...sum.topSlow.map(
        (e) => `    ${e.name.padEnd(36)} ${e.durationMs.toFixed(1)}ms`,
      ),
    ];
    return lines.join("\n");
  }
}

/** Process-wide ring shared by CLI + extension when they share the same node process. */
export const globalPerfRing = new PerfRingBuffer(1024);

/**
 * Wrap a sync function with ring-buffer timing.
 * Async functions should use {@link withPerfTimingAsync}.
 */
export function withPerfTiming<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
): T {
  return ((...args: any[]) => {
    const start = Date.now();
    try {
      return fn(...args);
    } finally {
      globalPerfRing.push({ name, durationMs: Date.now() - start });
    }
  }) as T;
}

/**
 * Wrap an async function with ring-buffer timing (awaits settlement).
 */
export function withPerfTimingAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      return await fn(...args);
    } finally {
      globalPerfRing.push({ name, durationMs: Date.now() - start });
    }
  }) as T;
}
