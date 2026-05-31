"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupAutoCompleteCommand = void 0;
const inject_1 = require("../../di/inject");
const vscode_1 = require("vscode");
const constants_1 = require("../../constants");
let NoteLookupAutoCompleteCommand = class NoteLookupAutoCompleteCommand {
    emitter;
    static key = constants_1.DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;
    constructor(emitter) {
        this.emitter = emitter;
    }
    run() {
        this.emitter.fire();
    }
};
exports.NoteLookupAutoCompleteCommand = NoteLookupAutoCompleteCommand;
exports.NoteLookupAutoCompleteCommand = NoteLookupAutoCompleteCommand = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("AutoCompleteEventEmitter")),
    __metadata("design:paramtypes", [vscode_1.EventEmitter])
], NoteLookupAutoCompleteCommand);
//# sourceMappingURL=NoteLookupAutoCompleteCommand.js.map