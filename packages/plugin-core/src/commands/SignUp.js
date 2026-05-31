"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUpCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class SignUpCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SIGNUP.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        vscode_1.env.openExternal(vscode_1.Uri.parse("https://auth.dendron.so/signup?client_id=7uamhg5vcchlrb149k1bs9k48i&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://app.dendron.so"));
    }
}
exports.SignUpCommand = SignUpCommand;
//# sourceMappingURL=SignUp.js.map