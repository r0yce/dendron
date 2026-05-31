"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const ts_sinon_1 = require("ts-sinon");
const vscode = __importStar(require("vscode"));
const DummyTelemetryClient_1 = require("../../../../telemetry/common/DummyTelemetryClient");
const NoteLookupCmd_1 = require("../../../commands/NoteLookupCmd");
require("mocha/mocha");
suite("GIVEN a NoteLookupCmd", () => {
    test("WHEN the user selects nothing THEN nothing is written to the engine", async () => {
        const wsRoot = vscode.Uri.file("tmp");
        const mockNoteProvider = (0, ts_sinon_1.stubInterface)();
        const factory = {
            showLookup: () => {
                return Promise.resolve(0);
            },
        };
        const showLookupFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(factory, "showLookup", showLookupFake);
        const showTextDocumentFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(vscode.window, "showTextDocument", showTextDocumentFake);
        const mockEngine = (0, ts_sinon_1.stubInterface)();
        const cmd = new NoteLookupCmd_1.NoteLookupCmd(factory, wsRoot, mockEngine, mockNoteProvider, new DummyTelemetryClient_1.DummyTelemetryClient());
        await cmd.run();
        assert_1.default.strictEqual(showLookupFake.callCount, 1);
        assert_1.default.strictEqual(mockEngine.writeNote.callCount, 0);
        assert_1.default.strictEqual(showTextDocumentFake.callCount, 0);
        sinon_1.default.restore();
    });
    test("WHEN the user selects a note THEN that note is opened", async () => {
        const wsRoot = vscode.Uri.file("tmp");
        const mockNoteProvider = (0, ts_sinon_1.stubInterface)();
        const factory = {
            showLookup: () => {
                return Promise.resolve(0);
            },
        };
        const vault = {
            selfContained: true,
            fsPath: "path",
        };
        const lookupReturn = {
            items: [{ fname: "foo", vault }],
        };
        const showLookupFake = sinon_1.default.fake.resolves(lookupReturn);
        sinon_1.default.replace(factory, "showLookup", showLookupFake);
        const openTextDocumentFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(vscode.workspace, "openTextDocument", openTextDocumentFake);
        const showTextDocumentFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(vscode.window, "showTextDocument", showTextDocumentFake);
        const mockEngine = (0, ts_sinon_1.stubInterface)();
        const cmd = new NoteLookupCmd_1.NoteLookupCmd(factory, wsRoot, mockEngine, mockNoteProvider, new DummyTelemetryClient_1.DummyTelemetryClient());
        await cmd.run();
        assert_1.default.strictEqual(showLookupFake.callCount, 1);
        assert_1.default.strictEqual(mockEngine.writeNote.callCount, 0);
        assert_1.default.strictEqual(openTextDocumentFake.callCount, 1);
        assert_1.default.strictEqual(showTextDocumentFake.callCount, 1);
        sinon_1.default.restore();
    });
    test("WHEN Create New is selected THEN a new note is written", async () => {
        const wsRoot = vscode.Uri.file("tmp");
        const mockNoteProvider = (0, ts_sinon_1.stubInterface)();
        const factory = {
            showLookup: () => {
                return Promise.resolve(0);
            },
        };
        const vault = {
            selfContained: true,
            fsPath: "path",
        };
        const lookupReturn = {
            items: [{ fname: "foo", vault, label: "Create New" }],
        };
        const showLookupFake = sinon_1.default.fake.resolves(lookupReturn);
        sinon_1.default.replace(factory, "showLookup", showLookupFake);
        const openTextDocumentFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(vscode.workspace, "openTextDocument", openTextDocumentFake);
        const showTextDocumentFake = sinon_1.default.fake.resolves(undefined);
        sinon_1.default.replace(vscode.window, "showTextDocument", showTextDocumentFake);
        const mockEngine = (0, ts_sinon_1.stubInterface)();
        mockEngine.writeNote.resolves({ data: [] });
        const cmd = new NoteLookupCmd_1.NoteLookupCmd(factory, wsRoot, mockEngine, mockNoteProvider, new DummyTelemetryClient_1.DummyTelemetryClient());
        await cmd.run();
        assert_1.default.strictEqual(showLookupFake.callCount, 1);
        assert_1.default.strictEqual(mockEngine.writeNote.callCount, 1);
        assert_1.default.strictEqual(openTextDocumentFake.callCount, 1, "OpenTextDocument called once");
        assert_1.default.strictEqual(showTextDocumentFake.callCount, 1, "ShowTextDocument called once");
        sinon_1.default.restore();
    });
});
//# sourceMappingURL=NoteLookupCmd.test.js.map