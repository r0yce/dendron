import { getStage } from "@dendronhq/common-all";
import { configureStore } from "@reduxjs/toolkit";
import { engineSlice } from "./engine/slice";
import { ideSlice } from "./ide/slice";

export * from "./engine";
export * from "./ide";

const engine = engineSlice.reducer;
const ide = ideSlice.reducer;

const store = configureStore({
  reducer: {
    engine,
    ide,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware();
    if (getStage() === `dev`) {
      const { createLogger } = require(`redux-logger`);
      middleware.push(
        createLogger({
          collapsed: true,
        })
      );
    }
    return middleware;
  },
});

export { store as combinedStore };
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
export { RootState as CombinedRootState };
export { AppDispatch as CombinedDispatch };