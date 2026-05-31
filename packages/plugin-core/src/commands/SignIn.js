"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class SignInCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SIGNIN.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        vscode_1.env.openExternal(vscode_1.Uri.parse("https://auth.dendron.so/login?client_id=7uamhg5vcchlrb149k1bs9k48i&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https://app.dendron.so"));
    }
}
exports.SignInCommand = SignInCommand;
//# sourceMappingURL=SignIn.js.map