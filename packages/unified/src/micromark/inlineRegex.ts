import type { CompileContext } from "mdast-util-from-markdown";
import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import type { Options as ToMarkdownExtension } from "mdast-util-to-markdown";
import {
  markdownLineEnding,
  unicodeWhitespace,
} from "micromark-util-character";
import type {
  Code,
  Effects,
  Extension as MicromarkExtension,
  State,
} from "micromark-util-types";

export type PreviousGuard = (code: Code) => boolean;

export type InlineRegexOptions<Node extends { type: string }> = {
  charCode: number;
  tokenType: string;
  mdastType: string;
  match: RegExp;
  previous?: PreviousGuard;
  toFields: (
    match: RegExpMatchArray,
    context: CompileContext
  ) => Omit<Node, "type"> | undefined;
  toMarkdown: ToMarkdownHandle;
};

export function createInlineRegexExtension<Node extends { type: string }>(
  options: InlineRegexOptions<Node>
): {
  micromark: MicromarkExtension;
  fromMarkdown: FromMarkdownExtension;
  toMarkdown: ToMarkdownExtension;
} {
  const {
    charCode,
    tokenType,
    mdastType,
    match,
    previous,
    toFields,
    toMarkdown: serialize,
  } = options;

  const construct = {
    tokenize: tokenizeInlineRegex,
    previous,
  };

  function tokenizeInlineRegex(
    effects: Effects,
    ok: State,
    nok: State
  ): State {
    let buffer = "";

    const isComplete = (value: string) => {
      const matched = match.exec(value);
      return matched !== null && matched[0] === value;
    };

    const isPossible = (value: string) => {
      if (isComplete(value)) {
        return true;
      }
      const prefixes = [
        "",
        "a",
        "z",
        "0",
        "-",
        "_",
        "\n",
        " ",
        "[",
        "]",
        "!",
        "#",
        "/",
        ".",
      ];
      return prefixes.some((suffix) => {
        const matched = match.exec(value + suffix);
        return matched !== null && matched[0].startsWith(value);
      });
    };

    return start;

    function start(code: Code): State {
      if (code === null || code !== charCode) {
        return nok(code) as State;
      }
      buffer = String.fromCharCode(code);
      if (!isPossible(buffer)) {
        return nok(code) as State;
      }
      effects.enter(tokenType as never);
      effects.consume(code);
      if (isComplete(buffer)) {
        effects.exit(tokenType as never);
        return ok(code) as State;
      }
      return consume;
    }

    function consume(code: Code): State {
      if (code === null) {
        if (isComplete(buffer)) {
          effects.exit(tokenType as never);
          return ok(code) as State;
        }
        return nok(code) as State;
      }
      const next = buffer + String.fromCharCode(code);
      if (!isPossible(next)) {
        return nok(code) as State;
      }
      effects.consume(code);
      buffer = next;
      if (isComplete(buffer)) {
        effects.exit(tokenType as never);
        return ok(code) as State;
      }
      return consume;
    }
  }

  const micromark: MicromarkExtension = {
    text: {
      [charCode]: construct as never,
    },
  };

  const fromMarkdown: FromMarkdownExtension = {
    enter: {
      [tokenType](token) {
        this.enter({ type: mdastType } as never, token);
      },
    },
    exit: {
      [tokenType](token) {
        const slice = this.sliceSerialize(token);
        const matched = match.exec(slice);
        const node = this.stack[this.stack.length - 1] as Node | undefined;
        if (!matched || !node || node.type !== mdastType) {
          this.exit(token);
          return;
        }
        const fields = toFields(matched, this);
        if (!fields) {
          this.stack.pop();
          return;
        }
        Object.assign(node, fields);
        this.exit(token);
      },
    },
  };

  const toMarkdownExtension: ToMarkdownExtension = {
    handlers: {
      [mdastType]: serialize,
    },
  };

  return {
    micromark,
    fromMarkdown,
    toMarkdown: toMarkdownExtension,
  };
}

/** Require whitespace (or start) before `#`, `@`, etc. */
export function previousTagTrigger(code: Code): boolean {
  return (
    code === null ||
    markdownLineEnding(code) ||
    unicodeWhitespace(code) === true
  );
}