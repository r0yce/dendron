"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphTypeEnum = exports.GraphThemeEnum = exports.ConfigureUIMessageEnum = exports.SeedBrowserMessageType = exports.ThemeMessageType = exports.LookupViewMessageEnum = exports.NoteViewMessageEnum = exports.CalendarViewMessageType = exports.GraphViewMessageEnum = exports.DMessageEnum = exports.DMessageSource = exports.MergeConflictOptions = void 0;
var MergeConflictOptions;
(function (MergeConflictOptions) {
    MergeConflictOptions["OVERWRITE_LOCAL"] = "Overwrite local value with remote value";
    MergeConflictOptions["OVERWRITE_REMOTE"] = "Overwrite remote value with local value";
    MergeConflictOptions["SKIP"] = "Skip this conflict(We will not merge, you'll resolve this manually)";
    MergeConflictOptions["SKIP_ALL"] = "Skip All (you'll resolve all next conflicted entries manually) ";
})(MergeConflictOptions || (exports.MergeConflictOptions = MergeConflictOptions = {}));
var DMessageSource;
(function (DMessageSource) {
    DMessageSource["vscode"] = "vscode";
    DMessageSource["webClient"] = "webClient";
})(DMessageSource || (exports.DMessageSource = DMessageSource = {}));
var DMessageEnum;
(function (DMessageEnum) {
    /**
     * View is ready
     */
    DMessageEnum["INIT"] = "init";
    DMessageEnum["ON_DID_CHANGE_ACTIVE_TEXT_EDITOR"] = "onDidChangeActiveTextEditor";
    DMessageEnum["ON_UPDATE_PREVIEW_HTML"] = "onUpdatePreviewHTML";
    DMessageEnum["MESSAGE_DISPATCHER_READY"] = "messageDispatcherReady";
})(DMessageEnum || (exports.DMessageEnum = DMessageEnum = {}));
var GraphViewMessageEnum;
(function (GraphViewMessageEnum) {
    GraphViewMessageEnum["onSelect"] = "onSelect";
    GraphViewMessageEnum["onGetActiveEditor"] = "onGetActiveEditor";
    GraphViewMessageEnum["onReady"] = "onReady";
    GraphViewMessageEnum["onRequestGraphOpts"] = "onRequestGraphOpts";
    GraphViewMessageEnum["onGraphLoad"] = "onGraphLoad";
    GraphViewMessageEnum["onGraphThemeChange"] = "onGraphThemeChange";
    GraphViewMessageEnum["configureCustomStyling"] = "configureCustomStyling";
    GraphViewMessageEnum["toggleGraphView"] = "toggleGraphView";
    GraphViewMessageEnum["onGraphDepthChange"] = "onGraphDepthChange";
    GraphViewMessageEnum["toggleGraphEdges"] = "toggleGraphEdges";
})(GraphViewMessageEnum || (exports.GraphViewMessageEnum = GraphViewMessageEnum = {}));
var CalendarViewMessageType;
(function (CalendarViewMessageType) {
    CalendarViewMessageType["onSelect"] = "onSelect";
    CalendarViewMessageType["onGetActiveEditor"] = "onGetActiveEditor";
    CalendarViewMessageType["messageDispatcherReady"] = "messageDispatcherReady";
})(CalendarViewMessageType || (exports.CalendarViewMessageType = CalendarViewMessageType = {}));
var NoteViewMessageEnum;
(function (NoteViewMessageEnum) {
    NoteViewMessageEnum["onClick"] = "onClick";
    NoteViewMessageEnum["onGetActiveEditor"] = "onGetActiveEditor";
    NoteViewMessageEnum["onLock"] = "onLock";
    NoteViewMessageEnum["onUnlock"] = "onUnlock";
})(NoteViewMessageEnum || (exports.NoteViewMessageEnum = NoteViewMessageEnum = {}));
var LookupViewMessageEnum;
(function (LookupViewMessageEnum) {
    LookupViewMessageEnum["onUpdate"] = "onUpdate";
    LookupViewMessageEnum["onValuesChange"] = "onValuesChange";
    LookupViewMessageEnum["onRequestControllerState"] = "onRequestControllerState";
})(LookupViewMessageEnum || (exports.LookupViewMessageEnum = LookupViewMessageEnum = {}));
var ThemeMessageType;
(function (ThemeMessageType) {
    ThemeMessageType["onThemeChange"] = "onThemeChange";
    ThemeMessageType["getTheme"] = "getTheme";
})(ThemeMessageType || (exports.ThemeMessageType = ThemeMessageType = {}));
var SeedBrowserMessageType;
(function (SeedBrowserMessageType) {
    SeedBrowserMessageType["onSeedAdd"] = "onSeedAdd";
    SeedBrowserMessageType["onOpenUrl"] = "onOpenUrl";
    SeedBrowserMessageType["onSeedStateChange"] = "onSeedStateChange";
})(SeedBrowserMessageType || (exports.SeedBrowserMessageType = SeedBrowserMessageType = {}));
var ConfigureUIMessageEnum;
(function (ConfigureUIMessageEnum) {
    ConfigureUIMessageEnum["onUpdateConfig"] = "onUpdateConfig";
    ConfigureUIMessageEnum["openDendronConfigYaml"] = "openDendronConfigYaml";
})(ConfigureUIMessageEnum || (exports.ConfigureUIMessageEnum = ConfigureUIMessageEnum = {}));
var GraphThemeEnum;
(function (GraphThemeEnum) {
    GraphThemeEnum["Block"] = "Block";
    GraphThemeEnum["Classic"] = "Classic";
    GraphThemeEnum["Monokai"] = "Monokai";
    GraphThemeEnum["Custom"] = "Custom";
})(GraphThemeEnum || (exports.GraphThemeEnum = GraphThemeEnum = {}));
var GraphTypeEnum;
(function (GraphTypeEnum) {
    GraphTypeEnum["fullGraph"] = "fullGraph";
    GraphTypeEnum["localGraph"] = "localGraph";
})(GraphTypeEnum || (exports.GraphTypeEnum = GraphTypeEnum = {}));
//# sourceMappingURL=typesv2.js.map