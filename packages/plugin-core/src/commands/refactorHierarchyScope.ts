/**
 * Scope picker for RefactorHierarchy (workspace vs selection wikilinks).
 */
import { DNodePropsQuickInputV2 } from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import { LinkUtils } from "@dendronhq/unified";
import { Disposable } from "vscode";
import {
  MultiSelectBtn,
  Selection2ItemsBtn,
} from "../components/lookup/buttons";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DendronContext } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";

export async function promptRefactorScope(opts: {
  commandKey: string;
  entireWorkspaceItem: DNodePropsQuickInputV2;
  logger: { info?: Function; error?: Function; debug?: Function };
}): Promise<NoteLookupProviderSuccessResp | undefined> {
  const { text } = VSCodeUtils.getSelection();
  const wikiLinks = text ? LinkUtils.extractWikiLinks(text) : [];
  const shouldUseSelection = wikiLinks.length > 0;

  if (!shouldUseSelection) {
    return {
      selectedItems: [opts.entireWorkspaceItem],
      onAcceptHookResp: [],
    };
  }

  const lcOpts: LookupControllerV3CreateOpts = {
    nodeType: "note",
    disableVaultSelection: true,
    vaultSelectCanToggle: false,
    extraButtons: [
      Selection2ItemsBtn.create({ pressed: true, canToggle: false }),
      MultiSelectBtn.create({ pressed: true, canToggle: false }),
    ],
  };
  const extension = ExtensionProvider.getExtension();
  const lc = extension.lookupControllerFactory.create(lcOpts);

  const provider = extension.noteLookupProviderFactory.create(opts.commandKey, {
    allowNewNote: false,
    noHidePickerOnAccept: false,
  });
  return new Promise((resolve) => {
    let disposable: Disposable;
    NoteLookupProviderUtils.subscribe({
      id: opts.commandKey,
      controller: lc,
      logger: opts.logger as any,
      onDone: (event: HistoryEvent) => {
        const data = event.data as NoteLookupProviderSuccessResp;
        if (data.cancel) {
          resolve(undefined);
        }
        resolve(data);
        disposable?.dispose();
        VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
      },
      onHide: () => {
        resolve(undefined);
        disposable?.dispose();
        VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
      },
    });
    lc.show({
      title: "Decide the scope of refactor",
      placeholder: "Query for scope.",
      provider,
      selectAll: true,
    });

    VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

    disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
      if (lc.quickPick) {
        lc.quickPick.value = AutoCompleter.getAutoCompletedValue(lc.quickPick);
        lc.provider.onUpdatePickerItems({
          picker: lc.quickPick,
        });
      }
    });
  });
}
