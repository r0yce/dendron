/**
 * VS Code language feature registration (definition, references, hover, …).
 * Split from `_extension.ts` for maintainability.
 *
 * Critical features run before activation returns; deferred ones schedule after.
 */
import * as vscode from "vscode";
import { codeActionProvider } from "../features/codeActionProvider";
import { completionProvider } from "../features/completionProvider";
import DefinitionProvider from "../features/DefinitionProvider";
import FrontmatterFoldingRangeProvider from "../features/FrontmatterFoldingRangeProvider";
import ReferenceHoverProvider from "../features/ReferenceHoverProvider";
import ReferenceProvider from "../features/ReferenceProvider";
import RenameProvider from "../features/RenameProvider";

/** Critical language features needed for immediate note navigation after activate. */
export function setupCriticalLanguageFeatures(
  context: vscode.ExtensionContext
): void {
  const anyLangSelector: vscode.DocumentFilter = { scheme: "file" };
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      anyLangSelector,
      new DefinitionProvider()
    )
  );
  completionProvider.activate(context);
}

/** Heavier providers deferred until after activation returns (Sprint 1). */
export function setupDeferredLanguageFeatures(
  context: vscode.ExtensionContext
): void {
  const mdLangSelector: vscode.DocumentFilter = {
    language: "markdown",
    scheme: "file",
  };
  const anyLangSelector: vscode.DocumentFilter = { scheme: "file" };
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      mdLangSelector,
      new ReferenceProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      anyLangSelector,
      new ReferenceHoverProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      mdLangSelector,
      new FrontmatterFoldingRangeProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(
      mdLangSelector,
      new RenameProvider()
    )
  );
  codeActionProvider.activate(context);
}
