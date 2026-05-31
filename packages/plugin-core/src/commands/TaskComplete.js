"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCompleteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const base_1 = require("./base");
const vsCodeUtils_1 = require("../vsCodeUtils");
const TaskStatus_1 = require("./TaskStatus");
const ConfigureCommand_1 = require("./ConfigureCommand");
class TaskCompleteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.TASK_COMPLETE.key;
    static requireActiveWorkspace = true;
    _ext;
    constructor(extension) {
        super();
        this._ext = extension;
    }
    async execute(_opts) {
        const complete = common_all_1.ConfigUtils.getTask(this._ext.getDWorkspace().config).taskCompleteStatus[0];
        if (complete === undefined) {
            const title = "Open the configuration file";
            await vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.ERROR, "You have no task statuses marked as complete. Please add something to 'taskCompleteStatus' in your configuration file. See: https://wiki.dendron.so/notes/SEASewZSteDK7ry1AshNG#taskcompletestatus", {}, { title }).then((pressed) => {
                if (pressed?.title === title) {
                    const openConfig = new ConfigureCommand_1.ConfigureCommand(this._ext);
                    openConfig.run();
                }
            });
            return {};
        }
        const taskStatusCmd = new TaskStatus_1.TaskStatusCommand(this._ext);
        return taskStatusCmd.run({
            setStatus: complete,
        });
    }
}
exports.TaskCompleteCommand = TaskCompleteCommand;
//# sourceMappingURL=TaskComplete.js.map