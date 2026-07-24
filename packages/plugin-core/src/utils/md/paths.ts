/**
 * Path / extension / slash helpers for wiki-links and assets.
 */
import path from "path";
import { sort as sortPaths } from "cross-path-sort";

export const markdownExtRegex = /\.md$/i;
export const refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
export const mdImageLinkPattern = "(\\[)([^\\[\\]]*)(\\]\\()([^\\[\\]]+?)(\\))";
export const partialRefPattern = "(\\[\\[)([^\\[\\]]+)";
export const REGEX_FENCED_CODE_BLOCK =
  /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;
export { sortPaths };
export const REGEX_CODE_SPAN = /`[^`]*?`/gm;
// export const RE_WIKI_LINK_ALIAS = "([^\\[\\]]+?\\|)?";
// const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
//   const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);
const uncPathRegex = /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/; // eslint-disable-line no-useless-escape
export const otherExts = [
  "doc",
  "docx",
  "rtf",
  "txt",
  "odt",
  "xls",
  "xlsx",
  "ppt",
  "pptm",
  "pptx",
  "pdf",
  "pages",
  "mp4",
  "mov",
  "wmv",
  "flv",
  "avi",
  "mkv",
  "mp3",
  "webm",
  "wav",
  "m4a",
  "ogg",
  "3gp",
  "flac",
];

export const imageExts = ["png", "jpg", "jpeg", "svg", "gif", "webp"];
const imageExtsRegex = new RegExp(`[.](${imageExts.join("|")})$`, "i");
export const isUncPath = (path: string): boolean => uncPathRegex.test(path);
const otherExtsRegex = new RegExp(`[.](${otherExts.join("|")})$`, "i");
export const containsOtherKnownExts = (pathParam: string): boolean =>
  !!otherExtsRegex.exec(path.parse(pathParam).ext);

export const containsUnknownExt = (pathParam: string): boolean =>
  path.parse(pathParam).ext !== "" &&
  !containsMarkdownExt(pathParam) &&
  !containsImageExt(pathParam) &&
  !containsOtherKnownExts(pathParam);

export const isLongRef = (path: string) => path.split("/").length > 1;

export const containsNonMdExt = (ref: string) => {
  return (
    containsImageExt(ref) ||
    containsOtherKnownExts(ref) ||
    containsUnknownExt(ref)
  );
};

export const containsMarkdownExt = (pathParam: string): boolean =>
  !!markdownExtRegex.exec(path.parse(pathParam).ext);

export const trimLeadingSlash = (value: string) =>
  value.replace(/^\/+|^\\+/g, "");
export const trimTrailingSlash = (value: string) =>
  value.replace(/\/+$|\\+$/g, "");
export const trimSlashes = (value: string) =>
  trimLeadingSlash(trimTrailingSlash(value));
export const normalizeSlashes = (value: string) => value.replace(/\\/gi, "/");

export const fsPathToRef = ({
  path: fsPath,
  keepExt,
  basePath,
}: {
  path: string;
  keepExt?: boolean;
  basePath?: string;
}): string | null => {
  const ref =
    basePath && fsPath.startsWith(basePath)
      ? normalizeSlashes(fsPath.replace(basePath, ""))
      : path.basename(fsPath);

  if (keepExt) {
    return trimLeadingSlash(ref);
  }

  return trimLeadingSlash(
    ref.includes(".") ? ref.slice(0, ref.lastIndexOf(".")) : ref
  );
};

export const containsImageExt = (pathParam: string): boolean =>
  !!imageExtsRegex.exec(path.parse(pathParam).ext);

/**
 * This returns the offset of the first character AFTER the ending frontmatter
 *  --- line. This function assumes there won't be a `\n---\n` key inside the
 *  frontmatter. Offset is 0 indexed.
 * @param input
 * @returns
 */
