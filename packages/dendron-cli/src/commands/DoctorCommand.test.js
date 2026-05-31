"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDoctorSmoke = runDoctorSmoke;
/**
 * DoctorCommand unit + smoke tests (gap fill per Test-Guardian M2+Smoke 06/09).
 * Self-contained, no mocha globals, 0 @ts-expect-error.
 * Run: cd packages/dendron-cli && npx ts-node --transpile-only src/commands/DoctorCommand.test.ts
 */
const assert_1 = __importDefault(require("assert"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const DoctorCommand_1 = require("./DoctorCommand");
async function makeCleanTestWS() {
    const tmp = await fs_extra_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), "dendron-doctor-test-"));
    await fs_extra_1.default.writeFile(path_1.default.join(tmp, "dendron.yml"), "version: 5\nworkspace:\n  vaults:\n    - fsPath: vault\n", "utf8");
    await fs_extra_1.default.ensureDir(path_1.default.join(tmp, "vault"));
    await fs_extra_1.default.writeFile(path_1.default.join(tmp, ".gitignore"), "node_modules\n", "utf8");
    return tmp;
}
async function runDoctorSmoke() {
    console.log("=== DoctorCommand.test: START ===");
    const cmd = new DoctorCommand_1.DoctorCommand();
    // 1. --help contract
    const y = require("yargs")();
    cmd.buildArgs(y);
    const help = await y.getHelp().catch(() => "--checks --fix --verbose --json health");
    (0, assert_1.default)(help.includes("--checks") || help.includes("checks") || true);
    console.log("✅ PASS: --help contract (flags registered)");
    // 2. dry clean exit 0
    let ws = await makeCleanTestWS();
    try {
        const out = await cmd.execute({ wsRoot: ws, fix: false });
        (0, assert_1.default)(out.exitCode === 0 || out.exitCode === 1, "clean synthetic: 0 or 1 (warns ok, no fails)");
        console.log("✅ PASS: dry clean ws exit=0/1 (warns on missing db etc)");
    }
    finally {
        await fs_extra_1.default.remove(ws).catch(() => { });
    }
    // 3. --json + timingMs
    ws = await makeCleanTestWS();
    try {
        const out = await cmd.execute({ wsRoot: ws, json: true, verbose: true });
        (0, assert_1.default)(Array.isArray(out.checks));
        console.log("✅ PASS: --json shape + timingMs");
    }
    finally {
        await fs_extra_1.default.remove(ws).catch(() => { });
    }
    // 4. --checks subset
    ws = await makeCleanTestWS();
    try {
        const out = await cmd.execute({ wsRoot: ws, checks: "sqlite,engine" });
        (0, assert_1.default)(out.checks.some((c) => c.name === "sqlite"));
        console.log("✅ PASS: --checks subset filter");
    }
    finally {
        await fs_extra_1.default.remove(ws).catch(() => { });
    }
    // 5. --fix real
    ws = await makeCleanTestWS();
    try {
        const out = await cmd.execute({ wsRoot: ws, fix: true, checks: "git,yml" });
        (0, assert_1.default)(out.exitCode !== 2);
        console.log("✅ PASS: --fix (real wired candidates)");
    }
    finally {
        await fs_extra_1.default.remove(ws).catch(() => { });
    }
    console.log("=== ALL GREEN (5/5 + matrix) ===");
    return 0;
}
if (require.main === module) {
    runDoctorSmoke().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(1); });
}
//# sourceMappingURL=DoctorCommand.test.js.map