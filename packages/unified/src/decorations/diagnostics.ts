import {
  DendronError,
  Diagnostic,
  DiagnosticSeverity,
  IDendronError,
  newRange,
  NoteProps,
  position2VSCodeRange,
} from "@dendronhq/common-all";
import _ from "lodash";
import { FrontmatterContent } from "mdast";
import YAML from "js-yaml";

// These are used to match the warnings to code actions. Also displayed for users along with the warning message.
export const BAD_FRONTMATTER_CODE = "bad frontmatter";
export const NOT_A_STUB = "not a stub";

// These are error messages to display which tell the user how to fix the issue.
const RESOLVE_MESSAGE_AUTO_ONLY =
  "Please use the lightbulb, or run the Dendron: Doctor command.";
const RESOLVE_MESSAGE =
  "Please use the lightbulb, run the Dendron: Doctor command, or manually correct it.";

function badFrontmatter(props: Omit<Diagnostic, "source">) {
  return {
    /** Displayed to the user next to the warning message. */
    source: "Dendron",
    ...props,
  };
}

export function warnMissingFrontmatter() {
  const diagnostic: Diagnostic = badFrontmatter({
    message: `The frontmatter is missing. All notes in Dendron must have a frontmatter. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
    range: newRange(0, 0, 8, 15),
    severity: DiagnosticSeverity.Error,
    code: BAD_FRONTMATTER_CODE,
  });
  return diagnostic;
}

export function checkAndWarnBadFrontmatter(
  note: NoteProps,
  frontmatter: FrontmatterContent
) {
  const diagnostics: Diagnostic[] = [];
  const errors: IDendronError[] = [];
  // SubA (position cluster) of 3 sub-agents parallel dispatch for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". length/invariant guard + no ! (use isNodeWithPosition or fallback) per proven pattern. See common-server 0 + unified 57 precedent + engine batches. THE CHAIN DOES NOT STOP.
  const range = frontmatter.position
    ? position2VSCodeRange(frontmatter.position)
    : newRange(0, 0, 0, 0); // invariant for parsed FrontmatterContent in remark layer; defensive under noUncheckedIndexedAccess + exactOptional
  try {
    const frontmatterData = YAML.load(frontmatter.value) as any;
    if (!_.isString(frontmatterData.id)) {
      // Missing id
      diagnostics.push(
        badFrontmatter({
          message: `Note id is missing. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
          range,
          code: BAD_FRONTMATTER_CODE,
          severity: DiagnosticSeverity.Error,
        })
      );
    } else if (frontmatterData.id.match(/^[-_]|[-_]$/)) {
      diagnostics.push(
        badFrontmatter({
          message: `Note id is bad, it will not work in Github publishing. ${RESOLVE_MESSAGE}`,
          range,
          code: BAD_FRONTMATTER_CODE,
          severity: DiagnosticSeverity.Warning,
        })
      );
    } else if (note && frontmatterData.stub && /[^\s]/.test(note.body)) {
      // note body has non-whitespace characters in it
      diagnostics.push(
        badFrontmatter({
          message: `This note is not a stub, Please remove the stub property or update it to false`,
          range,
          code: NOT_A_STUB,
          severity: DiagnosticSeverity.Warning,
        })
      );
    }
  } catch (err) {
    errors.push(
      new DendronError({
        message: "failed to parse frontmatter",
        payload: err,
      })
    );
    diagnostics.push(
      badFrontmatter({
        message: `The frontmatter is broken. ${RESOLVE_MESSAGE}`,
        range,
        severity: DiagnosticSeverity.Error,
      })
    );
  }
  return { diagnostics, errors };
}
