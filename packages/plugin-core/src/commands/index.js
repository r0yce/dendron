"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_COMMANDS = void 0;
const AddAndCommit_1 = require("./AddAndCommit");
const ApplyTemplateCommand_1 = require("./ApplyTemplateCommand");
const ArchiveHierarchy_1 = require("./ArchiveHierarchy");
const BrowseNoteCommand_1 = require("./BrowseNoteCommand");
const ChangeWorkspace_1 = require("./ChangeWorkspace");
const ConfigureCommand_1 = require("./ConfigureCommand");
const ConfigureLocalOverride_1 = require("./ConfigureLocalOverride");
const ConfigureGraphStyles_1 = require("./ConfigureGraphStyles");
const ConfigureNoteTraitsCommand_1 = require("./ConfigureNoteTraitsCommand");
const ConfigurePodCommand_1 = require("./ConfigurePodCommand");
const Contribute_1 = require("./Contribute");
const ConvertCandidateLink_1 = require("./ConvertCandidateLink");
const ConvertLink_1 = require("./ConvertLink");
const CopyNoteLink_1 = require("./CopyNoteLink");
const CopyNoteRef_1 = require("./CopyNoteRef");
const CopyNoteURL_1 = require("./CopyNoteURL");
const CopyToClipboardCommand_1 = require("./CopyToClipboardCommand");
const CreateDailyJournal_1 = require("./CreateDailyJournal");
const CreateHookCommand_1 = require("./CreateHookCommand");
const CreateJournalNoteCommand_1 = require("./CreateJournalNoteCommand");
const CreateMeetingNoteCommand_1 = require("./CreateMeetingNoteCommand");
const CreateNoteWithUserDefinedTrait_1 = require("./CreateNoteWithUserDefinedTrait");
const CreateSchemaFromHierarchyCommand_1 = require("./CreateSchemaFromHierarchyCommand");
const CreateScratchNoteCommand_1 = require("./CreateScratchNoteCommand");
const CreateTask_1 = require("./CreateTask");
const DeleteHookCommand_1 = require("./DeleteHookCommand");
const DeleteCommand_1 = require("./DeleteCommand");
const DevTriggerCommand_1 = require("./DevTriggerCommand");
const DevShowActivationReport_1 = require("./DevShowActivationReport");
const DevShowAllPerfReports_1 = require("./DevShowAllPerfReports");
const DiagnosticsReport_1 = require("./DiagnosticsReport");
const DisableTelemetry_1 = require("./DisableTelemetry");
const Doctor_1 = require("./Doctor");
const EnableTelemetry_1 = require("./EnableTelemetry");
const ExportPod_1 = require("./ExportPod");
const GoDownCommand_1 = require("./GoDownCommand");
const Goto_1 = require("./Goto");
const GotoNote_1 = require("./GotoNote");
const GoUpCommand_1 = require("./GoUpCommand");
const ImportPod_1 = require("./ImportPod");
const InsertNoteIndexCommand_1 = require("./InsertNoteIndexCommand");
const InsertNoteLink_1 = require("./InsertNoteLink");
const InstrumentedWrapperCommand_1 = require("./InstrumentedWrapperCommand");
const LaunchTutorialWorkspaceCommand_1 = require("./LaunchTutorialWorkspaceCommand");
const MigrateSelfContainedVault_1 = require("./MigrateSelfContainedVault");
const MoveHeader_1 = require("./MoveHeader");
const MoveNoteCommand_1 = require("./MoveNoteCommand");
const NoteLookupAutoCompleteCommand_1 = require("./node/NoteLookupAutoCompleteCommand");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
const OpenBackupCommand_1 = require("./OpenBackupCommand");
const OpenLink_1 = require("./OpenLink");
const OpenLogs_1 = require("./OpenLogs");
const PasteFile_1 = require("./PasteFile");
const PasteLink_1 = require("./PasteLink");
const ConfigureExportPodV2_1 = require("./pods/ConfigureExportPodV2");
const ConfigureServiceConnection_1 = require("./pods/ConfigureServiceConnection");
const ExportPodV2Command_1 = require("./pods/ExportPodV2Command");
const ImportObsidianCommand_1 = require("./pods/ImportObsidianCommand");
const PublishDevCommand_1 = require("./PublishDevCommand");
const PublishExportCommand_1 = require("./PublishExportCommand");
const PublishPod_1 = require("./PublishPod");
const RandomNote_1 = require("./RandomNote");
const RefactorHierarchyV2_1 = require("./RefactorHierarchyV2");
const RegisterNoteTraitCommand_1 = require("./RegisterNoteTraitCommand");
const RenameHeader_1 = require("./RenameHeader");
const ResetConfig_1 = require("./ResetConfig");
const RestoreVault_1 = require("./RestoreVault");
const RunMigrationCommand_1 = require("./RunMigrationCommand");
const SchemaLookupCommand_1 = require("./SchemaLookupCommand");
const SetupWorkspace_1 = require("./SetupWorkspace");
const ShowHelp_1 = require("./ShowHelp");
const ShowLegacyPreview_1 = require("./ShowLegacyPreview");
const ShowWelcomePageCommand_1 = require("./ShowWelcomePageCommand");
const SignIn_1 = require("./SignIn");
const SignUp_1 = require("./SignUp");
const SnapshotVault_1 = require("./SnapshotVault");
const Sync_1 = require("./Sync");
const TaskComplete_1 = require("./TaskComplete");
const TaskStatus_1 = require("./TaskStatus");
const UpgradeSettings_1 = require("./UpgradeSettings");
const ValidateEngineCommand_1 = require("./ValidateEngineCommand");
const VaultAddCommand_1 = require("./VaultAddCommand");
const ConvertVaultCommand_1 = require("./ConvertVaultCommand");
const RenameNoteCommand_1 = require("./RenameNoteCommand");
const CreateNoteCommand_1 = require("./CreateNoteCommand");
const MergeNoteCommand_1 = require("./MergeNoteCommand");
const CopyCodespaceURL_1 = require("./CopyCodespaceURL");
const MoveSelectionToCommand_1 = require("./MoveSelectionToCommand");
const CopyAsCommand_1 = require("./CopyAsCommand");
const RemoveVaultCommand_1 = require("./RemoveVaultCommand");
const CreateNewVaultCommand_1 = require("./CreateNewVaultCommand");
const AddExistingVaultCommand_1 = require("./AddExistingVaultCommand");
/**
 * Note: this does not contain commands that have parametered constructors, as
 * those cannot be cast to the CodeCommandConstructor interface.
 */
