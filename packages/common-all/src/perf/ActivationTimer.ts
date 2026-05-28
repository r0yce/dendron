/**
 * Extremely lightweight activation timing helper.
 *
 * Usage (in _extension.ts or WorkspaceActivator):
 *
 *   const t = new ActivationTimer();
 *   t.mark("phase:foo");
 *   ...
 *   t.finish();
 *
 * When DENDRON_PERF=1 or LOG_LEVEL=debug, it will log structured timing info.
 */
let now: () => number;
try {
  // Node.js environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { performance: nodePerf } = require("perf_hooks");
  now = () => nodePerf.now();
} catch {
  // Browser / extension host (performance is global)
  now = () => (globalThis as any).performance?.now?.() ?? Date.now();
}

export class ActivationTimer {
  private marks: Array<{ name: string; ts: number }> = [];
  private startTs: number;

  constructor() {
    this.startTs = now();
    this.mark("start");
  }

  mark(name: string) {
    this.marks.push({ name, ts: now() });
  }

  finish() {
    this.mark("finish");
    const total = this.marks[this.marks.length - 1].ts - this.startTs;

    // Only do our nice formatted output when explicitly requested.
    // This prevents raw arrays/objects from being accidentally logged
    // by other loggers in the activation path.
    if (process.env.DENDRON_PERF === "1") {
      console.log("\n=== Dendron Activation Performance ===");
      console.log(`Total activation time: ${total.toFixed(1)}ms`);
      let prev = this.startTs;
      for (const m of this.marks) {
        const delta = (m.ts - prev).toFixed(1);
        const fromStart = (m.ts - this.startTs).toFixed(1);
        console.log(`  ${m.name.padEnd(30)} +${delta}ms   (${fromStart}ms from start)`);
        prev = m.ts;
      }
      console.log("======================================\n");
    }

    // Return a minimal value to avoid dumping large arrays of objects
    // if any logger happens to log the return value of finish().
    return { totalMs: Math.round(total) };
  }

  getReport() {
    const total = this.marks[this.marks.length - 1]?.ts - this.startTs || 0;
    return { totalMs: Math.round(total) };
  }

  /**
   * Returns a nicely formatted multi-line string of the activation phases.
   * Useful for dev commands or logging.
   */
  getDetailedReport(): string {
    if (this.marks.length === 0) {
      return "No activation timings recorded.";
    }

    const total = this.marks[this.marks.length - 1].ts - this.startTs;
    const lines: string[] = [];
    lines.push("=== Dendron Activation Performance ===");
    lines.push(`Total: ${total.toFixed(1)}ms`);
    lines.push("");

    let prev = this.startTs;
    for (const m of this.marks) {
      const delta = (m.ts - prev).toFixed(1);
      const fromStart = (m.ts - this.startTs).toFixed(1);
      lines.push(`  ${m.name.padEnd(32)} +${delta.padStart(7)}ms   (${fromStart.padStart(7)}ms from start)`);
      prev = m.ts;
    }
    lines.push("");
    lines.push("======================================");
    return lines.join("\n");
  }

  /**
   * Returns the raw marks for advanced use (e.g. sending to a webview).
   */
  getMarks() {
    return this.marks.map(m => ({
      name: m.name,
      ts: m.ts,
      deltaFromPrevious: m.ts - (this.marks[this.marks.indexOf(m) - 1]?.ts ?? this.startTs),
      deltaFromStart: m.ts - this.startTs,
    }));
  }
}
