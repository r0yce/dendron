"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEngineAPIService = void 0;
const common_all_1 = require("@dendronhq/common-all");
class MockEngineAPIService {
    // private noteProps: NoteProps[];
    store;
    wsRoot;
    constructor() {
        // this.noteProps = [];
        this.store = new common_all_1.NoteMetadataStore();
        this.wsRoot = "";
    }
    async init() {
        const vault = {
            name: "vault1",
            visibility: undefined,
            fsPath: "vault1",
            workspace: undefined,
            remote: undefined,
            userPermission: undefined,
            noAutoPush: undefined,
            sync: undefined,
            seed: undefined,
            selfContained: undefined,
            siteUrl: undefined,
            siteIndex: undefined,
        };
        const defaultOpts = {
            created: 1,
            updated: 1,
            id: (0, common_all_1.genUUID)(),
        };
        const note = common_all_1.NoteUtils.create({
            ...defaultOpts,
            // ...props,
            // custom,
            fname: "foo",
            vault,
            // body,
        });
        // const note = await NoteTestUtilsV4.createNote({
        //   fname: "foo",
        //   vault,
        //   wsRoot: "",
        // });
        this.store.write(note.id, note);
    }
    async getNote(id) {
        return this.store.get(id);
    }
    async getNoteMeta(id) {
        return this.store.get(id);
    }
    bulkGetNotes(_ids) {
        throw new Error("Not Implemented");
    }
    bulkGetNotesMeta(_ids) {
        throw new Error("Not Implemented");
    }
    findNotes(_opts) {
        throw new Error("Not Implemented");
    }
    findNotesMeta(_opts) {
        throw new Error("Not Implemented");
    }
    bulkWriteNotes(_opts) {
        throw new Error("Method not implemented.");
    }
    writeNote(_note, _opts) {
        throw new Error("Method not implemented.");
    }
    deleteNote(_id, _opts) {
        throw new Error("Method not implemented.");
    }
    renameNote(_opts) {
        throw new Error("Method not implemented.");
    }
    async queryNotes(_opts) {
        // throw new Error("Method not implemented.");
        const resp = await this.store.get("foo");
        const data = resp.data;
        return Promise.resolve([data]);
    }
}
exports.MockEngineAPIService = MockEngineAPIService;
//# sourceMappingURL=MockEngineAPIService.js.map