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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodUtils = exports.podClassEntryToPodItemV4 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const fs_extra_1 = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const image_downloader_1 = __importDefault(require("image-downloader"));
const axios_1 = __importDefault(require("axios"));
__exportStar(require("./builtin"), exports);
__exportStar(require("./types"), exports);
const ajv = new ajv_1.default();
(0, ajv_formats_1.default)(ajv);
const podClassEntryToPodItemV4 = (p) => {
    return {
        id: p.id,
        description: p.description,
        podClass: p,
    };
};
exports.podClassEntryToPodItemV4 = podClassEntryToPodItemV4;
class PodUtils {
    /**
     * @param param0
     * @returns config for v1 pods
     */
    static getConfig({ podsDir, podClass, }) {
        const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
        return PodUtils.readPodConfigFromDisk(podConfigPath);
    }
    /**
     * @param param0
     * @returns config path for v1 pods
     */
    static getConfigPath({ podsDir, podClass, }) {
        return path_1.default.join(podsDir, podClass.id, `config.${podClass.kind}.yml`);
    }
    static getPath({ podsDir, podClass, }) {
        return path_1.default.join(podsDir, podClass.id);
    }
    static getPodDir(opts) {
        const podsPath = path_1.default.join(opts.wsRoot, "pods");
        return podsPath;
    }
    static createExportConfig(opts) {
        return {
            type: "object",
            additionalProperties: false,
            required: ["dest", ...opts.required],
            properties: {
                dest: {
                    type: "string",
                    description: "Where to export to",
                },
                includeBody: {
                    type: "boolean",
                    default: true,
                    description: "should body be included",
                    nullable: true,
                },
                includeStubs: {
                    type: "boolean",
                    description: "should stubs be included",
                    nullable: true,
                },
                ignore: { type: "array", items: { type: "string" }, nullable: true },
                vaults: {
                    type: "object",
                    description: "include or exclude certain vaults",
                    nullable: true,
                    properties: {
                        include: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                        exclude: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                    },
                },
                ...opts.properties,
            },
        };
    }
    static createImportConfig(opts) {
        return {
            type: "object",
            required: ["src", "vaultName", ...opts.required],
            properties: {
                src: {
                    type: "string",
                    description: "Where to import from",
                },
                vaultName: {
                    type: "string",
                    description: "name of vault to import into",
                },
                concatenate: {
                    type: "boolean",
                    description: "whether to concatenate everything into one note",
                    nullable: true,
                },
                frontmatter: {
                    description: "frontmatter to add to each note",
                    type: "object",
                    nullable: true,
                },
                fnameAsId: {
                    description: "use the file name as the id",
                    type: "boolean",
                    nullable: true,
                },
                destName: {
                    description: "If concatenate is set, name of destination path",
                    type: "string",
                    nullable: true,
                },
                ...opts.properties,
            },
            if: {
                properties: { concatenate: { const: true } },
            },
            then: {
                dependencies: {
                    concatenate: ["destName"],
                },
            },
        };
    }
    static createPublishConfig(opts) {
        return {
            type: "object",
            required: [...opts.required],
            properties: {
                fname: {
                    description: "name of src file",
                    type: "string",
                },
                vaultName: {
                    description: "name of src vault",
                    type: "string",
                },
                dest: {
                    description: "where to export to",
                    type: "string",
                },
                ...opts.properties,
            },
        };
    }
    /**
     * Create config file if it doesn't exist
     */
    static genConfigFile({ podsDir, podClass, force, }) {
        const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
        (0, fs_extra_1.ensureDirSync)(path_1.default.dirname(podConfigPath));
        // eslint-disable-next-line new-cap
        const pod = new podClass();
        const required = pod.config.required;
        const podConfig = pod.config.properties;
        const config = Object.keys(podConfig)
            .map((ent) => {
            podConfig[ent] = lodash_1.default.defaults(podConfig[ent], { default: "TODO" });
            const args = [
                `# description: ${podConfig[ent].description}`,
                `# type: ${podConfig[ent].type}`,
            ];
            let configPrefix = "# ";
            if (required.includes(`${ent}`)) {
                args.push(`# required: true`);
                configPrefix = "";
            }
            args.push(`${configPrefix}${ent}: ${podConfig[ent].default}`);
            return args.join("\n");
        })
            .join("\n\n");
        if (!fs_extra_1.default.existsSync(podConfigPath) || force) {
            (0, fs_extra_1.writeFileSync)(podConfigPath, config);
        }
        return podConfigPath;
    }
    static validate(config, schema) {
        const validateConfig = ajv.compile(schema);
        const valid = validateConfig(config);
        if (!valid) {
            const errors = ajv.errorsText(validateConfig.errors);
            throw new common_all_1.DendronError({
                message: `validation errors: ${errors}`,
                payload: `error: ${JSON.stringify(validateConfig.errors)}`,
            });
        }
    }
    static hasRequiredOpts(_pClassEntry) {
        const pod = new _pClassEntry();
        if (pod.config.required.length > 0) {
            return true;
        }
        let hasReqOpts = false;
        const properties = pod.config.properties;
        Object.keys(properties).forEach((prop) => {
            if (prop.nullable && lodash_1.default.isUndefined(prop.default)) {
                hasReqOpts = true;
            }
        });
        return hasReqOpts;
    }
    static getAnalyticsPayload(opts) {
        if (!opts || !opts.config) {
            return {
                configured: false,
            };
        }
        return {
            configured: true,
            podId: opts.podChoice.id,
        };
    }
    static readPodConfigFromDisk(podConfigPath) {
        if (!fs_extra_1.default.existsSync(podConfigPath)) {
            return {
                error: common_all_1.ErrorFactory.create404Error({ url: podConfigPath }),
            };
        }
        else {
            return {
                data: (0, common_server_1.readYAML)(podConfigPath),
            };
        }
    }
    /**
     *
     * helper method to parse doc to md
     */
    static googleDocsToMarkdown = (file, assetDir) => {
        let text = "";
        //map of all embedded images
        const imagesMap = new Map();
        /**
         * inline and positioned objects contains image properties.
         */
        const inlineObjects = file.inlineObjects;
        const positionedObjects = file.positionedObjects;
        if (inlineObjects) {
            const keys = Object.keys(inlineObjects);
            keys.forEach((key) => {
                const contentUri = inlineObjects[key].inlineObjectProperties?.embeddedObject
                    ?.imageProperties?.contentUri;
                const id = inlineObjects[key].objectId;
                if (contentUri && id && id !== null) {
                    imagesMap.set(id, contentUri);
                }
            });
        }
        if (positionedObjects) {
            const keys = Object.keys(positionedObjects);
            keys.forEach((key) => {
                const contentUri = positionedObjects[key].positionedObjectProperties?.embeddedObject
                    ?.imageProperties?.contentUri;
                const id = positionedObjects[key].objectId;
                if (contentUri && id && id !== null) {
                    imagesMap.set(id, contentUri);
                }
            });
        }
        //iterates over each element of document
        file.body?.content?.forEach((item) => {
            /**
             * Tables
             */
            if (item.table?.tableRows) {
                const cells = item.table.tableRows[0]?.tableCells;
                // Make a blank header
                text += `|${cells?.map(() => "").join("|")}|\n|${cells
                    ?.map(() => "-")
                    .join("|")}|\n`;
                item.table.tableRows.forEach(({ tableCells }) => {
                    const textRows = [];
                    tableCells?.forEach(({ content }) => {
                        content?.forEach(({ paragraph }) => {
                            const styleType = paragraph?.paragraphStyle?.namedStyleType || undefined;
                            textRows.push(paragraph?.elements?.map((element) => PodUtils.styleElement(element, styleType)
                                ?.replace(/\s+/g, "")
                                .trim()));
                        });
                    });
                    text += `| ${textRows.join(" | ")} |\n`;
                });
            }
            /**
             * Paragraphs, lists, horizontal line, images(inline and positioned) and user mentions
             */
            if (item.paragraph && item.paragraph.elements) {
                const styleType = item?.paragraph?.paragraphStyle?.namedStyleType || undefined;
                //for bullet
                const bullet = item.paragraph?.bullet;
                if (bullet?.listId) {
                    const listDetails = file.lists?.[bullet.listId];
                    const glyphFormat = listDetails?.listProperties?.nestingLevels?.[0].glyphFormat || "";
                    const padding = "  ".repeat(bullet.nestingLevel || 0);
                    if (["[%0]", "%0."].includes(glyphFormat)) {
                        text += `${padding}1. `;
                    }
                    else {
                        text += `${padding}- `;
                    }
                }
                //for positioned images
                if (item.paragraph.positionedObjectIds) {
                    item.paragraph.positionedObjectIds.forEach((id) => {
                        const imageUrl = imagesMap.get(id);
                        text = PodUtils.downloadImage(imageUrl, assetDir, text);
                    });
                }
                item.paragraph.elements.forEach((element) => {
                    //for paragraph text
                    if (element.textRun &&
                        PodUtils.content(element) &&
                        PodUtils.content(element) !== "\n") {
                        text += PodUtils.styleElement(element, styleType);
                    }
                    //for user mentions
                    if (element.person) {
                        const slugger = (0, common_all_1.getSlugger)();
                        let person = element.person.personProperties.name;
                        if (person.indexOf("@") > -1) {
                            person = person.split("@")[0];
                        }
                        const name = slugger.slug(person);
                        text += `@${name}`;
                    }
                    //for horizontal lines
                    if (element.horizontalRule) {
                        text += "* * *\n";
                    }
                    // for inline images
                    if (element.inlineObjectElement) {
                        const imageUrl = imagesMap.get(element.inlineObjectElement.inlineObjectId);
                        text = PodUtils.downloadImage(imageUrl, assetDir, text);
                    }
                });
                // eslint-disable-next-line no-nested-ternary
                text += bullet?.listId
                    ? (text.split("\n").pop() || "").trim().endsWith("\n")
                        ? ""
                        : "\n"
                    : "\n";
            }
        });
        const lines = text.split("\n");
        const linesToDelete = [];
        lines.forEach((line, index) => {
            if (index > 2) {
                if (!line.trim() &&
                    ((lines[index - 1] || "").trim().startsWith("1. ") ||
                        (lines[index - 1] || "").trim().startsWith("- ")) &&
                    ((lines[index + 1] || "").trim().startsWith("1. ") ||
                        (lines[index + 1] || "").trim().startsWith("- ")))
                    linesToDelete.push(index);
            }
        });
        text = text
            .split("\n")
            .filter((_, i) => !linesToDelete.includes(i))
            .join("\n");
        return text.replace(/\n\s*\n\s*\n/g, "\n\n") + "\n";
    };
    /**
     * styles the element: heading, bold and italics
     */
    static styleElement = (element, styleType) => {
        if (styleType === "TITLE") {
            return `# ${PodUtils.content(element)}`;
        }
        else if (styleType === "SUBTITLE") {
            return `_${(PodUtils.content(element) || "").trim()}_`;
        }
        else if (styleType === "HEADING_1") {
            return `## ${PodUtils.content(element)}`;
        }
        else if (styleType === "HEADING_2") {
            return `### ${PodUtils.content(element)}`;
        }
        else if (styleType === "HEADING_3") {
            return `#### ${PodUtils.content(element)}`;
        }
        else if (styleType === "HEADING_4") {
            return `##### ${PodUtils.content(element)}`;
        }
        else if (styleType === "HEADING_5") {
            return `###### ${PodUtils.content(element)}`;
        }
        else if (styleType === "HEADING_6") {
            return `####### ${PodUtils.content(element)}`;
        }
        else if (element.textRun?.textStyle?.bold &&
            element.textRun?.textStyle?.italic) {
            return `**_${PodUtils.content(element)?.trim()}_**`;
        }
        else if (element.textRun?.textStyle?.italic) {
            return `_${PodUtils.content(element)?.trim()}_`;
        }
        else if (element.textRun?.textStyle?.bold) {
            return `**${PodUtils.content(element)?.trim()}**`;
        }
        return PodUtils.content(element);
    };
    static content = (element) => {
        const textRun = element?.textRun;
        const text = textRun?.content;
        if (textRun?.textStyle?.link?.url)
            return `[${text}](${textRun.textStyle.link.url})`;
        return text || undefined;
    };
    /**
     * downloads the image from cdn url and stores them in the assets directory inside vault
     */
    static downloadImage = (imageUrl, assetDir, text) => {
        fs_extra_1.default.ensureDirSync(assetDir);
        if (imageUrl) {
            const uuid = (0, common_all_1.genUUIDInsecure)();
            const dest = path_1.default.join(assetDir, `image-${uuid}.png`);
            const options = {
                url: imageUrl,
                dest,
            };
            try {
                text += `![image](assets/image-${uuid}.png)\n`;
                image_downloader_1.default.image(options);
            }
            catch (err) {
                throw new common_all_1.DendronError({
                    message: (0, common_all_1.stringifyError)(err),
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                });
            }
        }
        return text;
    };
    static async refreshGoogleAccessToken(refreshToken, port, connectionId) {
        try {
            const result = await axios_1.default.get(`http://localhost:${port}/api/oauth/refreshToken`, {
                params: {
                    refreshToken,
                    service: "google",
                    connectionId,
                },
            });
            return result.data;
        }
        catch (err) {
            throw new common_all_1.DendronError({ message: (0, common_all_1.stringifyError)(err) });
        }
    }
    /**
     * @param opts
     * @returns custom config file path for pods v2
     */
    static getCustomConfigPath = (opts) => {
        const { wsRoot, podId } = opts;
        const podsDir = PodUtils.getPodDir({ wsRoot });
        return path_1.default.join(podsDir, "custom", `config.${podId}.yml`);
    };
    /**
     * @param opts
     * @returns service config file path for pods v2
     */
    static getServiceConfigPath = (opts) => {
        const { wsRoot, connectionId } = opts;
        const podsDir = PodUtils.getPodDir({ wsRoot });
        return path_1.default.join(podsDir, "service-connections", `svcconfig.${connectionId}.yml`);
    };
}
exports.PodUtils = PodUtils;
//# sourceMappingURL=utils.js.map