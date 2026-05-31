"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../src/constants");
function genEntry(entryDict) {
    const configGenerated = {};
    lodash_1.default.forEach(entryDict, (ent) => {
        const configProps = lodash_1.default.omit(ent, ["key", "scope"]);
        const configKey = ent["key"];
        configGenerated[configKey] = configProps;
    });
    return configGenerated;
}
function updateConfig() {
    const configuration = {
        title: "dendron",
    };
    console.log("update config...");
    const config = genEntry(constants_1.CONFIG);
    configuration["properties"] = config;
    return configuration;
}
function updateMenus() {
    console.log("update menus...");
    constants_1.DENDRON_MENUS["commandPalette"] = updateCommandPalettes();
    return constants_1.DENDRON_MENUS;
}
function updateCommandPalettes() {
    console.log("updating command palettes...");
    const commandPalette = lodash_1.default.map(lodash_1.default.filter(constants_1.DENDRON_COMMANDS, (ent) => {
        return !lodash_1.default.isUndefined(ent.when);
    }), (ent) => {
        const key = ent["key"];
        const when = ent["when"];
        return {
            command: key,
            when,
        };
    });
    return commandPalette;
}
function updateCommands() {
    console.log("update commands...");
    const commands = lodash_1.default.map(lodash_1.default.filter(constants_1.DENDRON_COMMANDS), (ent) => {
        const configProps = lodash_1.default.omit(ent, ["key", "keybindings", "when"]);
        const key = ent["key"];
        return {
            command: key,
            ...configProps,
        };
    });
    return commands;
}
function updateKeybindings() {
    console.log("update keybindings...");
    const bindings = lodash_1.default.filter(constants_1.DENDRON_COMMANDS, (ent) => !lodash_1.default.isEmpty(ent.keybindings)).map((keyEnt) => {
        let configProps = keyEnt.keybindings;
        const key = keyEnt["key"];
        // sanity, if command depends on plugin being active, add same when clause to keybinding
        if (keyEnt.when === constants_1.DendronContext.PLUGIN_ACTIVE &&
            !configProps?.when?.includes(constants_1.DendronContext.PLUGIN_ACTIVE)) {
            const when = configProps?.when
                ? configProps.when + ` && ${constants_1.DendronContext.PLUGIN_ACTIVE}`
                : constants_1.DendronContext.PLUGIN_ACTIVE;
            configProps = { ...configProps, when };
        }
        return {
            command: key,
            ...configProps,
        };
    });
    return bindings;
}
function updateViews() {
    console.log("update views");
    const out = lodash_1.default.groupBy(constants_1.DENDRON_VIEWS, "where");
    const viewJson = {};
    lodash_1.default.map(out, (views, k) => {
        viewJson[k] = lodash_1.default.map(views, (ent) => lodash_1.default.omit(ent, "where"));
    });
    return viewJson;
}
function main() {
    const dryRun = false;
    const pkg = fs_extra_1.default.readJSONSync("package.json");
    const configuration = updateConfig();
    const commands = updateCommands();
    const menus = updateMenus();
    const keybindings = updateKeybindings();
    const viewsWelcome = constants_1.DENDRON_VIEWS_WELCOME;
    const viewsContainers = constants_1.DENDRON_VIEWS_CONTAINERS;
    const views = updateViews();
    const languages = [
        {
            id: "markdown",
            extensions: [".md"],
            aliases: ["markdown"],
            configuration: "./language-configuration.json",
        },
    ];
    const previewStyles = [
        "./media/fontello/css/fontello.css",
        "./media/markdown.css",
    ];
    const yamlValidation = [
        {
            fileMatch: "dendron.yml",
            url: "./dist/dendron-yml.validator.json",
        },
    ];
    const categories = ["Other"];
    const contributes = {
        languages,
        viewsWelcome,
        viewsContainers,
        views,
        categories,
        commands,
        menus,
        configuration,
        keybindings,
        "markdown.previewStyles": previewStyles,
        yamlValidation,
    };
    if (dryRun) {
        // console.log(JSON.stringify(pkg, null, 44));
        return;
    }
    pkg.contributes = contributes;
    // write to docs
    fs_extra_1.default.writeJSONSync("package.json", pkg, { spaces: 2 });
}
main();
//# sourceMappingURL=genConfig.js.map