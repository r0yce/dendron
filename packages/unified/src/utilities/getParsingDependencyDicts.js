"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParsingDependencyDicts = getParsingDependencyDicts;
/* eslint-disable no-await-in-loop */
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const types_1 = require("../types");
const utilsv5_1 = require("../utilsv5");
/**
 * For a given note to process with unified, this function determines all
 * NoteProp dependencies that will be needed in order to parse/render the note.
 * It then creates a set of NoteDicts containing all dependencies and returns
 * it. Any nested/recursive dependencies, such as with note references, will
 * also be included.
 * @param noteToProcess
 * @param engine
 * @param config
 * @param vaults
 * @returns
 */
async function getParsingDependencyDicts(noteToProcess, engine, config, vaults) {
    let allData = [];
    allData.push(...(await getForwardLinkDependencies(noteToProcess, vaults, engine, config)));
    allData.push(...(await getBacklinkDependencies(noteToProcess, engine)));
    allData.push(...(await getChildrenDependencies(noteToProcess, engine)));
    allData = lodash_1.default.compact(allData);
    allData = lodash_1.default.uniqBy(allData, (value) => value.id);
    return common_all_1.NoteDictsUtils.createNoteDicts(allData);
}
async function getChildrenDependencies(noteToRender, engine) {
    const results = [];
    // Also include children to render the 'children' hierarchy at the footer of the page:
    await Promise.all(noteToRender.children.map(async (childId) => {
        // TODO: Can we use a bulk get API instead (if/when it exists) to speed
        // up fetching time
        const childNote = await engine.getNote(childId);
        if (childNote.data) {
            results.push(childNote.data);
        }
    }));
    return results;
}
async function getBacklinkDependencies(noteToRender, engine) {
    const results = await Promise.all(noteToRender.links
        .filter((link) => link.type === "backlink" && link.from.id)
        .map(async (link) => {
        const linkedNote = await engine.getNote(link.from.id);
        if (linkedNote.data) {
            return linkedNote.data;
        }
        return undefined;
    }));
    return lodash_1.default.uniqBy(lodash_1.default.compact(results), (value) => value.id);
}
/**
 * For a given AST, find all note dependencies whose data will be needed for
 * rendering. Specifically, we look for:
 * - WIKI_LINK
 * - HASHTAG
 * - USERTAG
 * @param ast the syntax tree to look for dependencies
 * @returns an array of fname-vault? combinations that this tree depends on.
 */
function getNoteDependencies(ast) {
    const renderDependencies = [];
    (0, unist_util_visit_1.default)(ast, [types_1.DendronASTTypes.WIKI_LINK], (wikilink, _index) => {
        renderDependencies.push({
            fname: wikilink.value,
            vaultName: wikilink.data.vaultName,
        });
    });
    (0, unist_util_visit_1.default)(ast, [types_1.DendronASTTypes.HASHTAG], (hashtag, _index) => {
        renderDependencies.push({
            fname: hashtag.fname,
        });
    });
    (0, unist_util_visit_1.default)(ast, [types_1.DendronASTTypes.USERTAG], (noteRef, _index) => {
        renderDependencies.push({
            fname: noteRef.fname,
        });
    });
    return renderDependencies;
}
/**
 * For a given AST, find all note dependencies which will cause recursive
 * dependencies. Currently, only note references will cause this (since we need
 * to render the body of the note reference.)
 * @param ast the syntax tree to look for recursive dependencies
 * @returns an array of fname-vault? combinations that this tree depends on.
 */
async function getRecursiveNoteDependencies(ast, engine) {
    const renderDependencies = [];
    const wildCards = [];
    (0, unist_util_visit_1.default)(ast, [types_1.DendronASTTypes.REF_LINK_V2], (noteRef, _index) => {
        if (noteRef.data.link.from.fname.endsWith("*")) {
            wildCards.push({
                fname: noteRef.data.link.from.fname,
                vaultName: noteRef.data.link.data.vaultName,
            });
        }
        else {
            renderDependencies.push({
                fname: noteRef.data.link.from.fname,
                vaultName: noteRef.data.link.data.vaultName,
            });
        }
    });
    // In the case that it's a wildcard note reference, then we need to include
    // the all notes that match the wildcard pattern.
    await Promise.all(wildCards.map(async (data) => {
        const resp = await engine.queryNotes({
            qs: data.fname,
            originalQS: data.fname,
            // vault: data.vaultName
        });
        const out = lodash_1.default.filter(resp, (ent) => common_all_1.DUtils.minimatch(ent.fname, data.fname));
        out.forEach((value) => {
            renderDependencies.push({ fname: value.fname });
        });
    }));
    return renderDependencies;
}
/**
 * Get all dependencies caused by forward links. If a recursive element is
 * encountered (like a note reference), then the recursive dependencies will
 * also be included, up to a MAX_DEPTH.
 * @param noteToRender
 * @param vaults
 * @param engine
 * @param config
 * @returns
 */
async function getForwardLinkDependencies(noteToRender, vaults, engine, config) {
    const MAX_DEPTH = 3;
    let curDepth = 1;
    const allDependencies = [];
    let curDependencies = [];
    // Initialize curDependencies:
    const proc = utilsv5_1.MDUtilsV5.procRemarkFull({
        noteToRender,
        fname: noteToRender.fname,
        vault: noteToRender.vault,
        config,
        dest: common_all_1.DendronASTDest.MD_DENDRON,
    });
    const serialized = common_all_1.NoteUtils.serialize(noteToRender);
    const ast = proc.parse(serialized);
    allDependencies.push(...getNoteDependencies(ast));
    const recursiveDependencies = await getRecursiveNoteDependencies(ast, engine);
    allDependencies.push(...recursiveDependencies);
    curDependencies.push(...recursiveDependencies);
    while (curDepth < MAX_DEPTH && curDependencies.length > 0) {
        const newRecursiveDependencies = [];
        await Promise.all(curDependencies.map(async (key) => {
            const vault = key.vaultName
                ? common_all_1.VaultUtils.getVaultByName({ vaults, vname: key.vaultName })
                : noteToRender.vault;
            const notes = await engine.findNotes({ fname: key.fname, vault });
            await Promise.all(notes.map(async (note) => {
                const proc = utilsv5_1.MDUtilsV5.procRemarkFull({
                    noteToRender: note,
                    fname: note.fname,
                    vault: note.vault,
                    config,
                    dest: common_all_1.DendronASTDest.MD_DENDRON,
                });
                const serialized = common_all_1.NoteUtils.serialize(note);
                const ast = proc.parse(serialized);
                const recursiveDependencies = await getRecursiveNoteDependencies(ast, engine);
                allDependencies.push(...getNoteDependencies(ast));
                allDependencies.push(...recursiveDependencies);
                newRecursiveDependencies.push(...recursiveDependencies);
            }));
        }));
        curDependencies = newRecursiveDependencies;
        curDepth += 1;
    }
    let allData = [];
    await Promise.all(allDependencies.map(async (dependency) => {
        const vault = dependency.vaultName
            ? lodash_1.default.find(vaults, (vault) => vault.name === dependency.vaultName)
            : undefined;
        const notes = await engine.findNotes({ fname: dependency.fname, vault });
        allData.push(...notes);
    }));
    allData = lodash_1.default.compact(allData);
    allData = lodash_1.default.uniqBy(allData, (value) => value.id);
    return allData;
}
//# sourceMappingURL=getParsingDependencyDicts.js.map