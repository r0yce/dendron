"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureGraphStylesCommand = void 0;
const constants_1 = require("../constants");
const base_1 = require("./base");
const styles_1 = require("../styles");
class ConfigureGraphStylesCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_GRAPH_STYLES.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        if (!styles_1.GraphStyleService.doesStyleFileExist()) {
            styles_1.GraphStyleService.createStyleFile();
        }
        await styles_1.GraphStyleService.openStyleFile();
    }
}
exports.ConfigureGraphStylesCommand = ConfigureGraphStylesCommand;
//# sourceMappingURL=ConfigureGraphStyles.js.map