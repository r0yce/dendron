"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildUtils = exports.LernaUtils = exports.ExtensionType = exports.PublishEndpoint = exports.SemverVersion = void 0;
/* eslint-disable no-console */
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var execa_1 = require("execa");
var fs_extra_1 = require("fs-extra");
var lodash_1 = require("lodash");
var path_1 = require("path");
var semver_1 = require("semver");
var SemverVersion;
(function (SemverVersion) {
    SemverVersion["MAJOR"] = "major";
    SemverVersion["MINOR"] = "minor";
    SemverVersion["PATCH"] = "patch";
    SemverVersion["PRERELEASE"] = "prerelease";
})(SemverVersion || (exports.SemverVersion = SemverVersion = {}));
var PublishEndpoint;
(function (PublishEndpoint) {
    PublishEndpoint["LOCAL"] = "local";
    PublishEndpoint["REMOTE"] = "remote";
})(PublishEndpoint || (exports.PublishEndpoint = PublishEndpoint = {}));
var ExtensionType;
(function (ExtensionType) {
    ExtensionType["DENDRON"] = "dendron";
    ExtensionType["NIGHTLY"] = "nightly";
})(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
var LOCAL_NPM_ENDPOINT = "http://localhost:4873";
var REMOTE_NPM_ENDPOINT = "https://registry.npmjs.org";
var $ = function (cmd, opts) {
    return execa_1.default.commandSync(cmd, __assign({ shell: true }, opts));
};
var $$ = function (cmd, opts) {
    var _a;
    var out = execa_1.default.command(cmd, __assign({ shell: true }, opts));
    if (!(opts === null || opts === void 0 ? void 0 : opts.quiet)) {
        (_a = out.stdout) === null || _a === void 0 ? void 0 : _a.pipe(process.stdout);
    }
    return out;
};
var LernaUtils = /** @class */ (function () {
    function LernaUtils() {
    }
    LernaUtils.bumpVersion = function (version) {
        $("lerna version ".concat(version, " --no-git-tag-version"));
        $("git add .");
        $("git commit -m \"chore: publish ".concat(version, "\""));
    };
    LernaUtils.publishVersion = function (endpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = endpoint === PublishEndpoint.LOCAL
                            ? LOCAL_NPM_ENDPOINT
                            : REMOTE_NPM_ENDPOINT;
                        return [4 /*yield*/, $$("lerna publish from-package --ignore-scripts --registry ".concat(url))];
                    case 1:
                        _a.sent();
                        $("node bootstrap/scripts/genMeta.js");
                        return [2 /*return*/];
                }
            });
        });
    };
    return LernaUtils;
}());
exports.LernaUtils = LernaUtils;
var BuildUtils = /** @class */ (function () {
    function BuildUtils() {
    }
    BuildUtils.getLernaRoot = function () {
        var maybeRoot = (0, common_server_1.findUpTo)({
            base: process.cwd(),
            fname: "lerna.json",
            returnDirPath: true,
            maxLvl: 4,
        });
        if (!maybeRoot) {
            throw new common_all_1.DendronError({
                message: "no lerna root found from ".concat(process.cwd()),
            });
        }
        return maybeRoot;
    };
    BuildUtils.getCurrentVersion = function () {
        return fs_extra_1.default.readJSONSync(path_1.default.join(this.getLernaRoot(), "lerna.json"))
            .version;
    };
    BuildUtils.getPluginRootPath = function () {
        return path_1.default.join(this.getLernaRoot(), "packages", "plugin-core");
    };
    BuildUtils.getPluginViewsRootPath = function () {
        return path_1.default.join(this.getLernaRoot(), "packages", "dendron-plugin-views");
    };
    BuildUtils.getPkgMeta = function (_a) {
        var pkgPath = _a.pkgPath;
        return fs_extra_1.default.readJSONSync(pkgPath);
    };
    BuildUtils.restorePluginPkgJson = function () {
        var pkgPath = path_1.default.join(this.getPluginRootPath(), "package.json");
        $("git checkout -- ".concat(pkgPath));
    };
    BuildUtils.setRegLocal = function () {
        $("yarn config set registry ".concat(LOCAL_NPM_ENDPOINT));
        $("npm set registry ".concat(LOCAL_NPM_ENDPOINT));
    };
    BuildUtils.setRegRemote = function () {
        $("yarn config set registry ".concat(REMOTE_NPM_ENDPOINT));
        $("npm set registry ".concat(REMOTE_NPM_ENDPOINT));
    };
    BuildUtils.genNextVersion = function (opts) {
        return semver_1.default.inc(opts.currentVersion, opts.upgradeType);
    };
    BuildUtils.buildPluginViews = function () {
        var root = this.getPluginViewsRootPath();
        $("yarn build:prod", { cwd: root });
    };
    BuildUtils.installPluginDependencies = function () {
        // remove root package.json before installing locally
        fs_extra_1.default.removeSync(path_1.default.join(this.getLernaRoot(), "package.json"));
        return $("yarn install --no-lockfile --update-checksums", {
            cwd: this.getPluginRootPath(),
        });
    };
    BuildUtils.installPluginLocally = function (version) {
        return Promise.all([
            $$("code-insiders --install-extension \"dendron-".concat(version, ".vsix\" --force"), { cwd: this.getPluginRootPath() }),
            $$("codium --install-extension \"dendron-".concat(version, ".vsix\" --force"), {
                cwd: this.getPluginRootPath(),
            }),
        ]);
    };
    BuildUtils.compilePlugin = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var quiet = _b.quiet, skipSentry = _b.skipSentry;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, $$("yarn build:prod", {
                            cwd: this.getPluginRootPath(),
                            env: skipSentry ? { SKIP_SENTRY: "true" } : {},
                            quiet: quiet,
                        })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @param param0
     * @returns
     */
    BuildUtils.packagePluginDependencies = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var execOpts;
            var skipSentry = _b.skipSentry, quiet = _b.quiet, extensionTarget = _b.extensionTarget;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        execOpts = {
                            cwd: this.getPluginRootPath(),
                            env: skipSentry ? { SKIP_SENTRY: "true" } : {},
                            quiet: quiet,
                        };
                        if (!extensionTarget) return [3 /*break*/, 2];
                        return [4 /*yield*/, $$("vsce package --yarn --target ".concat(extensionTarget), execOpts)];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, $$("vsce package --yarn", execOpts)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BuildUtils.prepPluginPkg = function () {
        return __awaiter(this, arguments, void 0, function (target) {
            var pkgPath, version, description, icon;
            var _this = this;
            if (target === void 0) { target = ExtensionType.DENDRON; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pkgPath = path_1.default.join(this.getPluginRootPath(), "package.json");
                        if (!(target === ExtensionType.NIGHTLY)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getIncrementedVerForNightly()];
                    case 1:
                        version = _a.sent();
                        description =
                            "This is a prerelease version of Dendron that may be unstable. Please install the main dendron extension instead.";
                        icon = "media/logo-bw.png";
                        _a.label = 2;
                    case 2:
                        this.updatePkgMeta({
                            pkgPath: pkgPath,
                            name: target.toString(),
                            displayName: target.toString(),
                            description: description,
                            main: "./dist/extension.js",
                            repository: {
                                url: "https://github.com/dendronhq/dendron.git",
                                type: "git",
                            },
                            version: version,
                            icon: icon,
                        });
                        this.removeDevDepsFromPkgJson({
                            pkgPath: pkgPath,
                            dependencies: [
                                "@dendronhq/common-test-utils",
                                "@dendronhq/engine-test-utils",
                                "vscode-test",
                            ],
                        });
                        return [4 /*yield*/, Promise.all(["prisma-shim.js", "adm-zip.js"].map(function (ent) {
                                return fs_extra_1.default.copy(path_1.default.join(_this.getPluginRootPath(), "..", "engine-server", "src", "drivers", ent), path_1.default.join(_this.getPluginRootPath(), "dist", ent));
                            }))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets the appropriate version to use for nightly ext. Published versions in
     * the marketplace must be monotonically increasing. If current package.json
     * version is greated than the marketplace, use that. Otherwise, just bump the
     * patch version.
     * @returns
     */
    BuildUtils.getIncrementedVerForNightly = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pkgPath, version, packageJsonVersion, extMetadata, result, formatted, json, marketplaceVersion, verToUse, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pkgPath = path_1.default.join(this.getPluginRootPath(), "package.json");
                        version = this.getPkgMeta({ pkgPath: pkgPath }).version;
                        packageJsonVersion = version;
                        console.log("package.json manifest version is " + packageJsonVersion);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, $$("npx vsce show dendron.nightly --json", {
                                cwd: this.getPluginRootPath(),
                            })];
                    case 2:
                        extMetadata = _a.sent();
                        result = extMetadata.stdout;
                        formatted = result.replace("\t", "").replace("\n", "");
                        json = JSON.parse(formatted);
                        marketplaceVersion = json.versions[0]["version"];
                        console.log("Marketplace Version is " + marketplaceVersion);
                        verToUse = semver_1.default.lt(marketplaceVersion, packageJsonVersion)
                            ? packageJsonVersion
                            : semver_1.default.inc(marketplaceVersion, "patch");
                        return [2 /*return*/, verToUse !== null && verToUse !== void 0 ? verToUse : undefined];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Unable to fetch current version for nightly ext from VS Code marketplace. Attempting to use version in package.json. Error " +
                            (0, common_all_1.error2PlainObject)(err_1));
                        return [2 /*return*/, version];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set NPM to publish locally
     */
    BuildUtils.prepPublishLocal = function () {
        this.setRegLocal();
    };
    /**
     * Set NPM to publish remotely
     */
    BuildUtils.prepPublishRemote = function () {
        this.setRegRemote();
    };
    /**
     *
     * @returns
     * @throws Error if typecheck is not successful
     */
    BuildUtils.runTypeCheck = function () {
        $("yarn lerna:typecheck", { cwd: this.getLernaRoot() });
    };
    BuildUtils.sleep = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve({});
                        }, ms);
                    })];
            });
        });
    };
    BuildUtils.startVerdaccio = function () {
        var subprocess = (0, execa_1.default)("verdaccio");
        var logger = (0, common_server_1.createLogger)("verdaccio");
        subprocess.on("close", function () {
            logger.error({ state: "close" });
        });
        subprocess.on("disconnect", function () {
            logger.error({ state: "disconnect" });
        });
        subprocess.on("exit", function () {
            logger.error({ state: "exit" });
        });
        subprocess.on("error", function (err) {
            logger.error({ state: "error", payload: err });
        });
        subprocess.on("message", function (message) {
            logger.info({ state: "message", message: message });
        });
        if (subprocess.stdout && subprocess.stderr) {
            subprocess.stdout.on("data", function (chunk) {
                process.stdout.write(chunk);
                // verdaccio is ready
                // if (chunk.toString().match("http address")) {
                // }
            });
            subprocess.stderr.on("data", function (chunk) {
                process.stdout.write(chunk);
            });
        }
        return subprocess;
    };
    /**
     * Migrate assets from next-server, plugin-views, and api-server to plugin-core
     * @returns
     * ^gg4woyhxe1xn
     */
    BuildUtils.syncStaticAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var commonAssetsRoot, commonAssetsBuildRoot, commonAssetsStylesRoot, pluginAssetPath, pluginStaticPath, pluginViewsRoot, katexFontsPath;
            return __generator(this, function (_a) {
                commonAssetsRoot = path_1.default.join(this.getLernaRoot(), "packages", "common-assets");
                commonAssetsBuildRoot = path_1.default.join(commonAssetsRoot, "build");
                commonAssetsStylesRoot = path_1.default.join(commonAssetsRoot, "styles");
                pluginAssetPath = path_1.default.join(this.getPluginRootPath(), "assets");
                pluginStaticPath = path_1.default.join(pluginAssetPath, "static");
                pluginViewsRoot = path_1.default.join(this.getLernaRoot(), "packages", "dendron-plugin-views");
                fs_extra_1.default.ensureDirSync(pluginStaticPath);
                fs_extra_1.default.emptyDirSync(pluginStaticPath);
                // copy over common assets
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsRoot, "assets", "css"), pluginStaticPath);
                katexFontsPath = path_1.default.join(commonAssetsBuildRoot, "assets", "css", "fonts");
                fs_extra_1.default.copySync(katexFontsPath, path_1.default.join(pluginStaticPath, "css", "themes", "fonts"));
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsRoot, "assets", "js"), path_1.default.join(pluginStaticPath, "js"));
                // copy assets from plugin view
                fs_extra_1.default.copySync(path_1.default.join(pluginViewsRoot, "build", "static", "css"), path_1.default.join(pluginStaticPath, "css"));
                fs_extra_1.default.copySync(path_1.default.join(pluginViewsRoot, "build", "static", "js"), path_1.default.join(pluginStaticPath, "js"));
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsStylesRoot, "scss"), path_1.default.join(pluginViewsRoot, "src", "styles", "scss"));
                return [2 /*return*/, { staticPath: pluginStaticPath }];
            });
        });
    };
    // ^gxyyk2p87a5z
    BuildUtils.syncStaticAssetsToNextjsTemplate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var commonAssetsRoot, templatePath, templatePublicPath, templateAssetPath;
            return __generator(this, function (_a) {
                commonAssetsRoot = path_1.default.join(this.getLernaRoot(), "packages", "common-assets");
                templatePath = path_1.default.join(this.getLernaRoot(), "packages", "nextjs-template");
                templatePublicPath = path_1.default.join(templatePath, "public");
                templateAssetPath = path_1.default.join(templatePublicPath, "assets-dendron");
                // copy files
                fs_extra_1.default.ensureDirSync(templateAssetPath);
                fs_extra_1.default.emptyDirSync(templateAssetPath);
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsRoot, "build", "assets"), templateAssetPath);
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsRoot, "build", "top"), templatePublicPath);
                fs_extra_1.default.copySync(path_1.default.join(commonAssetsRoot, "styles", "scss"), path_1.default.join(templatePath, "styles", "scss"));
                return [2 /*return*/];
            });
        });
    };
    BuildUtils.removeDevDepsFromPkgJson = function (_a) {
        var pkgPath = _a.pkgPath, dependencies = _a.dependencies;
        var pkg = fs_extra_1.default.readJSONSync(pkgPath);
        lodash_1.default.forEach(pkg.devDependencies, function (_v, k) {
            if (dependencies.includes(k)) {
                delete pkg.devDependencies[k];
            }
        });
        fs_extra_1.default.writeJSONSync(pkgPath, pkg, { spaces: 4 });
    };
    BuildUtils.updatePkgMeta = function (_a) {
        var pkgPath = _a.pkgPath, name = _a.name, displayName = _a.displayName, description = _a.description, main = _a.main, repository = _a.repository, version = _a.version, icon = _a.icon;
        var pkg = fs_extra_1.default.readJSONSync(pkgPath);
        pkg.name = name;
        if (description) {
            pkg.description = description;
        }
        if (displayName) {
            pkg.displayName = displayName;
        }
        if (main) {
            pkg.main = main;
        }
        if (repository) {
            pkg.repository = repository;
        }
        if (version) {
            pkg.version = version;
        }
        if (icon) {
            pkg.icon = icon;
        }
        pkg.main = "dist/extension.js";
        fs_extra_1.default.writeJSONSync(pkgPath, pkg, { spaces: 4 });
    };
    BuildUtils.publish = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var cwd = _b.cwd, osvxKey = _b.osvxKey;
            return __generator(this, function (_c) {
                return [2 /*return*/, Promise.all([
                        $("vsce publish", { cwd: cwd }),
                        $("ovsx publish", {
                            cwd: cwd,
                            env: {
                                OVSX_PAT: osvxKey,
                            },
                        }),
                    ])];
            });
        });
    };
    BuildUtils.publishInsider = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pkgPath, _a, name, version, pkg, bucket;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pkgPath = this.getPluginRootPath();
                        return [4 /*yield*/, this.getPkgMeta({ pkgPath: pkgPath })];
                    case 1:
                        _a = _b.sent(), name = _a.name, version = _a.version;
                        pkg = "".concat(name, "-").concat(version, ".vsix");
                        bucket = "org-dendron-public-assets";
                        return [4 /*yield*/, $("aws s3 cp $package s3://".concat(bucket, "/publish/$").concat(pkg))];
                    case 2:
                        _b.sent();
                        console.log("https://".concat(bucket, ".s3.amazonaws.com/publish/").concat(pkg));
                        return [2 /*return*/];
                }
            });
        });
    };
    return BuildUtils;
}());
exports.BuildUtils = BuildUtils;
