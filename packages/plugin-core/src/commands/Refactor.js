"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorCommand = exports.RefactorBaseCommand = exports.RULES = void 0;
exports.main = main;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const base_1 = require("./base");
const L = (0, common_server_1.createLogger)("dendron");
exports.RULES = {
    ADD_FM_BLOCK: "ADD_FM_BLOCK",
    ADD_FM_ID: "ADD_FM_ID",
    REMOVE_FM_BRACKETS: "REMOVE_FM_BRACKETS",
    ADD_LAYOUT: "ADD_LAYOUT",
};
class RefactorBaseCommand extends base_1.BasicCommand {
    props;
    constructor(name, opts) {
        super(name);
        this.props = this.cleanOpts(opts);
    }
    cleanOpts(opts) {
        return lodash_1.default.defaults(opts, {
            include: ["*.md"],
            exclude: [],
            dryRun: false,
            limit: 9999,
        });
    }
    async getFiles(opts) {
        const out = await (0, common_server_1.getAllFilesWithTypes)({
            include: opts.include,
            exclude: opts.exclude,
            root: vscode_1.Uri.file(opts.root),
        });
        if (out.data === undefined)
            throw out.error;
        return out.data;
    }
    async execute() {
        const ctx = "execute";
        const stats = {
            numChanged: 0,
        };
        const { limit, root } = this.props;
        const allFiles = await this.getFiles({ ...this.props });
        // return Promise.all(
        return allFiles.map((dirent) => {
            const { name: fname } = dirent;
            if (stats.numChanged > limit) {
                L.info(`reached limit of ${limit} changes`);
                return;
            }
            const fpath = path_1.default.join(root, fname);
            const out = this.readFile(fpath);
            const { isMatch, matchData } = this.matchFile(out);
            if (isMatch) {
                this.L.info({ ctx, msg: "matchFile", fname, matchData });
                if (!this.props.dryRun) {
                    const cleanFile = this.refactorFile(out, matchData);
                    this.writeFile(fpath, cleanFile);
                }
                stats.numChanged += 1;
            }
        });
        //);
    }
}
exports.RefactorBaseCommand = RefactorBaseCommand;
class RefactorCommand extends base_1.BasicCommand {
    key = "dendron.LegacyRefactorCommand";
    rules;
    constructor() {
        super();
        this.rules = {};
        this._registerRules();
    }
    async getFiles(opts) {
        const out = await (0, common_server_1.getAllFilesWithTypes)({
            include: opts.include,
            exclude: opts.exclude,
            root: vscode_1.Uri.parse(opts.root),
        });
        if (out.data === undefined)
            throw out.error;
        return out.data;
    }
    _registerRules() {
        const rules = [
            {
                name: exports.RULES.ADD_FM_BLOCK,
                matcher: /^---/,
                replacer: (_match, txt) => {
                    const fm = "---\n\n---\n";
                    const output = [fm, txt];
                    return { txtClean: output.join("\n"), diff: {} };
                },
                opts: {
                    matchIfNull: true,
                },
            },
            {
                name: exports.RULES.ADD_FM_ID,
                matcher: /^---\n(?!.*id:.*)(?<fm>.*)^---\n(?<body>.*)/ms,
                replacer: (match, _txt) => {
                    const fmOrig = (match?.groups ?? {}).fm;
                    const body = (match?.groups ?? {}).body;
                    const output = ["---", `id: ${(0, common_all_1.genUUID)()}\n${fmOrig}`, "---", body];
                    return { txtClean: output.join("\n"), diff: {} };
                },
            },
            {
                name: exports.RULES.REMOVE_FM_BRACKETS,
                fmOnly: true,
                matcher: /^(?=.*\s*-\s*\[.*)/ms,
                replacer: (match, _txt) => {
                    const fmOrig = (match?.groups ?? {}).fm;
                    const body = (match?.groups ?? {}).body;
                    const fmClean = fmOrig.replace(/\[|/g, "").replace(/\]/g, ": ");
                    const output = ["---", fmClean, "---", body];
                    return {
                        txtClean: output.join("\n"),
                        fmOrig,
                        fmClean,
                        diff: {},
                    };
                },
            },
            {
                name: exports.RULES.ADD_LAYOUT,
                fmOnly: true,
                matcher: /^(?=.*\s*-\s*\[.*)/ms,
                replacer: (match, _txt) => {
                    const fmOrig = (match?.groups ?? {}).fm;
                    const body = (match?.groups ?? {}).body;
                    const fmClean = fmOrig.replace(/\[|/g, "").replace(/\]/g, ": ");
                    const output = ["---", fmClean, "---", body];
                    return {
                        txtClean: output.join("\n"),
                        fmOrig,
                        fmClean,
                        diff: {},
                    };
                },
            },
        ];
        rules.forEach((r) => {
            this.rules[r.name] = r;
        });
    }
    applyMatch(txt, rule) {
        const { matcher, replacer, opts } = rule;
        const match = txt.match(matcher);
        const ruleOpts = lodash_1.default.defaults(opts, { matchIfNull: false });
        if ((!lodash_1.default.isNull(match) && !ruleOpts.matchIfNull) ||
            (lodash_1.default.isNull(match) && ruleOpts.matchIfNull)) {
            return replacer(match, txt);
        }
        return null;
    }
    async execute(opts) {
        const logger = L.child({ ctx: "execute", opts });
        const { root, dryRun, exclude, include, limit, rules } = lodash_1.default.defaults(opts, {
            include: ["*.md"],
            exclude: [],
            dryRun: false,
            limit: 9999,
        });
        const stats = {
            numChanged: 0,
        };
        logger.info({ msg: "enter" });
        const allFiles = await this.getFiles({ root, exclude, include });
        allFiles.forEach((dirent) => {
            const { name: fname } = dirent;
            if (stats.numChanged > limit) {
                L.info(`reached limit of ${limit} changes`);
                process.exit(0);
            }
            const txt = fs_extra_1.default.readFileSync(path_1.default.join(root, fname), "utf8");
            let matchTxt = "";
            let restTxt = "";
            L.debug({ ctx: "execute:process", fname });
            rules.forEach((_r) => {
                const r = this.rules[_r];
                if (r.fmOnly) {
                    const startIndex = txt.indexOf("---") + 3;
                    const endIndex = txt.indexOf("---", startIndex);
                    matchTxt = lodash_1.default.trim(txt.slice(startIndex, endIndex - 3));
                    restTxt = txt.slice(endIndex + 3);
                }
                else {
                    matchTxt = txt;
                }
                const matched = this.applyMatch(matchTxt, r);
                if (matched) {
                    stats.numChanged += 1;
                    const { txtClean, diff } = matched;
                    const dstPath = path_1.default.join(root, fname);
                    L.debug({
                        ctx: "writeFileSync:pre",
                        diff,
                        fname,
                        txtClean,
                    });
                    if (!dryRun) {
                        fs_extra_1.default.writeFileSync(dstPath, txtClean + restTxt);
                    }
                }
            });
        });
        L.info({ ctx: "execute:exit", stats });
    }
}
exports.RefactorCommand = RefactorCommand;
async function main() {
    const root = process.argv[2];
    await new RefactorCommand().execute({
        root,
        rules: [exports.RULES.REMOVE_FM_BRACKETS],
        // include: ['cli.pbcopy.md'],
        dryRun: false,
        // dryRun: true,
        limit: 10,
    });
    L.info("done");
}
// console.log("start");
// main();
//# sourceMappingURL=Refactor.js.map