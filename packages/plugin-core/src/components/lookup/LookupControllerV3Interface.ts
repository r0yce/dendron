import { DNodeType } from "@dendronhq/common-all";
import { CancellationTokenSource } from "vscode";
import { DendronBtn } from "./ButtonTypes";
import { ILookupProviderV3 } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2 } from "./types";

export type CreateQuickPickOpts = {
  title?: string | undefined;
  placeholder: string;
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean | undefined;
  /**
   * Initial value for quickpick
   */
  initialValue?: string | undefined;
  nonInteractive?: boolean | undefined;
  /**
   * See {@link DendronQuickPickerV2["alwaysShow"]}
   */
  alwaysShow?: boolean | undefined;
  /**
   * if canSelectMany and items from selection, select all items at creation
   */
  selectAll?: boolean | undefined;
};

export type PrepareQuickPickOpts = CreateQuickPickOpts & {
  provider: ILookupProviderV3;
  onDidHide?: () => void;
};

export type ShowQuickPickOpts = {
  quickpick: DendronQuickPickerV2;
  provider: ILookupProviderV3;
  nonInteractive?: boolean | undefined;
  fuzzThreshold?: number | undefined;
};

export interface ILookupControllerV3 {
  readonly quickPick: DendronQuickPickerV2;

  fuzzThreshold: number;

  readonly cancelToken: CancellationTokenSource;

  nodeType: DNodeType;

  readonly provider: ILookupProviderV3;

  /**
   * Wire up quickpick and initialize buttons
   */
  prepareQuickPick(
    opts: PrepareQuickPickOpts
  ): Promise<{ quickpick: DendronQuickPickerV2 }>;

  showQuickPick(opts: ShowQuickPickOpts): Promise<DendronQuickPickerV2>;

  onHide(): void;

  show(
    opts: CreateQuickPickOpts & {
      /**
       * Don't show quickpick
       */
      nonInteractive?: boolean | undefined;
      /**
       * Initial value for quickpick
       */
      initialValue?: string | undefined;
      provider: ILookupProviderV3;
    }
  ): Promise<DendronQuickPickerV2>;

  createCancelSource(): CancellationTokenSource;

  /**
   * Indicates that the journal button is pressed
   *
   * @deprecated - this is a temp solution; remove from interface once there's a
   * better way to trigger journal button functionality
   */
  isJournalButtonPressed(): boolean;
}

export interface ILookupControllerV3Factory {
  create(opts?: LookupControllerV3CreateOpts): ILookupControllerV3;
}

export type LookupControllerV3CreateOpts = {
  /**
   * Node type
   */
  nodeType: string;
  /**
   * Replace default buttons
   */
  buttons?: DendronBtn[] | undefined;
  /**
   * When true, don't enable vault selection
   */
  disableVaultSelection?: boolean | undefined;
  /**
   * if vault selection isn't disabled,
   * press button on init if true
   */
  vaultButtonPressed?: boolean | undefined;
  /** If vault selection isn't disabled, allow choosing the mode of selection.
   *  Defaults to true. */
  vaultSelectCanToggle?: boolean | undefined;
  /**
   * Additional buttons
   */
  extraButtons?: DendronBtn[] | undefined;
  /**
   * 0.0 = exact match
   * 1.0 = match anything
   */
  fuzzThreshold?: number | undefined;
  /**
   * enable lookup view - false by default or if undefined
   */
  enableLookupView?: boolean | undefined;
  /**
   * optional custom title of quickpic
   */
  title?: string | undefined;
};
