import { asyncLoopOneAtATime, DEngineClient } from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import * as Diff2Html from "diff2html";
import { execa } from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { SiteUtils } from "../topics/site";

type Commits = {
  commits: CommitEntry[];
};
type CommitEntry = {
  commitDate: string;
  commitHash: string;
  changes: CommitChangeEntry[];
};
type CommitChangeEntry = {
  action: string;
  fname: string;
  diff: string;
};

export class ChangelogGenerator {
  static getChangelogDataPath(wsRoot: string) {
    const buildDir = path.join(wsRoot, "build");
    fs.ensureDirSync(buildDir);
    return path.join(buildDir, "changes.json");
  }
}

async function getLastCommit(wsRoot: string) {
  // get last commit hash
  const { stdout } = await execa(
    "git",
    [`log`, `--pretty=format:'%h'`, `-n`, `1`],
    { cwd: wsRoot }
  );
  // use slice as there are quotes around the commit hash
  return stdout.slice(1, -1);
}

async function canShowDiff(opts: {
  engine: DEngineClient;
  filePath: string;
}): Promise<boolean> {
  const { engine, filePath } = opts;
  const { vaults, wsRoot } = engine;
  const config = DConfig.readConfigSync(wsRoot);
  const canPublishChecks = await Promise.all(
    vaults.map(async (vault) => {
      if (filePath.startsWith(vault.fsPath) && filePath.endsWith(".md")) {
        const parts = filePath.split(vault.fsPath);
        const fname = path.basename(parts[1] ?? "", ".md");
        const notes = await engine.findNotesMeta({ fname, vault });
        const note = notes.length > 0 ? notes[0] : undefined;
        if (!note) {
          return false;
        }
        return SiteUtils.canPublish({
          note,
          config,
          engine,
        });
      } else {
        return false;
      }
    })
  );
  return canPublishChecks.includes(true);
}

/**
 * Return undefined if no changes, otherwise string with last commit
 */
// @ts-ignore
function getLastChangelogCommit(engine: DEngineClient): undefined | string {
  const buildDir = path.join(engine.wsRoot, "build");
  const changesPath = path.join(buildDir, "changes.json");
  if (!fs.existsSync(changesPath)) {
    return undefined;
  } else {
    const data: Commits = fs.readJSONSync(changesPath);
    // noUncheckedIndexedAccess guard (changelog cluster Batch 1); see common-server 0 + unified 41 precedent
    return data.commits.length > 0 ? data.commits[0]!.commitHash : undefined;
  }
}

/**
 * Gets list of notes that were changed + commit hash and save it to file in build/ dir.
 */
export async function generateChangelog(engine: DEngineClient) {
  const { wsRoot } = engine;
  const changesPath = ChangelogGenerator.getChangelogDataPath(wsRoot);
  // const lastCommit = getLastChangelogCommit(engine);
  //const commits = await getCommitUpTo(wsRoot, lastCommit);
  const commits = [await getLastCommit(wsRoot)];
  const changes: CommitEntry[] = await Promise.all(
    commits.slice(0, 3).flatMap((commitHash) => {
      return getChanges({
        engine,
        commitHash,
      });
    })
  );
  fs.writeJSONSync(changesPath, { commits: changes });
}

// get files changed/added for a repo for the last commit
async function getChanges(opts: { commitHash: string; engine: DEngineClient }) {
  const { engine, commitHash } = opts;
  const { wsRoot } = engine;
  let commitDate: string = "";
  const changes: any[] = [];
  const filesChanged: string[] = [];

  // get files changed/added
  const { stdout } = await execa("git", ["show", "--name-status", commitHash], {
    cwd: wsRoot,
    shell: true,
  });
  const status = stdout.split("\n");
  await asyncLoopOneAtATime(status, async (result: string) => {
    if (result.startsWith("M")) {
      const parts = result.split(" ");
      const filePath = (parts[0] ?? "").substring(2);
      if (await canShowDiff({ filePath, engine })) {
        filesChanged.push(filePath);
        changes.push({
          action: "Modified",
          fname: filePath,
        });
      }
    } else if (result.startsWith("A")) {
      const parts = result.split(" ");
      const filePath = (parts[0] ?? "").substring(2);
      if (await canShowDiff({ filePath, engine })) {
        filesChanged.push(filePath);
        changes.push({
          action: "Added",
          fname: filePath,
        });
      }
    }
  });

  await Promise.all(
    changes.map(async (change) => {
      const { stdout } = await execa(
        "git",
        ["show", commitHash, "--", change.fname],
        { cwd: wsRoot, shell: true }
      );
      change.diff = Diff2Html.html(stdout);
      return Diff2Html.html(stdout);
    })
  );

  // get date of last commit
  const { stdout: stdOut2 } = await execa(
    "git",
    ["log", commitHash, "--format=%cd"],
    {
      cwd: wsRoot,
      shell: true,
    }
  );
  const date = stdOut2.split(/\s+/).slice(1, 5);
  // noUncheckedIndexedAccess guards for date parts (changelog cluster, Engine-Server first batch); length not guaranteed after slice
  const day = date[0] ?? "";
  const month = date[1] ?? "";
  const year = date[3] ?? "";
  commitDate = `${day} ${month} ${year}`;

  return {
    commitDate,
    commitHash,
    changes,
  };
}
