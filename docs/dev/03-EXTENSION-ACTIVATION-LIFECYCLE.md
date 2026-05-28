# Extension Activation Lifecycle — The Most Important Flow in Dendron

If you only ever deeply understand **one** sequence in this entire codebase, make it this one.

Everything a user experiences flows from (or is gated behind) successful activation.

---

## High-Level State Machine

```
VS Code loads extension
        │
        ▼
activate(context)  [extension.ts]
        │
        ▼
_activate(context)  [_extension.ts]
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Telemetry  DendronExtension.getOrCreate()
Setup      (the singleton + DI container)
   │         │
   ▼         ▼
Register ~150 commands
   │
   ▼
WorkspaceActivator.activate()
   │
   ├─► Read dendron.yml + vaults
   ├─► Initialize Engine (DendronEngineV2)
   ├─► Full (or incremental) index of all notes + schemas
   ├─► Set up file watchers
   ├─► Create tree views + webviews
   ├─► Register language providers
   │
   ▼
dendron:pluginActive = true
UI lights up. Commands become useful.
```

---

## Step-by-Step, File by File

### 1. `packages/plugin-core/src/extension.ts`

```ts
export function activate(context: vscode.ExtensionContext) {
  Logger.configure(context, "debug");
  require("./_extension").activate(context);
  return { DWorkspace, Logger };
}

export function deactivate() {
  require("./_extension").deactivate();
}
```

**Purpose**: Extremely thin bootstrap. The real work is in `_extension.ts` (the `require` is intentional — it allows some lazy + test shenanigans).

### 2. `_extension.ts` — `activate()` (the public one)

