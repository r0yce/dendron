// Export the createSlice instance directly (not `import * as`), so consumers
// can use `ideSlice.actions.setNoteActive(...)`. A namespace re-export made
// `ideSlice.actions` undefined (`ideSlice.ideSlice.actions` only), which broke
// graph/calendar active-note updates in webviews.
export { ideSlice, reducer } from "./slice";
export type { IDEState } from "./slice";
export { store as ideStore, AppDispatch as ideDispatch } from "./store";
export * as ideHooks from "./hooks";
