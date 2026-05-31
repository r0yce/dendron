"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangelogGenerator = void 0;
exports.generateChangelog = generateChangelog;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const Diff2Html = __importStar(require("diff2html"));
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const site_1 = require("../topics/site");
class ChangelogGenerator {
    static getChangelogDataPath(wsRoot) {
        const buildDir = path_1.default.join(wsRoot, "build");
        fs_extra_1.default.ensureDirSync(buildDir);
        return path_1.default.join(buildDir, "changes.json");
    }
}
exports.ChangelogGenerator = ChangelogGenerator;
async function getLastCommit(wsRoot) {
    // get last commit hash
    const { stdout } = await (0, execa_1.default)("git", [`log`, `--pretty=format:'%h'`, `-n`, `1`], { cwd: wsRoot });
    // use slice as there are quotes around the commit hash
    return stdout.slice(1, -1);
}
async function canShowDiff(opts) {
    const { engine, filePath } = opts;
    const { vaults, wsRoot } = engine;
    const config = common_server_1.DConfig.readConfigSync(wsRoot);
    const canPublishChecks = await Promise.all(vaults.map(async (vault) => {
        if (filePath.startsWith(vault.fsPath) && filePath.endsWith(".md")) {
            const fname = path_1.default.basename(filePath.split(vault.fsPath)[1], ".md");
            const note = (await engine.findNotesMeta({ fname, vault }))[0];
            if (!note) {
                return false;
            }
            return site_1.SiteUtils.canPublish({
                note,
                config,
                engine,
            });
        }
        else {
            return false;
        }
    }));
    return canPublishChecks.includes(true);
}
/**
 * Return undefined if no changes, otherwise string with last commit
 */
// @ts-ignore
function getLastChangelogCommit(engine) {
    const buildDir = path_1.default.join(engine.wsRoot, "build");
    const changesPath = path_1.default.join(buildDir, "changes.json");
    if (!fs_extra_1.default.existsSync(changesPath)) {
        return undefined;
    }
    else {
        const data = fs_extra_1.default.readJSONSync(changesPath);
        return data.commits[0].commitHash;
    }
}
/**
 * Gets list of notes that were changed + commit hash and save it to file in build/ dir.
 */
async function generateChangelog(engine) {
    const { wsRoot } = engine;
    const changesPath = ChangelogGenerator.getChangelogDataPath(wsRoot);
    // const lastCommit = getLastChangelogCommit(engine);
    //const commits = await getCommitUpTo(wsRoot, lastCommit);
    const commits = [await getLastCommit(wsRoot)];
    const changes = await Promise.all(commits.slice(0, 3).flatMap((commitHash) => {
        return getChanges({
            engine,
            commitHash,
        });
    }));
    fs_extra_1.default.writeJSONSync(changesPath, { commits: changes });
}
// get files changed/added for a repo for the last commit
async function getChanges(opts) {
    const { engine, commitHash } = opts;
    const { wsRoot } = engine;
    let commitDate = "";
    const changes = [];
    const filesChanged = [];
    // get files changed/added
    const { stdout } = await (0, execa_1.default)("git", ["show", "--name-status", commitHash], {
        cwd: wsRoot,
        shell: true,
    });
    const status = stdout.split("\n");
    await (0, common_all_1.asyncLoopOneAtATime)(status, async (result) => {
        if (result.startsWith("M")) {
            const filePath = result.split(" ")[0].substring(2);
            if (await canShowDiff({ filePath, engine })) {
                filesChanged.push(filePath);
                changes.push({
                    action: "Modified",
                    fname: filePath,
                });
            }
        }
        else if (result.startsWith("A")) {
            const filePath = result.split(" ")[0].substring(2);
            if (await canShowDiff({ filePath, engine })) {
                filesChanged.push(filePath);
                changes.push({
                    action: "Added",
                    fname: filePath,
                });
            }
        }
    });
    await Promise.all(changes.map(async (change) => {
        const { stdout } = await (0, execa_1.default)("git", ["show", commitHash, "--", change.fname], { cwd: wsRoot, shell: true });
        change.diff = Diff2Html.html(stdout);
        return Diff2Html.html(stdout);
    }));
    // get date of last commit
    const { stdout: stdOut2 } = await (0, execa_1.default)("git", ["log", commitHash, "--format=%cd"], {
        cwd: wsRoot,
        shell: true,
    });
    const date = stdOut2.split(/\s+/).slice(1, 5);
    const day = date[0];
    const month = date[1];
    const year = date[3];
    commitDate = `${day} ${month} ${year}`;
    return {
        commitDate,
        commitHash,
        changes,
    };
}
//# sourceMappingURL=changelog.js.map