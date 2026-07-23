/**
 * Lightweight self-check for PerfRingBuffer (no jest globals required).
 * Run: yarn workspace @dendronhq/common-all compile && npx ts-node --transpile-only packages/common-all/src/perf/ringBuffer.spec.ts
 */
import assert from "assert";
import { PerfRingBuffer, withPerfTiming } from "./ringBuffer";

function run() {
  const ring = new PerfRingBuffer(4);
  ring.push({ name: "a", durationMs: 10 });
  ring.push({ name: "b", durationMs: 20 });
  ring.push({ name: "c", durationMs: 30 });
  ring.push({ name: "d", durationMs: 40 });
  ring.push({ name: "e", durationMs: 50 }); // overwrites oldest

  assert.strictEqual(ring.size, 4);
  assert.strictEqual(ring.written, 5);
  const report = ring.report(10);
  assert.strictEqual(report.length, 4);
  assert.strictEqual(report[0]?.name, "b");
  assert.strictEqual(report[3]?.name, "e");

  const sum = ring.summary();
  assert.strictEqual(sum.totalEntries, 4);
  assert.ok(sum.avgDurationMs > 0);
  assert.strictEqual(sum.topSlow[0]?.name, "e");

  const timed = withPerfTiming(() => 42, "spec:sync");
  assert.strictEqual(timed(), 42);

  console.log("✅ PerfRingBuffer self-check passed");
}

if (require.main === module) {
  run();
}

export { run };
