"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubSchema = exports.GithubEditViewModeEnum = void 0;
exports.genDefaultGithubConfig = genDefaultGithubConfig;
const parse_1 = require("../../../parse");
var GithubEditViewModeEnum;
(function (GithubEditViewModeEnum) {
    GithubEditViewModeEnum["tree"] = "tree";
    GithubEditViewModeEnum["edit"] = "edit";
})(GithubEditViewModeEnum || (exports.GithubEditViewModeEnum = GithubEditViewModeEnum = {}));
function genDefaultGithubConfig() {
    return {
        enableEditLink: true,
        editLinkText: "Edit this page on GitHub",
        editBranch: "main",
        editViewMode: GithubEditViewModeEnum.tree,
    };
}
const githubEditViewModeSchema = (0, parse_1.schemaForType)()(parse_1.z.union([
    parse_1.z.literal(GithubEditViewModeEnum.tree),
    parse_1.z.literal(GithubEditViewModeEnum.edit),
]));
exports.githubSchema = (0, parse_1.schemaForType)()(parse_1.z.object({
    cname: parse_1.z.string().optional(),
    enableEditLink: parse_1.z.boolean().default(true),
    editLinkText: parse_1.z.string().optional().default("Edit this page on GitHub"),
    editBranch: parse_1.z.string().optional().default("main"),
    editViewMode: githubEditViewModeSchema
        .optional()
        .default(GithubEditViewModeEnum.tree),
    editRepository: parse_1.z.string().optional(),
}));
//# sourceMappingURL=github.js.map