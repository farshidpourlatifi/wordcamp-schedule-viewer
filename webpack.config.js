/**
 * Webpack configuration — hand-written, no scaffold.
 *
 * The assignment requires the toolchain be configured from scratch (explicitly
 * NOT create-react-app), so every loader and plugin below is chosen and
 * explained rather than inherited from a template.
 *
 * One config serves both modes; `--mode` drives the differences via the
 * `isProduction` flag. Run:
 *   npm start  -> webpack serve --mode development
 *   npm run build -> webpack --mode production
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (_env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    // Single entry — this is a small SPA, so code splitting beyond the
    // automatic vendor chunk below would be ceremony without benefit.
    entry: "./src/index.js",

    output: {
      path: path.resolve(__dirname, "dist"),
      // Content hashes let the CDN cache assets forever and bust precisely when
      // a file's bytes change. Omitted in dev, where the names only add noise.
      filename: isProduction
        ? "assets/[name].[contenthash:8].js"
        : "assets/[name].js",
      // Every route serves from the domain root; required for the SPA history
      // fallback (deep links like /past) to resolve asset URLs correctly.
      publicPath: "/",
      // Wipe stale hashed bundles from previous builds.
      clean: true,
    },

    // Source maps: full, separate-file maps in production so stack traces from
    // the live demo stay debuggable; cheaper eval-based maps in dev for speed.
    devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",

    resolve: {
      // Lets `import App from "./App"` resolve App.jsx without the extension.
      extensions: [".js", ".jsx"],
      // `@/` -> src/, so deep imports don't turn into ../../../ chains.
      alias: { "@": path.resolve(__dirname, "src") },
    },

    module: {
      rules: [
        {
          // Application source only — node_modules ships pre-compiled, and
          // running Babel over it is the single biggest build-time waste.
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            // Cache transpiled modules to disk; large speedup on rebuilds.
            options: { cacheDirectory: true },
          },
        },
        {
          test: /\.css$/,
          use: [
            // Dev: inject CSS through <style> tags so hot reload can swap them
            // without a page refresh. Prod: extract to a real .css file so it
            // downloads in parallel with the JS and can be cached separately.
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
            // Runs Tailwind + autoprefixer (see postcss.config.js).
            "postcss-loader",
          ],
        },
        {
          // Asset modules replace the old file-loader/url-loader pair.
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: "asset",
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        // Our own HTML shell; webpack injects the hashed bundle tags into it.
        template: "./public/index.html",
        favicon: "./public/favicon.svg",
      }),
      // Static files that ship as-is. index.html is excluded because
      // HtmlWebpackPlugin renders it (copying it raw would overwrite the
      // version with the bundle tags injected).
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public",
            globOptions: { ignore: ["**/index.html"] },
          },
        ],
      }),
      // Only instantiated in production, where its loader is actually used.
      isProduction &&
        new MiniCssExtractPlugin({
          filename: "assets/[name].[contenthash:8].css",
        }),
    ].filter(Boolean),

    optimization: {
      // Split React and friends into their own chunk. They change far less
      // often than app code, so returning visitors keep them cached.
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            // "initial", not "all": only the dependencies of the initial entry
            // (React, TanStack, Base UI…) belong in the up-front vendor chunk.
            // "all" would hoist async-only deps here too — Leaflet, ~150 KiB —
            // defeating the point of lazily importing the map. With "initial"
            // those stay inside the map's own async chunk, downloaded only when
            // someone opens it.
            chunks: "initial",
          },
        },
      },
    },

    devServer: {
      port: 3000,
      open: true,
      hot: true,
      // Client-side routing: unknown paths must return index.html rather than
      // a 404, or a refresh on /past breaks.
      historyApiFallback: true,
    },

    // The default 244 KiB budget fires on React itself and trains you to ignore
    // warnings. Raised to a level where a real regression still surfaces.
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
