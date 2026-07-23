#!/usr/bin/env node
/**
 * Dendron CLI entry (yargs 18+ ESM).
 *
 * yargs@18 is pure ESM; we load it via dynamic import so the rest of the
 * package can stay CJS-compiled while still using the latest yargs.
 */
import { env } from "@dendronhq/common-all";
import _ from "lodash";
import { CLIUtils } from "../src/utils/cli";
import { PublishCLICommand } from "../src/commands";
import { DevCLICommand } from "../src/commands/devCLICommand";
import { DoctorCLICommand } from "../src/commands/doctor";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ExportPodV2CLICommand } from "../src/commands/exportPodV2";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { LaunchEngineServerCommand } from "../src/commands/launchEngineServer";
import { NoteCLICommand } from "../src/commands/notes";
import { PublishPodCLICommand } from "../src/commands/publishPod";
import { SeedCLICommand } from "../src/commands/seedCLICommand";
import { VaultCLICommand } from "../src/commands/vaultCLICommand";
import { WorkspaceCLICommand } from "../src/commands/workspaceCLICommand";
import { VisualizeCLICommand } from "../src/commands/visualizeCLICommand";
import { DoctorCommand } from "../src/commands/DoctorCommand";

async function main() {
  if (_.isUndefined(env("LOG_LEVEL", { shouldThrow: false }))) {
    process.env.LOG_LEVEL = "error";
  }

  // yargs 18 is ESM-only — dynamic import works from CJS or ESM entry
  const yargsModule = await import("yargs");
  const yargsFactory = yargsModule.default;
  const helpers = await import("yargs/helpers");
  const hideBin = helpers.hideBin;

  const buildYargs = yargsFactory(hideBin(process.argv));

  new ExportPodCLICommand().buildCmd(buildYargs);
  new LaunchEngineServerCommand().buildCmd(buildYargs);
  new ImportPodCLICommand().buildCmd(buildYargs);
  new PublishPodCLICommand().buildCmd(buildYargs);
  new DoctorCLICommand().buildCmd(buildYargs);
  new DoctorCommand().buildCmd(buildYargs);
  new NoteCLICommand().buildCmd(buildYargs);
  new VaultCLICommand().buildCmd(buildYargs);
  new WorkspaceCLICommand().buildCmd(buildYargs);
  new SeedCLICommand().buildCmd(buildYargs);
  new DevCLICommand().buildCmd(buildYargs);
  new PublishCLICommand().buildCmd(buildYargs);
  new ExportPodV2CLICommand().buildCmd(buildYargs);
  new VisualizeCLICommand().buildCmd(buildYargs);

  await buildYargs
    .scriptName("dendron")
    .strictCommands()
    .demandCommand(1)
    .version(CLIUtils.getClientVersion())
    .alias("v", "version")
    .help()
    .completion("completion", "Generate shell completion script")
    .parseAsync();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
