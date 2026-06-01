declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    ide: import("./slice").IDEState;
}, import("redux").AnyAction, [import("redux-thunk").ThunkMiddleware<{
    ide: import("./slice").IDEState;
}, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<{
    ide: import("./slice").IDEState;
}, import("redux").AnyAction>]>;
export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
