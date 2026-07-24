/**
 * Workspace lifecycle helpers used during activation (analytics, version fixup).
 */
import { GitEvents, WorkspaceType } from "@dendronhq/common-all";
import type { IDendronExtension } from "../dendronExtensionInterface";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import semver from "semver";
import { StateService } from "../services/stateService";
import { AnalyticsUtils } from "../utils/analytics";
import { trackTopLevelRepoFound } from "./activatorHelpers";

export function analyzeWorkspace({
  wsService,
}: {
  wsService: WorkspaceService;
}) {
  // Track contributors to repositories, but do so in the background so
  // initialization isn't delayed.
  const startGetAllReposNumContributors = process.hrtime();
  wsService
    .getAllReposNumContributors()
    .then((numContributors) => {
      AnalyticsUtils.track(GitEvents.ContributorsFound, {
        maxNumContributors: _.max(numContributors),
        duration: getDurationMilliseconds(startGetAllReposNumContributors),
      });
    })
    .catch((err) => {
      Sentry.captureException(err);
    });
  trackTopLevelRepoFound({ wsService });
}

export async function getAndCleanPreviousWSVersion({
  wsService,
  stateService,
  ext,
}: {
  stateService: StateService;
  wsService: WorkspaceService;
  ext: IDendronExtension;
}) {
  let previousWorkspaceVersionFromWSService = wsService.getMeta().version;

  // Fix a temporary issue where CLI was writing an invalid version number
  // to .dendron.ws:
  if (previousWorkspaceVersionFromWSService === "dendron-cli") {
    previousWorkspaceVersionFromWSService = "0.91.0";
  }
  if (ext.type === WorkspaceType.NATIVE) {
    return previousWorkspaceVersionFromWSService;
  }

  // Code workspace specific code
  // Migration code: we used to store verion history in state vs metadata
  const previousWorkspaceVersionFromState = stateService.getWorkspaceVersion();
  if (
    !semver.valid(previousWorkspaceVersionFromWSService) ||
    semver.gt(
      previousWorkspaceVersionFromState,
      previousWorkspaceVersionFromWSService,
    )
  ) {
    previousWorkspaceVersionFromWSService = previousWorkspaceVersionFromState;
    wsService.writeMeta({ version: previousWorkspaceVersionFromState });
  }
  return previousWorkspaceVersionFromWSService;
}
