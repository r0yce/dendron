"use strict";

const babelJest = require("babel-jest");

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === "true") {
    return false;
  }

  try {
    require.resolve("react/jsx-runtime");
    return true;
  } catch (e) {
    return false;
  }
})();

// Babel 8 explicit presets — no babel-preset-react-app
module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve("@babel/preset-env"),
      {
        targets: { node: "current" },
      },
    ],
    [
      require.resolve("@babel/preset-react"),
      {
        runtime: hasJsxRuntime ? "automatic" : "classic",
      },
    ],
    require.resolve("@babel/preset-typescript"),
  ],
  babelrc: false,
  configFile: false,
});
