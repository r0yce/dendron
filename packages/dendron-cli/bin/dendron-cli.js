#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const yargs_1 = __importDefault(require("yargs"));
const cli_1 = require("../src/utils/cli");
const commands_1 = require("../src/commands");
const devCLICommand_1 = require("../src/commands/devCLICommand");
const doctor_1 = require("../src/commands/doctor");
const exportPod_1 = require("../src/commands/exportPod");
const exportPodV2_1 = require("../src/commands/exportPodV2");
const importPod_1 = require("../src/commands/importPod");
const launchEngineServer_1 = require("../src/commands/launchEngineServer");
const notes_1 = require("../src/commands/notes");
const publishPod_1 = require("../src/commands/publishPod");
const seedCLICommand_1 = require("../src/commands/seedCLICommand");
const vaultCLICommand_1 = require("../src/commands/vaultCLICommand");
const workspaceCLICommand_1 = require("../src/commands/workspaceCLICommand");
const visualizeCLICommand_1 = require("../src/commands/visualizeCLICommand");
const DoctorCommand_1 = require("../src/commands/DoctorCommand");
// import { WorkspaceCLICommand } from "../src/commands/workspace";
if (lodash_1.default.isUndefined((0, common_all_1.env)("LOG_LEVEL", { shouldThrow: false }))) {
    process.env.LOG_LEVEL = "error";
}
const buildYargs = yargs_1.default;
new exportPod_1.ExportPodCLICommand().buildCmd(buildYargs);
new launchEngineServer_1.LaunchEngineServerCommand().buildCmd(buildYargs);
new importPod_1.ImportPodCLICommand().buildCmd(buildYargs);
new publishPod_1.PublishPodCLICommand().buildCmd(buildYargs);
new doctor_1.DoctorCLICommand().buildCmd(buildYargs);
new DoctorCommand_1.DoctorCommand().buildCmd(buildYargs); // "health" registered (6 checks + perf + table output + --json/--verbose/--fix skeletons; registration live + CLIUtils table per Test-Guardian matrix; safe collision with notes "doctor")
new notes_1.NoteCLICommand().buildCmd(buildYargs);
new vaultCLICommand_1.VaultCLICommand().buildCmd(buildYargs);
new workspaceCLICommand_1.WorkspaceCLICommand().buildCmd(buildYargs);
new seedCLICommand_1.SeedCLICommand().buildCmd(buildYargs);
new devCLICommand_1.DevCLICommand().buildCmd(buildYargs);
new commands_1.PublishCLICommand().buildCmd(buildYargs);
new exportPodV2_1.ExportPodV2CLICommand().buildCmd(buildYargs);
new visualizeCLICommand_1.VisualizeCLICommand().buildCmd(buildYargs);
// eslint-disable-next-line no-unused-expressions
buildYargs
    .scriptName("dendron")
    .strictCommands()
    .demandCommand(1)
    .version(cli_1.CLIUtils.getClientVersion())
    .alias("v", "version")
    .help()
    .completion("completion", "Generate shell completion script")
    .argv;
//# sourceMappingURL=dendron-cli.js.map