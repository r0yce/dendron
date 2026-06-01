import process from "process";
import { launchv2 } from "./index";
const port = process.env.PORT || 3000;
const logPath = process.env.LOG_DST;
launchv2({ port: Number(port), logPath: logPath || "/tmp" } as any /* BM-2026-0531-First3 [ref:registry] */);
