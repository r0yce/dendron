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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebTelemetryClient = void 0;
const common_all_1 = require("@dendronhq/common-all");
const axios_1 = __importDefault(require("axios"));
const inject_1 = require("../../di/inject");
const vscode = __importStar(require("vscode"));
const getAnonymousId_1 = require("./getAnonymousId");
/**
 * This implementation talks to Segment services via their HTTP API. It's safe
 * to use in both web and node contexts.
 *
 * Note: the Segment Javascript library was not used here because it requires a
 * browser 'window' object, which is not available to web extensions.
 */
let WebTelemetryClient = class WebTelemetryClient {
    anonymousId;
    extVersion;
    constructor(anonymousId, extVersion) {
        this.anonymousId = anonymousId;
        this.extVersion = extVersion;
    }
    /**
     * This key talks to the 'Dendron-Web-Extension' source in Segment. NOTE: this
     * is different from the 'ide-prod' source.
     */
    DENDRON_WEB_EXTENSION_SEGMENT_WRITE_KEY = "bgfipVUsX5lwQomfZ8uwMQnBLVGRypeJ";
    requestConfig = {
        auth: {
            username: this.DENDRON_WEB_EXTENSION_SEGMENT_WRITE_KEY,
            password: "",
        },
        headers: {
            "Content-Type": "application/json",
        },
    };
    track(event, customProps, _segmentProps) {
        const properties = {
            ...customProps,
            appVersion: this.extVersion,
            vscodeSessionId: vscode.env.sessionId,
        };
        const data = {
            anonymousId: this.anonymousId,
            event,
            properties,
            integrations: { Amplitude: { session_id: vscode.env.sessionId } },
        };
        return axios_1.default.post("https://api.segment.io/v1/track", data, this.requestConfig);
    }
    identify() {
        const { appName, appHost, isNewAppInstall, language, machineId, shell, isTelemetryEnabled, } = vscode.env;
        const traits = {
            type: common_all_1.AppNames.CODE_WEB,
            ideVersion: vscode.version,
            ideFlavor: appName,
            appHost,
            appVersion: this.extVersion,
            userAgent: appName,
            isNewAppInstall,
            isTelemetryEnabled,
            language,
            machineId,
            shell,
        };
        const data = {
            anonymousId: this.anonymousId,
            traits,
        };
        return axios_1.default.post("https://api.segment.io/v1/identify", data, this.requestConfig);
    }
};
exports.WebTelemetryClient = WebTelemetryClient;
exports.WebTelemetryClient = WebTelemetryClient = __decorate([
    (0, inject_1.injectable)()
    /**
     * Use a separate registry for the dependencies of this class. If other places
     * start needing anonymousId or extVersion, then we can pull these out and into
     * the main container. By separating these here, we can simplify the test setup,
     * since tests don't use this ITelemetryClient implementation.
     */
    ,
    (0, inject_1.registry)([
        {
            token: "anonymousId",
            useFactory: (container) => (0, getAnonymousId_1.getAnonymousId)(container.resolve("extensionContext")),
        },
        {
            token: "extVersion",
            useFactory: (container) => {
                const context = container.resolve("extensionContext");
                return context.extension.packageJSON.version ?? "0.0.0";
            },
        },
    ]),
    __param(0, (0, inject_1.inject)("anonymousId")),
    __param(1, (0, inject_1.inject)("extVersion")),
    __metadata("design:paramtypes", [String, String])
], WebTelemetryClient);
//# sourceMappingURL=WebTelemetryClient.js.map