- Sets a custom markdown word pattern.
- If not in test stage, calls the async `_activate()` and catches errors (logs them, emits `not_initialized` history event).
- Returns the context immediately (VS Code doesn't wait for async activation to finish for most things).

### 3. `_activate()` — The Real Entry Point

This function is ~400+ lines. Major phases:

#### Phase A: Environment & Telemetry Setup (before try block)

- Determines `isDebug`, stage (`dev`/`prod`/`test`), log level.
- Creates `StateService` wrapper around `context.globalState` + `workspaceState`.
- **Critical**: Unlocks the `SegmentClient` singleton.
- If user has not opted out **and** we are in prod stage:
  - Initializes Sentry
  - Syncs anonymous ID between `~/.dendron/<id>` file and VS Code global state
- Logs a huge amount of startup context (this is gold when debugging user issues).

#### Phase B: Workspace Trust Listener

```ts
vscode.workspace.onDidGrantWorkspaceTrust(() => {
  getExtension().getEngine().trustedWorkspace = vscode.workspace.isTrusted;
});
```

Dendron respects VS Code's workspace trust model (some features are limited in untrusted workspaces).

#### Phase C: The Singleton + DI Container

```ts
const ws = await DendronExtension.getOrCreate(context, {
  skipSetup: stage === "test",
});
```

This is **the** moment the extension object is born.

`DendronExtension.getOrCreate`:
- Creates the singleton if it doesn't exist
- Calls `setupLocalExtContainer()` which wires **tsyringe**
- Many core services (engine, ws utils, etc.) are resolved from the container later

From this point forward, you will see:
- `getExtension()`
- `getDWorkspace()`
- `getEngine()`

These are all thin wrappers around the singleton or the container.

#### Phase D: Command Registration (Massive)

```ts
await _setupCommands({ ext: ws, context, requireActiveWorkspace: false });
```

This function iterates over `ALL_COMMANDS` (defined in `src/commands/index.ts` — it is enormous) and registers every `dendron.*` command with VS Code.

Many commands are wrapped with `sentryReportingCallback`.

Some commands are only registered later, after a real workspace is active.

**Important**: The `RELOAD_INDEX` command is special — it is registered early because workspace activation itself may call it.

#### Phase E: Workspace Activation (The Heavy Lift)

```ts
const activator = new WorkspaceActivator();
await activator.activate({ ext: ws, context });
```

This is where most of the user's "why is it taking so long on startup?" time is spent.

Inside `WorkspaceActivator.activate()` (and its helpers):

1. **Determine current workspace / vaults**
   - Looks for `dendron.yml`
   - Handles multi-vault, workspace trust, seeds, etc.
   - Can trigger the "Welcome" / "Create new workspace" flow if nothing is found

2. **Engine initialization**
   - Creates `DendronEngineV2` (or V3 path in newer experiments)
   - Configures vaults, cache, etc.

3. **The Index**
   - Calls `engine.init()` which does a full parse of every `.md` and `.schema.yml` file
   - Builds the note graph, schema graph, backlink index, etc.
   - This is O(total notes + total links). For large vaults this is the dominant cost.

4. **Side effects of successful init**
   - Sets `dendron:pluginActive` context key to true
   - Creates the Tree View provider
   - Sets up Backlinks, Calendar, Graph, etc. views
   - Registers file watchers for incremental updates
   - Wires up the custom markdown preview panel
   - Initializes lookup providers
   - Shows "Tip of the Day" or feature showcase toasts (if not skipped)

5. **Error / partial init paths**
   - If indexing fails hard, the extension can still partially work (some commands remain available)
   - `HistoryService` records the failure for diagnostics

#### Phase F: Language Features & Polish

After the activator returns, more providers are registered:
- `DefinitionProvider`, `ReferenceProvider`, `HoverProvider`
- `RenameProvider`
- `completionProvider`
- `codeActionProvider`
- `FrontmatterFoldingRangeProvider`
- etc.

These are what make `[[wikilinks]]` and note refs feel first-class inside the editor.

---

## Key Singletons & Services You Will Meet Constantly

| Name | How to Get It | What It Holds |
|------|---------------|---------------|
| `DendronExtension` | `getExtension()` | The root object. Owns the engine, context, DI container, most services |
| `DWorkspace` / `DWorkspaceV2` | `getDWorkspace()` | Current workspace + vaults + config snapshot |
| `DendronEngineV2` | `getEngine()` | The actual index + query API |
| `HistoryService` | `HistoryService.instance()` | Event bus for internal actions (used for analytics + debugging) |
| `SegmentClient` | `SegmentClient.instance()` | Telemetry |
| `StateService` | Created per-activation | Thin typed wrapper over VS Code global/workspace state |

---

## Error Handling & Resilience Philosophy

Dendron tries very hard to **never completely die**.

- Many top-level calls are wrapped in `sentryReportingCallback`
- `_activate` has a broad catch that still lets the extension "partially work"
- Commands often have graceful degradation paths
- The `Reload Index` command exists precisely because full re-index can be triggered manually when something gets into a bad state

This resilience is both a blessing (users rarely lose everything) and a curse (subtle broken states can linger).

---

## Performance Hot Spots During Activation

From real user reports + code inspection, the expensive parts in rough order:

1. **Full vault indexing** in `engine.init()` (especially with many vaults or very large notes)
2. **SQLite operations** during engine startup (Prisma client init + migrations/checks)
3. **Creating and populating all the tree views + webviews**
4. **Setting up file watchers** across multiple vaults
5. **React webview bundle loading** (the `dendron-plugin-views` chunks)

Later performance work will add timing around each of these phases.

---

## How to Debug Activation Problems

1. Set `LOG_LEVEL=debug` (or even more verbose) via env in your launch config.
2. Put a breakpoint at the very top of `_activate`.
3. Step through until you hit the first error or hang.
4. Watch the "Dendron" output channel in VS Code.
5. Check `HistoryService` events (some commands surface them).
6. Look in `~/.dendron` for logs and the anonymous ID file.
7. For native module crashes: the extension host developer tools (Help → Toggle Developer Tools in the Extension Development Host window) + Node inspector.

---

## What Changes When You Add a New Feature

Typical flow for a new command or view:

1. Create a new `XxxCommand` class in `src/commands/`
2. Add it to `ALL_COMMANDS`
3. (If it needs engine data) resolve the engine from the container or `getExtension()`
4. (If it has UI) create or reuse a webview factory in `src/components/views/`
5. Wire any new context keys or tree view contributions in `package.json`
6. Add tests in `src/test/suite-integ/`
7. Update the relevant docs in `docs/dev/`

---

## Relationship to the CLI and Other Entry Points

The CLI (`dendron-cli`) does **not** go through this activation path.

It directly uses `engine-server` + `pods-core`.

This is why some things work from the CLI even when the VS Code extension is completely broken.

The publishing pipeline (`nextjs-template`) consumes the output of the engine (via CLI or direct library use), not the extension.

---

## Summary for Your Mental Model

**Activation is not "the extension starting".**

Activation is:

> "Parse the user's entire knowledge base into a rich queryable index, wire up 150 commands + 8 custom views + multiple language providers, set up live synchronization with the filesystem, initialize optional telemetry, and only then declare victory."

Everything else in Dendron is either preparation for this moment or consumption of the state it produces.

Master this file and the classes it touches (`WorkspaceActivator`, `DendronExtension`, `DendronEngineV2`), and you will understand 70% of the system's behavior.

The remaining 30% lives in the markdown pipeline (`unified`) and the React webviews.

Now go read the source while this document is fresh in your mind.
