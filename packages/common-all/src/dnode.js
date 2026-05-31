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
exports.SchemaUtils = exports.NoteUtils = exports.DNodeUtils = void 0;
/* eslint-disable no-throw-literal */
// @ts-ignore
const gray_matter_1 = __importDefault(require("gray-matter"));
const lodash_1 = __importDefault(require("lodash"));
const minimatch_1 = __importDefault(require("minimatch"));
const path_1 = __importDefault(require("path"));
const title_1 = __importDefault(require("title"));
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("./constants");
const error_1 = require("./error");
const noteDictsUtils_1 = require("./noteDictsUtils");
const time_1 = require("./time");
const types_1 = require("./types");
const utils_1 = require("./utils");
const uuid_1 = require("./uuid");
const vault_1 = require("./vault");
const js_yaml_1 = __importStar(require("js-yaml"));
/**
 * Utilities for dealing with nodes
 */
class DNodeUtils {
    static addChild(parent, child) {
        parent.children = Array.from(new Set(parent.children).add(child.id));
        child.parent = parent.id;
    }
    static removeChild(parent, child) {
        parent.children = lodash_1.default.reject(parent.children, (ent) => ent === child.id);
    }
    static create(opts) {
        const cleanProps = lodash_1.default.defaults(opts, {
            updated: time_1.Time.now().toMillis(),
            created: time_1.Time.now().toMillis(),
            id: (0, uuid_1.genUUID)(),
            desc: "",
            links: [],
            anchors: {},
            children: [],
            parent: null,
            body: "",
            data: {},
            title: opts.title || NoteUtils.genTitle(opts.fname),
        });
        // TODO: remove
        // don't include optional props
        const optionalProps = [
            "stub",
            "schema",
            "schemaStub",
            "custom",
            "color",
            "tags",
            "image",
        ];
        lodash_1.default.forEach(optionalProps, (op) => {
            if (opts[op]) {
                // @ts-ignore;
                cleanProps[op] = opts[op];
            }
        });
        return cleanProps;
    }
    static basename(nodePath, rmExtension) {
        //skip for nodePath that has a sub-hierarchy starting with .md eg: learn.mdone.test, learn.md-one.new
        if (rmExtension && nodePath.endsWith(".md")) {
            nodePath = nodePath.slice(0, -3);
        }
        const [first, ...rest] = nodePath.split(".");
        const last = rest.slice(-1)[0];
        return (lodash_1.default.isEmpty(rest) ? first : last) ?? nodePath;
    }
    static dirName(nodePath) {
        return nodePath.split(".").slice(0, -1).join(".");
    }
    static domainName(nodePath) {
        return nodePath.split(".")[0];
    }
    static fname(nodePath) {
        return path_1.default.basename(nodePath, ".md");
    }
    static enhancePropForQuickInput({ props, schema, vaults, wsRoot, }) {
        const vault = vault_1.VaultUtils.matchVault({ vaults, wsRoot, vault: props.vault });
        if (!vault) {
            throw Error("enhancePropForQuickInput, no vault found");
        }
        const vname = vault_1.VaultUtils.getName(vault);
        // to ensure there is a space between the note title and vault name
        const vaultSuffix = ` (${vname})`;
        if (props.type === "note") {
            const isRoot = DNodeUtils.isRoot(props);
            const label = isRoot ? "root" : props.fname;
            const detail = props.desc;
            const description = NoteUtils.genSchemaDesc(props, schema) + vaultSuffix;
            const out = { ...props, label, detail, description };
            return out;
        }
        else {
            const label = DNodeUtils.isRoot(props) ? "root" : props.id;
            const detail = props.desc;
            const out = { ...props, label, detail, description: vaultSuffix };
            return out;
        }
    }
    static enhancePropForQuickInputV3(opts) {
        const { alwaysShow } = lodash_1.default.defaults(opts, { alwaysShow: false });
        return { ...this.enhancePropForQuickInput(opts), alwaysShow };
    }
    /**
     * This version skips unnecessary parameters such as wsRoot and vaults to
     * simplify the ILookupProvider interface
     * @param opts
     * @returns
     */
    static enhancePropForQuickInputV4(opts) {
        const { props, schema } = opts;
        const vname = vault_1.VaultUtils.getName(opts.props.vault);
        const vaultSuffix = `(${vname})`;
        if (opts.props.type === "note") {
            const isRoot = DNodeUtils.isRoot(props);
            const label = isRoot ? "root" : props.fname;
            const detail = props.desc;
            const description = NoteUtils.genSchemaDesc(props, schema) + vaultSuffix;
            const out = { ...props, label, detail, description };
            return out;
        }
        else {
            const label = DNodeUtils.isRoot(props) ? "root" : props.id;
            const detail = props.desc;
            const out = { ...props, label, detail, description: vaultSuffix };
            return out;
        }
    }
    static findClosestParent(fpath, noteDicts, opts) {
        const { vault } = opts;
        const dirname = DNodeUtils.dirName(fpath);
        if (dirname === "") {
            const _node = noteDictsUtils_1.NoteDictsUtils.findByFname({
                fname: "root",
                noteDicts,
                vault,
            })[0];
            if (lodash_1.default.isUndefined(_node)) {
                throw new error_1.DendronError({ message: `no root found for ${fpath}` });
            }
            return _node;
        }
        const maybeNode = noteDictsUtils_1.NoteDictsUtils.findByFname({
            fname: dirname,
            noteDicts,
            vault,
        })[0];
        if ((maybeNode && !opts?.noStubs) ||
            (maybeNode && opts?.noStubs && !maybeNode.stub && !maybeNode.schemaStub)) {
            return maybeNode;
        }
        else {
            return DNodeUtils.findClosestParent(dirname, noteDicts, opts);
        }
    }
    static async findClosestParentWithEngine(fpath, engine, opts) {
        const { vault, excludeStub } = opts;
        const dirname = DNodeUtils.dirName(fpath);
        if (dirname === "") {
            const notes = await engine.findNotesMeta({ fname: "root", vault });
            if (notes.length === 0) {
                throw new error_1.DendronError({ message: `no root found for ${fpath}` });
            }
            return notes[0];
        }
        const maybeNotes = await engine.findNotesMeta({
            fname: dirname,
            vault: vault,
            excludeStub: excludeStub,
        });
        if (maybeNotes.length > 0) {
            return maybeNotes[0];
        }
        else {
            return DNodeUtils.findClosestParentWithEngine(dirname, engine, opts);
        }
    }
    /**
     * Custom props are anything that is not a reserved key in Dendron
     * @param props
     * @returns
     */
    static getCustomProps(props) {
        const blacklist = [
            ...Object.values(types_1.DNodeExplicitPropsEnum),
            ...Object.values(types_1.DNodeImplicitPropsEnum),
        ];
        return lodash_1.default.omit(props, blacklist);
    }
    static getDepth(node) {
        return this.getFNameDepth(node.fname);
    }
    static getFNameDepth(fname) {
        if (fname === "root") {
            return 0;
        }
        return fname.split(".").length;
    }
    static getFullPath(opts) {
        const root = path_1.default.isAbsolute(opts.vault.fsPath)
            ? vault_1.VaultUtils.getRelPath(opts.vault)
            : path_1.default.join(opts.wsRoot, vault_1.VaultUtils.getRelPath(opts.vault));
        return path_1.default.join(root, opts.basename);
    }
    static isRoot(note) {
        return note.fname === "root";
    }
    /**
     * Given a note, return the leaf name
     * @param note DNodeProps
     * @returns name of leaf node
     */
    static getLeafName(note) {
        return lodash_1.default.split(note.fname, ".").pop();
    }
}
exports.DNodeUtils = DNodeUtils;
class NoteUtils {
    /** Regular expression FrontMatter */
    static RE_FM = /^---(.*)^---/ms;
    /** Regular expression FrontMatter updated. */
    static RE_FM_UPDATED = /^updated:\s+(\d+)$/m;
    /** Regular expression FrontMatter created. */
    static RE_FM_CREATED = /^created:.*$/m;
    /** Regular expression FrontMatter updated or created.  */
    static RE_FM_UPDATED_OR_CREATED = /^(?<beforeTimestamp>(updated|created): *)(?<timestamp>[0-9]+)$/;
    static getNoteTraits(note) {
        return lodash_1.default.get(note, "traitIds", []);
    }
    /**
     * Add node to parents up the note tree, or create stubs if no direct parents exists
     *
     * @param opts
     * @returns All parent notes that were changed
     */
    static addOrUpdateParents(opts) {
        const { note, noteDicts, createStubs } = opts;
        const changed = [];
        // Ignore if root note
        if (DNodeUtils.isRoot(note)) {
            return changed;
        }
        const parentPath = DNodeUtils.dirName(note.fname).toLowerCase();
        const parent = noteDictsUtils_1.NoteDictsUtils.findByFname({
            fname: parentPath,
            noteDicts,
            vault: note.vault,
        })[0];
        if (parent) {
            const prevParentState = { ...parent };
            DNodeUtils.addChild(parent, note);
            changed.push({
                status: "update",
                prevNote: prevParentState,
                note: parent,
            });
        }
        if (!parent && !createStubs) {
            const err = {
                status: constants_1.ERROR_STATUS.NO_PARENT_FOR_NOTE,
                msg: JSON.stringify({
                    fname: note.fname,
                }),
            };
            throw error_1.DendronError.createFromStatus(err);
        }
        if (!parent) {
            const ancestor = DNodeUtils.findClosestParent(note.fname, noteDicts, {
                vault: note.vault,
            });
            const prevAncestorState = { ...ancestor };
            const stubNodes = NoteUtils.createStubs(ancestor, note);
            stubNodes.forEach((stub) => {
                changed.push({
                    status: "create",
                    note: stub,
                });
            });
            changed.push({
                status: "update",
                prevNote: prevAncestorState,
                note: ancestor,
            });
        }
        return changed;
    }
    static addSchema(opts) {
        const { note, schema, schemaModule } = opts;
        note.schema = { schemaId: schema.id, moduleId: schemaModule.root.id };
    }
    static create(opts) {
        const cleanOpts = lodash_1.default.defaults(opts, {
            schemaStub: false,
        });
        return DNodeUtils.create({ ...cleanOpts, type: "note" });
    }
    static async createWithSchema({ noteOpts, engine, }) {
        const note = NoteUtils.create(noteOpts);
        const maybeMatch = await SchemaUtils.matchPath({
            notePath: noteOpts.fname,
            engine,
        });
        if (maybeMatch) {
            const { schema, schemaModule } = maybeMatch;
            NoteUtils.addSchema({ note, schemaModule, schema });
        }
        return note;
    }
    /**
     * Given a stub note, update it so that it has a schema applied to it
     * This is done before the stub note is accepted as a new item
     * and saved to the store
     */
    static async updateStubWithSchema(opts) {
        const { stubNote, engine } = opts;
        const cleanStubNote = lodash_1.default.omit(stubNote, "stub");
        const schemaMatch = await SchemaUtils.matchPath({
            notePath: cleanStubNote.fname,
            engine,
        });
        if (schemaMatch) {
            const { schema, schemaModule } = schemaMatch;
            NoteUtils.addSchema({ note: cleanStubNote, schemaModule, schema });
        }
        return cleanStubNote;
    }
    static createRoot(opts) {
        return DNodeUtils.create({
            ...opts,
            type: "note",
            fname: "root",
            id: (0, uuid_1.genUUID)(),
        });
    }
    /**
     * Create stubs and add notes to parent
     * @param from
     * @param to
     */
    static createStubs(from, to) {
        const stubNodes = [];
        let fromPath = from.fname;
        if (DNodeUtils.isRoot(from)) {
            fromPath = "";
        }
        const toPath = to.fname;
        const index = toPath.indexOf(fromPath) + fromPath.length;
        const diffPath = lodash_1.default.trimStart(toPath.slice(index), ".").split(".");
        let stubPath = fromPath;
        let parent = from;
        // last element is node
        diffPath.slice(0, -1).forEach((part) => {
            // handle starting from root, path = ""
            if (lodash_1.default.isEmpty(stubPath)) {
                stubPath = part;
            }
            else {
                stubPath += `.${part}`;
            }
            const n = NoteUtils.create({
                fname: stubPath,
                stub: true,
                vault: to.vault,
            });
            stubNodes.push(n);
            DNodeUtils.addChild(parent, n);
            parent = n;
        });
        DNodeUtils.addChild(parent, to);
        return stubNodes;
    }
    /**
     * Create a wiki link to the given note
     *
     * @returns
     */
    static createWikiLink(opts) {
        const { note, anchor, useVaultPrefix, alias } = opts;
        const aliasMode = alias?.mode;
        const aliasValue = alias?.value;
        const tabStopIndex = alias?.tabStopIndex;
        const { fname, vault } = note;
        let title = note.title;
        if (note.fname.startsWith(constants_1.TAGS_HIERARCHY)) {
            const tag = note.fname.split(constants_1.TAGS_HIERARCHY)[1];
            return `#${tag}`;
        }
        let suffix = "";
        if (anchor) {
            const { value: id, type } = anchor;
            let idStr;
            if (type === "header") {
                title = id;
                idStr = (0, utils_1.getSlugger)().slug(id);
            }
            else {
                idStr = id;
            }
            suffix = `#${idStr}`;
        }
        const vaultPrefix = useVaultPrefix
            ? `${constants_1.CONSTANTS.DENDRON_DELIMETER}${vault_1.VaultUtils.getName(vault)}/`
            : "";
        let aliasPrefix = "";
        switch (aliasMode) {
            case "snippet": {
                aliasPrefix = `\${${tabStopIndex}:alias}|`;
                break;
            }
            case "title": {
                aliasPrefix = `${title}|`;
                break;
            }
            case "value": {
                aliasPrefix = aliasValue !== "" ? `${aliasValue}|` : "";
                break;
            }
            default:
                break;
        }
        const link = `[[${aliasPrefix}${vaultPrefix}${fname}${suffix}]]`;
        return link;
    }
    static fromSchema({ fname, schemaModule, schemaId, vault, }) {
        const mschema = schemaModule.schemas[schemaId];
        return NoteUtils.create({
            fname,
            schemaStub: true,
            desc: mschema.desc,
            schema: {
                moduleId: schemaModule.root.id,
                schemaId,
            },
            vault,
        });
    }
    static genSchemaDesc(note, schemaMod) {
        const prefixParts = [];
        if (note.title !== note.fname) {
            prefixParts.push(note.title);
        }
        if (note.stub || note.schemaStub) {
            prefixParts.push("$(gist-new)");
        }
        if (note.schema) {
            if (!schemaMod) {
                throw Error("schema mod required");
            }
            const domain = schemaMod.root;
            const schema = schemaMod.schemas[note.schema.schemaId];
            // case: recognized schema
            prefixParts.push(`$(repo) ${domain.title || domain.id}`);
            // check if non-domain schema
            if (domain.id !== note.schema.schemaId) {
                prefixParts.push("$(breadcrumb-separator)");
                if (schema.data.isIdAutoGenerated) {
                    if (schema.title !== schema.id) {
                        // Id was omitted but a manual title was provided in the schema so
                        // hence we prefer the title over a pattern.
                        prefixParts.push(schema.title);
                    }
                    else {
                        // We know id is a jumble of random characters now, and title of schema
                        // must have defaulted to id, hence our best bet is to use a pattern which
                        // must always be set if the id is generated.
                        prefixParts.push(schema.data.pattern);
                    }
                }
                else {
                    prefixParts.push(schema.title || schema.id);
                }
            }
        }
        return prefixParts.join(" ");
    }
    static genJournalNoteTitle(opts) {
        const { fname, journalName } = opts;
        const journalIndex = fname.indexOf(journalName);
        const normTitle = NoteUtils.genTitle(fname);
        if (journalIndex < 0) {
            return normTitle;
        }
        const maybeDatePortion = fname.slice(journalIndex + journalName.length + 1);
        if (maybeDatePortion.match(/\d\d\d\d\.\d\d\.\d\d$/)) {
            return maybeDatePortion.replace(/\./g, "-");
        }
        return normTitle;
    }
    static updateNoteLocalConfig(note, key, config) {
        if (!note.config) {
            note.config = {};
        }
        if (!note.config[key]) {
            note.config[key] = config;
        }
        else {
            lodash_1.default.merge(note.config[key], config);
        }
        return note;
    }
    static genTitle(fname) {
        const titleFromBasename = DNodeUtils.basename(fname, true);
        // check if title is unchanged from default. if so, add default title
        if (lodash_1.default.toLower(fname) === fname) {
            fname = titleFromBasename.replace(/-/g, " ");
            return (0, title_1.default)(fname);
        }
        // if user customized title, return the title as user specified
        return titleFromBasename;
    }
    static genTitleFromFullFname(fname) {
        const formatted = fname.replace(/\./g, " ");
        return (0, title_1.default)(formatted);
    }
    static getNotesWithLinkTo({ note, notes, }) {
        const maybe = notes.map((ent) => {
            if (lodash_1.default.find(ent.links, (l) => {
                return l.to?.fname?.toLowerCase() === note.fname.toLowerCase();
            })) {
                return ent;
            }
            else {
                return;
            }
        });
        return lodash_1.default.reject(maybe, lodash_1.default.isUndefined);
    }
    static getFullPath({ note, wsRoot, }) {
        try {
            const fpath = DNodeUtils.getFullPath({
                wsRoot,
                vault: note.vault,
                basename: note.fname + ".md",
            });
            return fpath;
        }
        catch (err) {
            throw new error_1.DendronError({
                message: "bad path",
                payload: { note, wsRoot },
            });
        }
    }
    static getURI({ note, wsRoot, }) {
        return vscode_uri_1.URI.file(this.getFullPath({ note, wsRoot }));
    }
    /**
     * Get a list that has all the parents of the current note with the current note
     */
    static getNoteWithParents({ note, notes, sortDesc = true, }) {
        const out = [];
        if (!note || lodash_1.default.isUndefined(note)) {
            return [];
        }
        while (note.parent !== null) {
            out.push(note);
            try {
                const tmp = notes[note.parent];
                if (lodash_1.default.isUndefined(tmp)) {
                    throw "note is undefined";
                }
                note = tmp;
            }
            catch (err) {
                throw Error(`no parent found for note ${note.id}`);
            }
        }
        out.push(note);
        if (sortDesc) {
            lodash_1.default.reverse(out);
        }
        return out;
    }
    static getPathUpTo(hpath, numCompoenents) {
        return hpath.split(".").slice(0, numCompoenents).join(".");
    }
    static getRoots(notes) {
        return lodash_1.default.filter(lodash_1.default.values(notes), DNodeUtils.isRoot);
    }
    /**
     * Add derived metadata from `noteHydrated` to `noteRaw`
     * By default, include the following properties:
     *  - parent
     *  - children
     * @param noteRaw - note for other fields
     * @param noteHydrated - note to get metadata properties from
     * @returns Merged Note object
     */
    static hydrate({ noteRaw, noteHydrated, opts, }) {
        const hydrateProps = lodash_1.default.pick(noteHydrated, ["parent", "children"]);
        // check if we hydrate with links
        if (opts?.keepBackLinks) {
            noteRaw.links = noteHydrated.links.filter((link) => link.type === "backlink");
        }
        return { ...noteRaw, ...hydrateProps };
    }
    static match({ notePath, pattern }) {
        return (0, minimatch_1.default)(notePath, pattern);
    }
    static isDefaultTitle(props) {
        return props.title === NoteUtils.genTitle(props.fname);
    }
    /**
     * Remove `.md` extension if exists and remove spaces
     * @param nodePath
     * @returns
     */
    static normalizeFname(nodePath) {
        nodePath = lodash_1.default.trim(nodePath);
        if (nodePath.endsWith(".md")) {
            //removing .md extenion from the end.
            //Can be sliced with undefined, 0 or the negative index from the end.
            nodePath = nodePath.slice(undefined, -3);
        }
        return nodePath;
    }
    static isNoteProps(props) {
        const REQUIRED_DNODEPROPS = [
            "id",
            "title",
            "desc",
            "links",
            "anchors",
            "fname",
            "type",
            "updated",
            "created",
            "parent",
            "children",
            "data",
            "body",
            "vault",
        ];
        return (lodash_1.default.isObject(props) &&
            REQUIRED_DNODEPROPS.every((key) => key in props && (0, utils_1.isNotUndefined)(props[key])));
    }
    static serializeExplicitProps(props) {
        // Remove all undefined values, because they cause `matter` to fail serializing them
        const cleanProps = Object.fromEntries(Object.entries(props).filter(([_k, v]) => (0, utils_1.isNotUndefined)(v)));
        if (!this.isNoteProps(cleanProps))
            throw new error_1.DendronError({
                message: `Note is missing some properties that are required. Found properties: ${JSON.stringify(props)}`,
            });
        let propsWithTrait = { ...cleanProps };
        if (cleanProps.traits) {
            propsWithTrait = {
                ...cleanProps,
                traitIds: cleanProps.traits.map((value) => value),
            };
        }
        // Separate custom and builtin props
        const builtinProps = lodash_1.default.pick(propsWithTrait, [
            ...Object.values(types_1.DNodeExplicitPropsEnum),
            "stub",
        ]);
        const { custom: customProps } = cleanProps;
        const meta = { ...builtinProps, ...customProps };
        return meta;
    }
    static serialize(props, opts) {
        const body = props.body;
        const blacklist = ["parent", "children"];
        if (opts?.excludeStub) {
            blacklist.push("stub");
        }
        const meta = lodash_1.default.omit(NoteUtils.serializeExplicitProps(props), blacklist);
        // Make sure title and ID are always strings
        meta.title = lodash_1.default.toString(meta.title);
        meta.id = lodash_1.default.toString(meta.id);
        const stringified = gray_matter_1.default.stringify(body || "", meta);
        // Stringify appends \n if it doesn't exist. Remove it if body originally doesn't contain new line
        return body.slice(-1) !== "\n" ? stringified.slice(0, -1) : stringified;
    }
    static toLogObj(note) {
        const { fname, id, children, vault, parent } = note;
        return {
            fname,
            id,
            children,
            vault,
            parent,
        };
    }
    static toNoteLoc(note) {
        const { fname, id, vault } = note;
        return {
            fname,
            id,
            vaultName: vault_1.VaultUtils.getName(vault),
        };
    }
    /**
     * Human readable note location. eg: `dendron://foo (uisdfsdfsdf)`
     */
    static toNoteLocString(note) {
        const noteLoc = this.toNoteLoc(note);
        const out = [];
        if (noteLoc.vaultName) {
            out.push(`dendron://${noteLoc.vaultName}/`);
        }
        out.push(noteLoc.fname);
        if (noteLoc.id) {
            out.push(` (${noteLoc.id})`);
        }
        return out.join("");
    }
    static uri2Fname(uri) {
        return path_1.default.basename(uri.fsPath, ".md");
    }
    /**
     * Check if input is a valid note
     * @param maybeNoteProps
     * @returns
     */
    static validate(maybeNoteProps) {
        if (lodash_1.default.isUndefined(maybeNoteProps)) {
            return {
                error: error_1.DendronError.createFromStatus({
                    status: constants_1.ERROR_STATUS.BAD_PARSE_FOR_NOTE,
                    message: "NoteProps is undefined",
                }),
            };
        }
        if (lodash_1.default.isUndefined(maybeNoteProps.vault)) {
            return {
                error: error_1.DendronError.createFromStatus({
                    status: constants_1.ERROR_STATUS.BAD_PARSE_FOR_NOTE,
                    message: "note vault is undefined",
                }),
            };
        }
        if (!lodash_1.default.isString(maybeNoteProps.title)) {
            return {
                error: error_1.DendronError.createFromStatus({
                    status: constants_1.ERROR_STATUS.BAD_PARSE_FOR_NOTE,
                    message: "note title not set as string",
                }),
            };
        }
        return { data: true };
    }
    /**
     * Given a filename, return the validity of the filename.
     * If invalid, a reason string is also returned.
     * Only the first encountered reason will be reported.
     * @param fname filename
     * @returns boolean value representing the validity of the filename, and the reason if invalid
     */
    static validateFname(fname) {
        // Each hierarchy string
        // 1. should not be empty
        // 2. should not have leading trailing whitespace
        for (const value of fname.split(".")) {
            const isEmpty = value === "";
            if (isEmpty) {
                return {
                    isValid: false,
                    reason: constants_1.InvalidFilenameReason.EMPTY_HIERARCHY,
                };
            }
            const hasLeadingOrTrailingWhitespace = value.startsWith(" ") || value.endsWith(" ");
            if (hasLeadingOrTrailingWhitespace) {
                return {
                    isValid: false,
                    reason: constants_1.InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
                };
            }
        }
        // should not contain characters that SQLite doesn't allow
        const matcher = /[(),']/;
        const isSQLiteLegal = lodash_1.default.isNull(fname.match(matcher));
        if (!isSQLiteLegal) {
            return {
                isValid: false,
                reason: constants_1.InvalidFilenameReason.ILLEGAL_CHARACTER,
            };
        }
        return { isValid: true };
    }
    /**
     * Given a file name, clean it so that it is valid
     * as per {@link NoteUtils.validateFname}
     * Optionally pass in the replace string that is used to replace
     * the illegal characters
     */
    static cleanFname(opts) {
        const { fname, replaceWith } = opts;
        // replace illegal strings before cleaning up hierarchy strings
        const fnameAfterReplace = fname.replace(/[(),'']/g, replaceWith === undefined ? " " : replaceWith);
        const hierarchies = fnameAfterReplace.split(".");
        const cleanedFname = hierarchies
            // trim leading / trailing whitespace
            .map((value) => {
            return lodash_1.default.trim(value, " ");
        })
            // cut out empty hierarchies
            .filter((value) => value !== "")
            .join(".");
        return cleanedFname;
    }
    /** Generate a random color for `note`, but allow the user to override that color selection.
     *
     * @param fname The fname of note that you want to get the color of.
     * @returns The color, and whether this color was randomly generated or explicitly defined.
     */
    static color(opts) {
        const { fname, note } = opts;
        // TODO: Re-enable the ancestor color logic later
        // const ancestors = NoteUtils.ancestors({ ...opts, includeSelf: true });
        // for (const note of ancestors) {
        //   if (note.color) return { color: note.color, type: "configured" };
        // }
        if (note && note.color) {
            return { color: note.color, type: "configured" };
        }
        return { color: (0, utils_1.randomColor)(fname), type: "generated" };
    }
    /** Get the ancestors of a note, in the order of the closest to farthest.
     *
     * This function will continue searching for ancestors even if a note with `fname`
     * doesn't exist, provided that it has ancestors.
     * For example, if fname is `foo.bar.baz` but only `foo` exists, this function
     * will find `foo`.
     *
     * ```ts
     * const ancestorNotes = NoteUtils.ancestors({ fname });
     * for (const ancestor of ancestorNotes) { }
     * // or
     * const allAncestors = [...ancestorNotes];
     * ```
     *
     * @param opts.fname The fname of the note you are trying to get the ancestors of.
     * @param opts.vault The vault to look for. If provided, only notes from this vault will be included.
     * @param opts.engine The engine.
     * @param opts.includeSelf: If true, note with `fname` itself will be included in the ancestors.
     * @param opts.nonStubOnly: If true, only notes that are not stubs will be included.
     */
    static async ancestors(opts) {
        const { fname, engine, includeSelf, nonStubOnly } = opts;
        let { vault } = opts;
        let parts = fname.split(".");
        let note = (await engine.findNotesMeta({
            fname,
            vault: vault,
        }))[0];
        // Check if we need this note itself
        if (note && includeSelf && !(nonStubOnly && note.stub))
            return note;
        if (fname === "root")
            return;
        // All ancestors within the same hierarchy
        while (parts.length > 1) {
            parts = parts.slice(undefined, parts.length - 1);
            // eslint-disable-next-line no-await-in-loop
            note = (await engine.findNotesMeta({ fname: parts.join("."), vault: vault }))[0];
            if (note && !(nonStubOnly && note.stub))
                return note;
        }
        // The ultimate ancestor of all notes is root
        if (note) {
            // Yielded at least one note
            if (!vault)
                vault = note.vault;
            note = (await engine.findNotesMeta({ fname: "root", vault: vault }))[0];
            return note;
        }
        return;
    }
    static isNote(uri) {
        return uri.fsPath.endsWith(".md");
    }
    static FILE_ID_PREFIX = "file-";
    /** This should be only used for files not in Dendron workspace, for example a markdown file that's not in any vault. */
    static genIdForFile({ filePath, wsRoot, }) {
        // Regardless of platform, use POSIX style
        const normalizedPath = (0, utils_1.normalizeUnixPath)(path_1.default.relative(wsRoot, filePath));
        return `${this.FILE_ID_PREFIX}${normalizedPath}`;
    }
    /** Returns true if this is a note id generated by {@link NoteUtils.genIdForFile} */
    static isFileId(id) {
        return id.startsWith(this.FILE_ID_PREFIX);
    }
    /** This should be only used for files not in Dendron workspace, for example a markdown file that's not in any vault. */
    static createForFile(opts) {
        const id = this.genIdForFile(opts);
        return this.create({
            fname: path_1.default.basename(opts.filePath),
            id,
            vault: vault_1.VaultUtils.createForFile(opts),
            body: opts.contents,
        });
    }
    static FAKE_ID_PREFIX = "fake-";
    /** Create a fake note object for something that is not actually a note in the workspace.
     *
     * For example when we need to render a piece of an actual note. If you need
     * to create a fake note for an actual file, prefer
     * {@link NoteUtils.createForFile} instead.
     */
    static createForFake(opts) {
        return this.create({
            fname: opts.fname,
            id: `${this.FAKE_ID_PREFIX}${opts.id}`,
            vault: opts.vault,
            body: opts.contents,
        });
    }
}
exports.NoteUtils = NoteUtils;
class SchemaUtils {
    static createFromSchemaRaw(opts) {
        const schemaDataOpts = [
            "namespace",
            "pattern",
            "template",
        ];
        const optsWithoutData = lodash_1.default.omit(opts, schemaDataOpts);
        const optsData = lodash_1.default.pick(opts, schemaDataOpts);
        this.processUntypedTemplate(optsData);
        const node = DNodeUtils.create({
            ...lodash_1.default.defaults(optsWithoutData, {
                title: optsWithoutData.id,
                data: optsData,
                fname: "__empty",
            }),
            type: "schema",
        });
        if (opts.isIdAutoGenerated) {
            node.data.isIdAutoGenerated = true;
        }
        return node;
    }
    static createFromSchemaOpts(opts) {
        const schemaDataOpts = [
            "namespace",
            "pattern",
            "template",
        ];
        const optsWithoutData = lodash_1.default.omit(opts, schemaDataOpts);
        const optsData = lodash_1.default.pick(opts, schemaDataOpts);
        this.processUntypedTemplate(optsData);
        const vault = opts.vault;
        const node = DNodeUtils.create({
            vault,
            ...lodash_1.default.defaults(optsWithoutData, {
                title: optsWithoutData.id,
                data: optsData,
                fname: "__empty",
            }),
            type: "schema",
        });
        if (opts.data?.isIdAutoGenerated) {
            node.data.isIdAutoGenerated = true;
        }
        return node;
    }
    static processUntypedTemplate(optsData) {
        // Standard templates have the format of
        //  `template: {id:'', type:''}`
        //
        // However we also want to support shorthand for declaring templates when just
        // the id of the template is specified with the format of
        //  `template: ''`
        if (lodash_1.default.isString(optsData.template)) {
            const typedTemplate = {
                id: optsData.template,
                type: "note",
            };
            optsData.template = typedTemplate;
        }
    }
    static createModule(opts) {
        return opts;
    }
    static createModuleProps(opts) {
        const { fname, vault } = opts;
        const root = SchemaUtils.createFromSchemaOpts({
            id: `${fname}`,
            fname,
            parent: "root",
            created: 1,
            updated: 1,
            children: [],
            vault,
        });
        return {
            version: 1,
            fname,
            root,
            schemas: { [root.id]: root },
            imports: [],
            vault,
        };
    }
    static createRootModule(opts) {
        const schema = SchemaUtils.createFromSchemaOpts({
            id: "root",
            title: "root",
            fname: "root.schema",
            parent: "root",
            children: [],
            ...opts,
        });
        return {
            version: 1,
            imports: [],
            schemas: [schema],
        };
    }
    static createRootModuleProps(fname, vault, opts) {
        const schema = SchemaUtils.createFromSchemaOpts({
            id: "root",
            title: "root",
            fname: "root",
            parent: "root",
            children: [],
            vault,
            ...opts,
        });
        return {
            version: 1,
            imports: [],
            schemas: { root: schema },
            fname,
            root: schema,
            vault,
        };
    }
    static enhanceForQuickInput({ props, vaults, }) {
        const vaultSuffix = vaults.length > 1
            ? ` (${path_1.default.basename(props.vault?.fsPath)})`
            : "";
        const label = DNodeUtils.isRoot(props.root) ? "root" : props.root.id;
        const detail = props.root.desc;
        const out = {
            ...props.root,
            fname: props.fname,
            label,
            detail,
            description: vaultSuffix,
            vault: props.vault,
        };
        return out;
    }
    static getModuleRoot(module) {
        const maybeRoot = lodash_1.default.find(module.schemas, { parent: "root" });
        if (!maybeRoot) {
            const rootSchemaRoot = lodash_1.default.find(module.schemas, {
                parent: null,
                id: "root",
            });
            if (!rootSchemaRoot) {
                throw error_1.DendronError.createFromStatus({
                    status: constants_1.ERROR_STATUS.NO_ROOT_SCHEMA_FOUND,
                });
            }
            else {
                return rootSchemaRoot;
            }
        }
        return maybeRoot;
    }
    /**
     * If no pattern field, get the id.
     * If pattern field, check if namespace and translate into glob pattern
     * @param schema
     * @param opts
     * @returns
     */
    static getPattern = (schema, opts) => {
        const pattern = schema?.data?.pattern || schema.id;
        const part = schema?.data?.namespace && !opts?.isNotNamespace
            ? `${pattern}/*`
            : pattern;
        return part;
    };
    /**
     * Get full pattern starting from the root
     * @param schema
     * @param schemas
     * @returns
     */
    static getPatternRecursive = (schema, schemas) => {
        const part = SchemaUtils.getPattern(schema);
        if (lodash_1.default.isNull(schema.parent)) {
            return part;
        }
        const parent = schemas[schema.parent];
        if (parent && parent.id !== "root") {
            const prefix = SchemaUtils.getPatternRecursive(parent, schemas);
            return [prefix, part].join("/");
        }
        else {
            return part;
        }
    };
    /**
     * @param param0
     * @returns
     */
    static getPath({ root, fname }) {
        return path_1.default.join(root, fname + ".schema.yml");
    }
    static async doesSchemaExist({ id, engine, }) {
        const resp = await engine.getSchema(id);
        return !lodash_1.default.isUndefined(resp.data);
    }
    static async getSchemaFromNote({ note, engine, }) {
        if (note.schema) {
            return (await engine.getSchema(note.schema.moduleId)).data;
        }
        return;
    }
    static hasSimplePattern = (schema, opts) => {
        const pattern = SchemaUtils.getPattern(schema, opts);
        return !lodash_1.default.isNull(pattern.match(/^[a-zA-Z0-9_-]*$/));
    };
    /**
     * Match and assign schemas to all nodes within a domain. Note - only use this
     * during engine init where SchemaModuleDict is available.
     *
     * @param domain
     * @param notes
     * @param schemas
     */
    static matchDomain(domain, notes, schemas) {
        const match = schemas[domain.fname];
        if (!match) {
            return;
        }
        else {
            const domainSchema = match.schemas[match.root.id];
            return SchemaUtils.matchDomainWithSchema({
                noteCandidates: [domain],
                notes,
                schemaCandidates: [domainSchema],
                schemaModule: match,
            });
        }
    }
    static matchDomainWithSchema(opts) {
        const { noteCandidates, schemaCandidates, notes, schemaModule, matchNamespace, } = lodash_1.default.defaults(opts, { matchNamespace: true });
        const matches = lodash_1.default.map(noteCandidates, (note) => {
            return SchemaUtils.matchNotePathWithSchemaAtLevel({
                notePath: note.fname,
                schemas: schemaCandidates,
                schemaModule,
                matchNamespace,
            });
        }).filter((ent) => !lodash_1.default.isUndefined(ent));
        matches.map((m) => {
            const { schema, notePath } = m;
            const note = lodash_1.default.find(noteCandidates, { fname: notePath });
            NoteUtils.addSchema({ note, schema, schemaModule });
            const matchNextNamespace = !(schema.data.namespace && matchNamespace);
            const nextSchemaCandidates = matchNextNamespace
                ? schema.children.map((id) => schemaModule.schemas[id]).filter(Boolean)
                : [schema];
            const nextNoteCandidates = note.children.map((id) => notes[id]).filter(Boolean);
            return SchemaUtils.matchDomainWithSchema({
                noteCandidates: nextNoteCandidates,
                schemaCandidates: nextSchemaCandidates,
                notes,
                schemaModule,
                matchNamespace: matchNextNamespace,
            });
        });
    }
    //  ^dtaatxvjb4s3
    static async matchPath(opts) {
        const { notePath } = opts;
        const domainName = DNodeUtils.domainName(notePath);
        const resp = await opts.engine.getSchema(domainName);
        if (!resp.data) {
            return;
        }
        else {
            const domainSchema = resp.data.schemas[resp.data.root.id];
            if (domainName.length === notePath.length) {
                return {
                    schema: domainSchema,
                    notePath,
                    namespace: domainSchema.data.namespace || false,
                    schemaModule: resp.data,
                };
            }
            return SchemaUtils.matchPathWithSchema({
                notePath,
                matched: "",
                schemaCandidates: [domainSchema],
                schemaModule: resp.data,
            });
        }
    }
    /**
     * Find proper schema from schema module that can be applied to note
     */
    static findSchemaFromModule(opts) {
        const { notePath, schemaModule } = opts;
        const domainName = DNodeUtils.domainName(notePath);
        const domainSchema = schemaModule.schemas[schemaModule.root.id];
        if (domainName.length === notePath.length) {
            return {
                schema: domainSchema,
                notePath,
                namespace: domainSchema.data.namespace || false,
                schemaModule,
            };
        }
        return SchemaUtils.matchPathWithSchema({
            notePath,
            matched: "",
            schemaCandidates: [domainSchema],
            schemaModule,
        });
    }
    /**
     *
     * @param param0
     * @return
     *  - schemaModule
     *  - schema
     *  - namespace
     *  - notePath
     */
    static matchPathWithSchema({ notePath, matched, schemaCandidates, schemaModule, matchNamespace = true, }) {
        const getChildOfPath = (notePath, matched) => {
            const nextLvlIndex = lodash_1.default.indexOf(notePath, ".", matched.length + 1);
            return nextLvlIndex > 0 ? notePath.slice(0, nextLvlIndex) : notePath;
        };
        const nextNotePath = getChildOfPath(notePath, matched);
        const match = SchemaUtils.matchNotePathWithSchemaAtLevel({
            notePath: nextNotePath,
            schemas: schemaCandidates,
            schemaModule,
            matchNamespace,
        });
        if (match) {
            const { schema, namespace } = match;
            // found a match
            if (notePath === nextNotePath) {
                return {
                    schemaModule,
                    schema,
                    namespace,
                    notePath,
                };
            }
            // if current note is a namespace and we are currently matching namespaces, don't match on the next turn
            const matchNextNamespace = !(schema.data.namespace && matchNamespace);
            // if we are not matching the next namespace, then we go back to regular matching behavior
            const nextSchemaCandidates = matchNextNamespace
                ? schema.children.map((id) => schemaModule.schemas[id]).filter(Boolean)
                : [schema];
            return SchemaUtils.matchPathWithSchema({
                notePath,
                matched: nextNotePath,
                schemaCandidates: nextSchemaCandidates,
                schemaModule,
                matchNamespace: matchNextNamespace,
            });
        }
        return;
    }
    static matchNotePathWithSchemaAtLevel({ notePath, schemas, schemaModule, matchNamespace = true, }) {
        const notePathClean = notePath.replace(/\./g, "/");
        let namespace = false;
        const match = lodash_1.default.find(schemas, (sc) => {
            const pattern = SchemaUtils.getPatternRecursive(sc, schemaModule.schemas);
            if (sc?.data?.namespace && matchNamespace) {
                namespace = true;
                // current note is at the level of the namespace node.
                // the glob pattern accounts for its immediate children (/*/*),
                // so in order to match the current note, we should slice off
                // the last bit of the glob pattern (/*)
                return (0, minimatch_1.default)(notePathClean, pattern.slice(0, -2));
            }
            else {
                // we are either trying to match the immediate child of a namespace node,
                // or match a non-namespace regular schema. use the pattern as-is
                return (0, minimatch_1.default)(notePathClean, pattern);
            }
        });
        if (match) {
            return {
                schema: match,
                namespace,
                notePath,
                schemaModule,
            };
        }
        return;
    }
    static serializeSchemaProps(props) {
        const builtinProps = lodash_1.default.pick(props, [
            "id",
            "children",
        ]);
        const optional = [
            "title",
            "desc",
        ];
        lodash_1.default.forEach(optional, (opt) => {
            if (props[opt]) {
                builtinProps[opt] = props[opt];
            }
        });
        const dataProps = props.data;
        // special for root
        if (props?.parent === "root") {
            builtinProps.parent = "root";
        }
        return { ...builtinProps, ...dataProps };
    }
    static isSchemaUri(uri) {
        return uri.fsPath.endsWith(".schema.yml");
    }
    static serializeModuleProps(moduleProps) {
        const { version, imports, schemas } = moduleProps;
        // TODO: filter out imported schemas
        const out = {
            version,
            imports: [],
            schemas: lodash_1.default.values(schemas).map((ent) => SchemaUtils.serializeSchemaProps(ent)),
        };
        if (imports) {
            out.imports = imports;
        }
        return js_yaml_1.default.dump(out, { schema: js_yaml_1.JSON_SCHEMA });
    }
}
exports.SchemaUtils = SchemaUtils;
//# sourceMappingURL=dnode.js.map