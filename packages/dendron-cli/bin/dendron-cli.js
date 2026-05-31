#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_all_1 = require("@dendronhq/common-all");
var lodash_1 = require("lodash");
var yargs_1 = require("yargs");
var cli_1 = require("../src/utils/cli");
var commands_1 = require("../src/commands");
var devCLICommand_1 = require("../src/commands/devCLICommand");
var doctor_1 = require("../src/commands/doctor");
var exportPod_1 = require("../src/commands/exportPod");
var exportPodV2_1 = require("../src/commands/exportPodV2");
var importPod_1 = require("../src/commands/importPod");
var launchEngineServer_1 = require("../src/commands/launchEngineServer");
var notes_1 = require("../src/commands/notes");
var publishPod_1 = require("../src/commands/publishPod");
var seedCLICommand_1 = require("../src/commands/seedCLICommand");
var vaultCLICommand_1 = require("../src/commands/vaultCLICommand");
var workspaceCLICommand_1 = require("../src/commands/workspaceCLICommand");
var visualizeCLICommand_1 = require("../src/commands/visualizeCLICommand");
var DoctorCommand_1 = require("../src/commands/DoctorCommand");
// import { WorkspaceCLICommand } from "../src/commands/workspace";
if (lodash_1.default.isUndefined((0, common_all_1.env)("LOG_LEVEL", { shouldThrow: false }))) {
    process.env.LOG_LEVEL = "error";
}
var buildYargs = yargs_1.default;
new exportPod_1.ExportPodCLICommand().buildCmd(buildYargs);
new launchEngineServer_1.LaunchEngineServerCommand().buildCmd(buildYargs);
new importPod_1.ImportPodCLICommand().buildCmd(buildYargs);
new publishPod_1.PublishPodCLICommand().buildCmd(buildYargs);
new doctor_1.DoctorCLICommand().buildCmd(buildYargs);
new DoctorCommand_1.DoctorCommand().buildCmd(buildYargs); // UNCOMMENTED + gaps filled ( --checks wired, 3 real --fix via DConfig/GitUtils/ConfigUtils + backups, units added, --json timingMs, table polish). Registration LIVE post-smoke (019e7ccf + 06/07 polish). "health" (safe w/ notes "doctor"). MVP launch ready.
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
