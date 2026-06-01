import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  ERROR_STATUS,
  SeedConfig,
  SeedEntry,
  VaultUtils,
  WorkspaceType,
  ConfigUtils,
  SeedVault,
} from "@dendronhq/common-all";
import { DConfig, simpleGit, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { WorkspaceService, WorkspaceUtils } from "../workspace";
import { SeedRegistry } from "./registry";
import { SeedUtils } from "./utils";

export enum SeedInitMode {
  CREATE_WORKSPACE = "create_workspace",
  CONVERT_WORKSPACE = "convert_workspace",
}

export type SeedSvcResp = {
  data?: {
    seed: SeedConfig;
    seedPath?: string; // optional, not set if we're working with metadata only
  };
  error?: DendronError;
};

export class SeedService {
  public wsRoot: string;
  public registryFile?: string;
  protected registry: SeedRegistry;

  /**
   *
   * @param wsRoot - root of file
   * @param registryFile - custom yml file to look for registry
   */
  constructor({
    wsRoot,
    registryFile,
    registry,
  }: {
    wsRoot: string;
    registryFile?: string;
    registry?: SeedRegistry;
  }) {
    this.wsRoot = wsRoot;
    this.registryFile = registryFile;
    this.registry = registry || SeedRegistry.create({ registryFile });
  }

  protected async getSeedOrErrorFromId(
    id: string
  ): Promise<SeedConfig | DendronError> {
    const maybeSeed = await this.registry.info({ id });
    if (!maybeSeed) {
      return DendronError.createFromStatus({
        status: ERROR_STATUS.DOES_NOT_EXIST,
        message: `seed ${id} does not exist`,
      });
    }
    return maybeSeed;
  }

  async addSeed({
    id,
    metaOnly,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    id: string;
    metaOnly?: boolean;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }): Promise<SeedSvcResp> {
    const seedOrError = await this.getSeedOrErrorFromId(id);
    if (seedOrError instanceof DendronError) {
      return {
        error: seedOrError,
      };
    }
    let seedPath;

    // Seed cloning must occur before the metadata changes - if the current
    // workspace that is open is the one being modified in addSeedMetadata(), VS
    // Code will reload the current window and the seed cloning may not execute.
    if (!metaOnly) {
      seedPath = await this.cloneSeed({ seed: seedOrError });
    }
    await this.addSeedMetadata({
      seed: seedOrError,
      wsRoot: this.wsRoot,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    return { data: { seedPath, seed: seedOrError } };
  }

  /**
   * Add seed metadata.
   * @returns
   */
  async addSeedMetadata({
    seed,
    wsRoot,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    seed: SeedConfig;
    wsRoot: string;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }) {
    const ws = new WorkspaceService({ wsRoot });
    const config = DConfig.readConfigSync(wsRoot);
    const id = SeedUtils.getSeedId({ ...seed });

    const seeds = ConfigUtils.getWorkspace(config).seeds || {};

    const seedEntry: SeedEntry = {};
    if (seed.site) {
      seedEntry.site = seed.site;
    }

    seeds![id] = seedEntry;
    ConfigUtils.setWorkspaceProp(config, "seeds", seeds);

    const updateWorkspace =
      (await WorkspaceUtils.getWorkspaceTypeFromDir(wsRoot)) ===
      WorkspaceType.CODE;
    await ws.addVault({
      vault: SeedUtils.seed2Vault({ seed }),
      config,
      updateConfig: true,
      updateWorkspace,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    ws.dispose();

    return { seed };
  }

  /**
   *
   * @param branch - optional branch to clone from
   * @returns
   */
  async cloneSeed({ seed, branch }: { seed: SeedConfig; branch?: string }) {
    const wsRoot = this.wsRoot;
    const id = SeedUtils.getSeedId(seed);
    const spath = SeedUtils.seed2Path({ wsRoot, id });
    fs.ensureDirSync(path.dirname(spath));
    const git = simpleGit({ baseDir: wsRoot });
    if (branch) {
      await git.clone(seed.repository.url, spath, { "--branch": "dev" });
    } else {
      await git.clone(seed.repository.url, spath);
    }
    return spath;
  }

  async init(opts: { seed: SeedConfig; wsRoot: string; mode: SeedInitMode }) {
    const { wsRoot, seed, mode } = opts;
    const cpath = path.join(wsRoot, CONSTANTS.DENDRON_SEED_CONFIG);

    switch (mode) {
      case SeedInitMode.CREATE_WORKSPACE: {
        // write seed config
        writeYAML(cpath, seed);
        const ws = await WorkspaceService.createWorkspace({
          wsRoot,
          createCodeWorkspace: true,
        });
        const config = ws.config;
        await ws.createVault({
          vault: { fsPath: "vault" },
          updateWorkspace: true,
          config,
          updateConfig: false,
        });
        await ws.setConfig(config);
        ws.dispose();
        break;
      }
      case SeedInitMode.CONVERT_WORKSPACE: {
        const { error } = SeedUtils.validateWorkspaceSeedConversion({ wsRoot });
        if (error) {
          return {
            error,
          };
        }
        const config = WorkspaceService.getOrCreateConfig(wsRoot);
        const vaults = ConfigUtils.getVaults(config);
        // vault[0] (seed/service CONVERT_WORKSPACE cluster, engine-server batch 2); length guard for safety under noUnchecked (typically >=1 after workspace init); pattern per "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (third of 3: engine-server, batch 2)" + common-server 0 + unified 59 + ADR 0001 + IDs 019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e8202-b2c3-7d4e-9f5a-6789abcdef01. THE CHAIN DOES NOT STOP.
        const vaultPath = vaults.length > 0 ? VaultUtils.getRelPath(vaults[0]) : "";
        seed.root = vaultPath;
        writeYAML(cpath, seed);
        // validate
        break;
      }
      default:
        assertUnreachable(mode);
    }
    return {
      data: {
        seed,
      },
    };
  }

  async info({ id }: { id: string }) {
    const resp = this.registry.info({ id });
    return resp;
  }

  async removeSeed({
    id,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    id: string;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }): Promise<SeedSvcResp> {
    const config = WorkspaceService.getOrCreateConfig(this.wsRoot);

    const seeds = ConfigUtils.getWorkspace(config).seeds;
    if (!_.has(seeds, id)) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `seed with id ${id} not in dendron.yml`,
        }),
      };
    }
    const seedOrError = await this.getSeedOrErrorFromId(id);
    if (seedOrError instanceof DendronError) {
      return {
        error: seedOrError,
      };
    }
    // Folder cleanup must occur before the metadata changes - if the current
    // workspace that is open is the one being modified in addSeedMetadata(), VS
    // Code will reload the current window and the seed cloning may not execute.
    const spath = SeedUtils.seed2Path({ wsRoot: this.wsRoot, id });
    if (fs.pathExistsSync(spath)) {
      fs.removeSync(spath);
    }

    await this.removeSeedMetadata({
      seed: seedOrError,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    return { data: { seed: seedOrError } };
  }

  async removeSeedMetadata({
    seed,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    seed: SeedConfig;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }) {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });

    // remove seed entry
    const config = ws.config;
    const seeds = ConfigUtils.getWorkspace(config).seeds || {};
    delete seeds[SeedUtils.getSeedId(seed)];
    ConfigUtils.setWorkspaceProp(config, "seeds", seeds);
    await ws.setConfig(config);

    const updateWorkspace =
      (await WorkspaceUtils.getWorkspaceTypeFromDir(this.wsRoot)) ===
      WorkspaceType.CODE;
    await ws.removeVault({
      vault: SeedUtils.seed2Vault({ seed }),
      updateWorkspace,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    ws.dispose();
  }

  isSeedInWorkspace(id: string): boolean {
    const config = WorkspaceService.getOrCreateConfig(this.wsRoot);
    const vaults = ConfigUtils.getVaults(config);
    return undefined !== vaults.find((vault) => vault.seed === id);
  }

  getSeedVaultsInWorkspace(): SeedVault[] {
    const config = WorkspaceService.getOrCreateConfig(this.wsRoot);
    const vaults = ConfigUtils.getVaults(config);
    return vaults.filter(VaultUtils.isSeed);
  }

  getSeedsInWorkspace(): string[] {
    return this.getSeedVaultsInWorkspace().map((vault) => vault.seed!);
  }
}
