"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTaskCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const base_1 = require("./base");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
const ExtensionProvider_1 = require("../ExtensionProvider");
const MeetingTelemHelper_1 = require("../utils/MeetingTelemHelper");
class CreateTaskCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.TASK_CREATE.key;
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    async execute(opts) {
        const ctx = "CreateTask";
        logger_1.Logger.info({ ctx, msg: "enter", opts });
        const { config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const { createTaskSelectionType, addBehavior } = common_all_1.ConfigUtils.getTask(config);
        (0, MeetingTelemHelper_1.maybeSendMeetingNoteTelemetry)("task");
        return {
            lookup: new NoteLookupCommand_1.NoteLookupCommand().run({
                noteType: common_all_1.LookupNoteTypeEnum.task,
                selectionType: createTaskSelectionType,
            }),
            addBehavior,
        };
    }
    addAnalyticsPayload(_opts, res) {
        return {
            addBehavior: res.addBehavior,
        };
    }
}
exports.CreateTaskCommand = CreateTaskCommand;
//# sourceMappingURL=CreateTask.js.map