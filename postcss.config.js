/**
 * PostCSS configuration — consumed by postcss-loader in webpack.config.js.
 *
 * Order matters: Tailwind must expand its directives into real CSS before
 * autoprefixer can add vendor prefixes to the result.
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    // Reads the same browserslist policy as Babel (package.json), so prefixes
    // and syntax transpilation always agree on the target browsers.
    autoprefixer: {},
  },
};
