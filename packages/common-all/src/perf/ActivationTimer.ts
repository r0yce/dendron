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

    const shouldLog =
      process.env.DENDRON_PERF === "1" ||
      process.env.LOG_LEVEL === "debug" ||
      process.env.LOG_LEVEL === "info";

    if (!shouldLog) {
      return { total, marks: this.marks };
    }

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

    return { total, marks: this.marks };
  }

  getReport() {
    const total = this.marks[this.marks.length - 1]?.ts - this.startTs || 0;
    return { total, marks: this.marks };
  }
}
