/**
 * Resolve wiki-link / hashtag / user-tag under the cursor.
 */
import {
  ConfigUtils,
  DLinkType,
  DNoteAnchorBasic,
  DVault,
  isBlockAnchor,
  isLineAnchor,
  NoteUtils,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import {
  HASHTAG_REGEX_BASIC,
  HASHTAG_REGEX_LOOSE,
  LinkUtils,
  RemarkUtils,
  USERTAG_REGEX_LOOSE,
} from "@dendronhq/unified";
import _ from "lodash";
import vscode, { Position, Range } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import {
  containsImageExt,
  mdImageLinkPattern,
  partialRefPattern,
  refPattern,
} from "./paths";
import { isInCodeSpan, isInFencedCodeBlock } from "./markdownUtils";
import { RefT } from "./types";

export type getReferenceAtPositionResp = {
  range: vscode.Range;
  ref: string;
  label: string;
  anchorStart?: DNoteAnchorBasic | undefined;
  anchorEnd?: DNoteAnchorBasic | undefined;
  refType?: DLinkType | undefined;
  vaultName?: string | undefined;
  /** The full text inside the ref, e.g. for [[alias|foo.bar#anchor]] this is alias|foo.bar#anchor */
  refText: string;
};

export async function getReferenceAtPosition({
  document,
  position,
  wsRoot,
  vaults,
  opts,
}: {
  document: vscode.TextDocument;
  position: vscode.Position;
  wsRoot: string;
  vaults: DVault[];
  opts?: {
    partial?: boolean;
    allowInCodeBlocks: boolean;
  };
}): Promise<getReferenceAtPositionResp | null> {
  let refType: DLinkType | undefined;
  if (
    opts?.allowInCodeBlocks !== true &&
    (isInFencedCodeBlock(document, position.line) ||
      isInCodeSpan(document, position.line, position.character))
  ) {
    return null;
  }

  // check if image
  const rangeForImage = document.getWordRangeAtPosition(
    position,
    new RegExp(mdImageLinkPattern)
  );
  if (rangeForImage) {
    const docText = document.getText(rangeForImage);
    const maybeImage = _.trim(docText.match("\\((.*)\\)")![0], "()");
    if (containsImageExt(maybeImage)) {
      return null;
    }
  }

  // this should be a wikilink or reference
  const re = opts?.partial ? partialRefPattern : refPattern;
  const rangeWithLink = document.getWordRangeAtPosition(
    position,
    new RegExp(re)
  );

  // didn't find a ref
  // check if it is a user tag, a regular tag, or a frontmatter tag
  if (!rangeWithLink) {
    const { enableUserTags, enableHashTags } = ConfigUtils.getWorkspace(
      ExtensionProvider.getDWorkspace().config
    );
    if (enableHashTags) {
      // if not, it could be a hashtag
      const rangeForHashTag = document.getWordRangeAtPosition(
        position,
        HASHTAG_REGEX_BASIC
      );
      if (rangeForHashTag) {
        const docText = document.getText(rangeForHashTag);
        const match = docText.match(HASHTAG_REGEX_LOOSE);
        if (_.isNull(match)) return null;
        return {
          range: rangeForHashTag,
          label: match[0],
          ref: `${TAGS_HIERARCHY}${match.groups!.tagContents}`,
          refText: docText,
          refType: "hashtag",
        };
      }
    }
    if (enableUserTags) {
      // if not, it could be a user tag
      const rangeForUserTag = document.getWordRangeAtPosition(
        position,
        USERTAG_REGEX_LOOSE
      );
      if (rangeForUserTag) {
        const docText = document.getText(rangeForUserTag);
        const match = docText.match(USERTAG_REGEX_LOOSE);
        if (_.isNull(match)) return null;
        return {
          range: rangeForUserTag,
          label: match[0],
          ref: `${USERS_HIERARCHY}${match.groups!.userTagContents}`,
          refText: docText,
          refType: "usertag",
        };
      }
    }
    // if not, it could be a frontmatter tag
    // only parse if this is a dendron note
    if (
      !(await WorkspaceUtils.isDendronNote({
        wsRoot,
        vaults,
        fpath: document.uri.fsPath,
      }))
    ) {
      return null;
    }
    const maybeTags = RemarkUtils.extractFMTags(document.getText());
    if (!_.isEmpty(maybeTags)) {
      for (const tag of maybeTags) {
        // Offset 1 for the starting `---` line of frontmatter
        const tagPos = VSCodeUtils.position2VSCodeRange(tag.position, {
          line: 1,
        });
        if (
          tagPos.start.line <= position.line &&
          position.line <= tagPos.end.line &&
          tagPos.start.character <= position.character &&
          position.character <= tagPos.end.character
        ) {
          tag.value = _.trim(tag.value);
          return {
            range: tagPos,
            label: tag.value,
            ref: `${TAGS_HIERARCHY}${tag.value}`,
            refText: tag.value,
            refType: "fmtag",
          };
        }
      }
    }

    // it's not a wikilink, reference, or a hashtag. Nothing to do here.
    return null;
  }

  const docText = document.getText(rangeWithLink);
  const refText = docText
    .replace("![[", "")
    .replace("[[", "")
    .replace("]]", "");

  // don't incldue surrounding fluff for definition
  const { ref, label, anchorStart, anchorEnd, vaultName } = parseRef(refText);

  const startChar = rangeWithLink.start.character;
  // because
  const prefixRange = new Range(
    new Position(rangeWithLink.start.line, Math.max(0, startChar - 1)),
    new Position(rangeWithLink.start.line, startChar + 2)
  );
  const prefix = document.getText(prefixRange);
  if (prefix.indexOf("![[") >= 0) {
    refType = "refv2";
  } else if (prefix.indexOf("[[") >= 0) {
    refType = "wiki";
  }

  return {
    // If ref is missing, it's implicitly the current file
    ref: ref || NoteUtils.uri2Fname(document.uri),
    label,
    range: rangeWithLink,
    anchorStart,
    anchorEnd,
    refType,
    vaultName,
    refText,
  };
}

export const parseRef = (rawRef: string): RefT => {
  const parsed = LinkUtils.parseNoteRef(rawRef);
  if (_.isNull(parsed)) throw new Error(`Unable to parse reference ${rawRef}`);
  const { fname, alias } = parsed.from;
  const { anchorStart, anchorEnd, vaultName } = parsed.data;

  return {
    label: alias || "",
    ref: fname,
    anchorStart: parseAnchor(anchorStart),
    anchorEnd: parseAnchor(anchorEnd),
    vaultName,
  };
};

export const parseAnchor = (
  anchorValue?: string
): DNoteAnchorBasic | undefined => {
  // If undefined or empty string
  if (!anchorValue) return undefined;

  if (isBlockAnchor(anchorValue)) {
    return { type: "block", value: anchorValue.slice(1) };
  } else if (isLineAnchor(anchorValue)) {
    const value = anchorValue.slice(1);
    return {
      type: "line",
      value,
      line: _.toInteger(value),
    };
  } else {
    return { type: "header", value: anchorValue };
  }
};