const ALL_COMMANDS = [
    AddAndCommit_1.AddAndCommit,
    ArchiveHierarchy_1.ArchiveHierarchyCommand,
    BrowseNoteCommand_1.BrowseNoteCommand,
    ChangeWorkspace_1.ChangeWorkspaceCommand,
    ConfigureCommand_1.ConfigureCommand,
    ConfigureLocalOverride_1.ConfigureLocalOverride,
    ConfigurePodCommand_1.ConfigurePodCommand,
    ConfigureServiceConnection_1.ConfigureServiceConnection,
    ConfigureExportPodV2_1.ConfigureExportPodV2,
    ConfigureGraphStyles_1.ConfigureGraphStylesCommand,
    Contribute_1.ContributeCommand,
    CopyNoteLink_1.CopyNoteLinkCommand,
    CopyNoteRef_1.CopyNoteRefCommand,
    CopyNoteURL_1.CopyNoteURLCommand,
    CopyToClipboardCommand_1.CopyToClipboardCommand,
    CreateDailyJournal_1.CreateDailyJournalCommand,
    CreateHookCommand_1.CreateHookCommand,
    MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand,
    CreateSchemaFromHierarchyCommand_1.CreateSchemaFromHierarchyCommand,
    DeleteHookCommand_1.DeleteHookCommand,
    DeleteCommand_1.DeleteCommand,
    DiagnosticsReport_1.DiagnosticsReportCommand,
    DisableTelemetry_1.DisableTelemetryCommand,
    DevTriggerCommand_1.DevTriggerCommand,
    DevShowActivationReport_1.DevShowActivationReport,
    DevShowAllPerfReports_1.DevShowAllPerfReports,
    EnableTelemetry_1.EnableTelemetryCommand,
    Doctor_1.DoctorCommand,
    ExportPod_1.ExportPodCommand,
    ExportPodV2Command_1.ExportPodV2Command,
    GoDownCommand_1.GoDownCommand,
    GoUpCommand_1.GoUpCommand,
    Goto_1.GotoCommand,
    GotoNote_1.GotoNoteCommand,
    ImportPod_1.ImportPodCommand,
    ImportObsidianCommand_1.ImportObsidianCommand,
    InsertNoteLink_1.InsertNoteLinkCommand,
    InsertNoteIndexCommand_1.InsertNoteIndexCommand,
    NoteLookupCommand_1.NoteLookupCommand,
    NoteLookupAutoCompleteCommand_1.NoteLookupAutoCompleteCommand,
    CreateJournalNoteCommand_1.CreateJournalNoteCommand,
    CreateScratchNoteCommand_1.CreateScratchNoteCommand,
    CreateMeetingNoteCommand_1.CreateMeetingNoteCommand,
    SchemaLookupCommand_1.SchemaLookupCommand,
    OpenLink_1.OpenLinkCommand,
    OpenLogs_1.OpenLogsCommand,
    PasteFile_1.PasteFileCommand,
    PasteLink_1.PasteLinkCommand,
    PublishPod_1.PublishPodCommand,
    MoveNoteCommand_1.MoveNoteCommand,
    MoveSelectionToCommand_1.MoveSelectionToCommand,
    RenameNoteCommand_1.RenameNoteCommand,
    RenameHeader_1.RenameHeaderCommand,
    MoveHeader_1.MoveHeaderCommand,
    RefactorHierarchyV2_1.RefactorHierarchyCommandV2,
    RandomNote_1.RandomNoteCommand,
    ResetConfig_1.ResetConfigCommand,
    RestoreVault_1.RestoreVaultCommand,
    SetupWorkspace_1.SetupWorkspaceCommand,
    ShowHelp_1.ShowHelpCommand,
    ShowLegacyPreview_1.ShowLegacyPreviewCommand,
    SignIn_1.SignInCommand,
    SignUp_1.SignUpCommand,
    PublishExportCommand_1.PublishExportCommand,
    PublishDevCommand_1.PublishDevCommand,
    SnapshotVault_1.SnapshotVaultCommand,
    Sync_1.SyncCommand,
    ApplyTemplateCommand_1.ApplyTemplateCommand,
    UpgradeSettings_1.UpgradeSettingsCommand,
    VaultAddCommand_1.VaultAddCommand,
    CreateNewVaultCommand_1.CreateNewVaultCommand,
    AddExistingVaultCommand_1.AddExistingVaultCommand,
    RemoveVaultCommand_1.RemoveVaultCommand,
    ConvertVaultCommand_1.ConvertVaultCommand,
    ShowWelcomePageCommand_1.ShowWelcomePageCommand,
    LaunchTutorialWorkspaceCommand_1.LaunchTutorialWorkspaceCommand,
    ConvertLink_1.ConvertLinkCommand,
    ConvertCandidateLink_1.ConvertCandidateLinkCommand,
    RunMigrationCommand_1.RunMigrationCommand,
    CreateTask_1.CreateTaskCommand,
    TaskStatus_1.TaskStatusCommand,
    TaskComplete_1.TaskCompleteCommand,
    RegisterNoteTraitCommand_1.RegisterNoteTraitCommand,
    ConfigureNoteTraitsCommand_1.ConfigureNoteTraitsCommand,
    CreateNoteWithUserDefinedTrait_1.CreateNoteWithUserDefinedTrait,
    OpenBackupCommand_1.OpenBackupCommand,
    InstrumentedWrapperCommand_1.InstrumentedWrapperCommand,
    ValidateEngineCommand_1.ValidateEngineCommand,
    MergeNoteCommand_1.MergeNoteCommand,
    CreateNoteCommand_1.CreateNoteCommand,
    CopyCodespaceURL_1.CopyCodespaceURL,
    CopyAsCommand_1.CopyAsCommand,
];
exports.ALL_COMMANDS = ALL_COMMANDS;
//# sourceMappingURL=index.js.map