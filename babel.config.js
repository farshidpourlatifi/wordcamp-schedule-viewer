/**
 * Babel configuration — shared by webpack (via babel-loader) and Jest
 * (via babel-jest), so the code under test is transpiled exactly like the code
 * that ships.
 *
 * This is `babel.config.js` rather than `.babelrc` deliberately: `.babelrc` is
 * file-relative and does not reliably apply to every file Jest pulls in, while
 * a root config applies project-wide.
 */

module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        // `targets` is read from the "browserslist" key in package.json, so the
        // browser support policy lives in exactly one place.
        //
        // Modules: keep ESM in webpack builds so tree-shaking works, but hand
        // Jest CommonJS, since its runtime does not consume ESM natively here.
        modules: process.env.NODE_ENV === "test" ? "commonjs" : false,
      },
    ],
    [
      "@babel/preset-react",
      {
        // The automatic runtime injects the JSX factory itself — no
        // `import React from "react"` boilerplate at the top of every file.
        runtime: "automatic",
      },
    ],
  ],
};
