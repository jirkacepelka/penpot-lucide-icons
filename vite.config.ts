import { defineConfig, build, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import generateFile from "vite-plugin-generate-file";
import { getPenpotManifest } from "./penpot.manifest.ts";
import tailwindcss from "@tailwindcss/vite";

export function pluginDevServe(): Plugin {
  return {
    name: "serve-plugin-ts-as-js",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/plugin.js") {
          try {
            // Bundle the file on-the-fly using Rollup/Vite core
            const bundleResult = await build({
              root: server.config.root,
              configFile: false,
              logLevel: "silent",
              build: {
                write: false,
                rolldownOptions: {
                  input: "./src/plugin.penpot.ts",
                  output: {
                    format: "iife",
                    name: "penpotPlugin",
                  },
                  // Prevent Rollup from throwing errors over the global 'penpot' object
                  external: ["penpot"],
                },
              },
            });

            // Extract the bundled code output
            const outputFiles =
              "output" in bundleResult
                ? bundleResult.output
                : Array.isArray(bundleResult)
                  ? bundleResult[0].output
                  : [];

            const jsOutput = outputFiles.find(
              (file) => file.type === "chunk" && file.isEntry,
            );

            if (jsOutput && "code" in jsOutput) {
              res.setHeader("Content-Type", "application/javascript");
              res.end(jsOutput.code);
              return;
            }
          } catch (e) {
            return next(e);
          }
        }
        next();
      });
    },
  };
}

export function pluginBuildForProduction(): Plugin {
  return {
    name: "build-plugin-as-iife",
    apply: "build",
    async closeBundle() {
      await build({
        configFile: false,
        logLevel: "info",
        build: {
          outDir: "dist",
          emptyOutDir: false,
          rolldownOptions: {
            input: "./src/plugin.penpot.ts",
            external: ["penpot"],
            output: {
              format: "iife",
              name: "penpotPlugin",
              entryFileNames: "plugin.js",
              globals: {
                penpot: "penpot",
              },
            },
          },
        },
      });
    },
  };
}

export default defineConfig(() => {
  return {
    // Everything is referenced relatively, so the plugin works from any
    // sub-path (e.g. GitHub Pages) without configuration.
    base: "./",
    plugins: [
      svelte(),
      tailwindcss(),
      generateFile([
        {
          type: "json",
          output: "./manifest.json",
          data: getPenpotManifest(),
        },
      ]),
      pluginDevServe(),
      pluginBuildForProduction(),
    ],
    resolve: {
      alias: [{ find: "$lib", replacement: "/src/lib/" }],
    },
    build: {
      rolldownOptions: {
        input: {
          index: "./index.html",
        },
        output: {
          entryFileNames: (chunkInfo) => {
            switch (chunkInfo.name) {
              case "index":
                return "[name].js";
              default:
                return "[name]-[hash].js";
            }
          },
        },
      },
    },
    preview: {
      port: 5111,
      cors: {},
    },
    server: {
      cors: true,
      allowedHosts: [".penpot.app"],
    },
  };
});
