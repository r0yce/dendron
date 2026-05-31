"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const analytics_1 = require("../../utils/analytics");
const expect_1 = require("../expect");
const os_1 = __importDefault(require("os"));
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const sinon_1 = __importDefault(require("sinon"));
const lodash_1 = __importDefault(require("lodash"));
(0, mocha_1.describe)("GIVEN AnalyticsUtils", () => {
    (0, mocha_1.describe)("WHEN getSessionId called twice", () => {
        (0, mocha_1.test)("THEN get same value", () => {
            const val1 = analytics_1.AnalyticsUtils.getSessionId();
            const val2 = analytics_1.AnalyticsUtils.getSessionId();
            (0, expect_1.expect)(val1).toNotEqual(-1);
            (0, expect_1.expect)(val1).toEqual(val2);
        });
    });
    (0, mocha_1.describe)("WHEN trackForNextRun is used", () => {
        const event = "TestEventOccurred";
        const numbers = [1, 1, 2, 3, 5, 8];
        const namesYears = {
            "Jeffrey David Ullman": 2020,
            "Jack Dongarra": 2021,
        };
        let homedir;
        (0, mocha_1.before)(async () => {
            homedir = (0, common_server_1.tmpDir)().name;
            sinon_1.default.stub(os_1.default, "homedir").returns(homedir);
            await analytics_1.AnalyticsUtils.trackForNextRun(event, {
                numbers,
                namesYears,
            });
        });
        (0, mocha_1.after)(() => {
            sinon_1.default.restore();
        });
        (0, mocha_1.test)("THEN the properties are saved to disk", async () => {
            const telemetryDir = path_1.default.join(homedir, common_all_1.FOLDERS.DENDRON_SYSTEM_ROOT, common_all_1.FOLDERS.SAVED_TELEMETRY);
            const savedFiles = (await fs_extra_1.default.readdir(telemetryDir)).filter((filename) => path_1.default.extname(filename) === ".json");
            (0, expect_1.expect)(savedFiles.length).toEqual(1);
            const contents = await fs_extra_1.default.readFile(path_1.default.join(telemetryDir, savedFiles[0]), { encoding: "utf-8" });
            (0, expect_1.expect)(contents.includes(event)).toBeTruthy();
            (0, expect_1.expect)(contents.includes("5")).toBeTruthy();
            (0, expect_1.expect)(contents.includes("8")).toBeTruthy();
            (0, expect_1.expect)(contents.includes("Jeffrey David Ullman")).toBeTruthy();
            (0, expect_1.expect)(contents.includes("Jack Dongarra")).toBeTruthy();
            (0, expect_1.expect)(contents.includes("timestamp")).toBeTruthy();
        });
        (0, mocha_1.describe)("AND when sendSavedAnalytics is used", () => {
            let trackStub;
            (0, mocha_1.before)(async () => {
                trackStub = sinon_1.default.stub(common_server_1.SegmentUtils, "trackSync");
                await analytics_1.AnalyticsUtils.sendSavedAnalytics();
            });
            (0, mocha_1.after)(() => {
                trackStub.restore();
            });
            (0, mocha_1.test)("THEN the saved event is sent", async () => {
                (0, expect_1.expect)(trackStub.calledOnce).toBeTruthy();
                const args = trackStub.args[0][0];
                // Should be the right event
                (0, expect_1.expect)(args.event).toEqual(event);
                // All the props should match
                (0, expect_1.expect)(lodash_1.default.isEqual(args.properties?.numbers, numbers)).toBeTruthy();
                (0, expect_1.expect)(lodash_1.default.isEqual(args.properties?.namesYears, namesYears)).toBeTruthy();
                // Timestamp should be serialzed and saved, then parsed on load
                (0, expect_1.expect)(args.timestamp instanceof Date).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=analytics.test.js.map