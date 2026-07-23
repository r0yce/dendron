/**
 * Local-only telemetry sink for the personal fork.
 *
 * Writes anonymous event lines to ~/.dendron.local-telemetry.ndjson when enabled.
 * Never phones home — no Segment, no Sentry, no network.
 *
 * Enable via:
 *   yarn dendron dev enable_telemetry --local
 *   or DENDRON_LOCAL_TELEMETRY=1 (session override)
 *
 * See docs/dev/TELEMETRY.md
 */
import { CONSTANTS, genUUID } from "@dendronhq/common-all";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { createLogger } from "./logger";

const L = createLogger("LocalTelemetry");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap

export type LocalTelemetryEvent = {
  event: string;
  properties?: Record<string, unknown> | undefined;
  ts: string;
  sessionId?: string | undefined;
};

export class LocalTelemetry {
  private static _sessionId: string | undefined;

  static getPath(): string {
    return path.join(os.homedir(), CONSTANTS.DENDRON_LOCAL_TELEMETRY);
  }

  /**
   * Local file mode is on when:
   * - DENDRON_LOCAL_TELEMETRY=1, or
   * - telemetry config status is ENABLED_BY_LOCAL_FILE (set by enable_telemetry --local)
   */
  static isEnabled(telemetryStatus?: string): boolean {
    if (process.env.DENDRON_LOCAL_TELEMETRY === "1") return true;
    if (process.env.DENDRON_LOCAL_TELEMETRY === "0") return false;
    return telemetryStatus === "enabled by local file";
  }

  static getSessionId(): string {
    if (!this._sessionId) {
      this._sessionId = genUUID();
    }
    return this._sessionId;
  }

  static async append(
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const filePath = this.getPath();
      if (fs.pathExistsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        if (size > MAX_BYTES) {
          L.info({ msg: "local telemetry file at cap; skipping write", size });
          return;
        }
      }
      // Strip anything that looks like vault content / absolute note paths
      const safeProps = sanitizeProps(properties);
      const line: LocalTelemetryEvent = {
        event,
        properties: safeProps,
        ts: new Date().toISOString(),
        sessionId: this.getSessionId(),
      };
      await fs.appendFile(filePath, JSON.stringify(line) + "\n", "utf8");
    } catch (err) {
      L.error({ msg: "local telemetry append failed", err });
    }
  }

  static summary(): {
    enabled: boolean;
    path: string;
    exists: boolean;
    bytes: number;
    approxLines: number;
  } {
    const filePath = this.getPath();
    const exists = fs.pathExistsSync(filePath);
    let bytes = 0;
    let approxLines = 0;
    if (exists) {
      bytes = fs.statSync(filePath).size;
      try {
        const text = fs.readFileSync(filePath, "utf8");
        approxLines = text.split(/\r?\n/).filter((l) => l.trim()).length;
      } catch {
        approxLines = -1;
      }
    }
    return {
      enabled: this.isEnabled(),
      path: filePath,
      exists,
      bytes,
      approxLines,
    };
  }

  static clear(): void {
    const filePath = this.getPath();
    if (fs.pathExistsSync(filePath)) {
      fs.removeSync(filePath);
    }
  }
}

function sanitizeProps(
  properties?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!properties) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined) continue;
    const key = k.toLowerCase();
    // Drop keys that often carry note bodies or absolute paths
    if (
      key.includes("body") ||
      key.includes("content") ||
      key.includes("text") ||
      key.includes("path") ||
      key.includes("fname") ||
      key.includes("vault")
    ) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200) + "…";
      continue;
    }
    out[k] = v;
  }
  return out;
}
