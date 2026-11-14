import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

type LanguageEntry = {
  implUrl: string;
  // Reference solution for this language, used to verify a student's
  // code produces the same message sequence. Not every plugin has one.
  solutionUrl?: string;
  // Starter/prefix/suffix code for this language, read from that
  // language's starter-code/ folder. Not every plugin has all three.
  starterUrl?: string;
  prefixUrl?: string;
  suffixUrl?: string;
};

/** How the site's /plugins page lists a plugin, from its optional catalog.json. The title comes from instructions.md's "# " heading unless catalog.json sets one. */
type CatalogInfo = {
  title: string;
  description: string;
  subject?: string;
  gradeBand?: string;
  topic?: string;
  course?: string;
  runtime: "javascript" | "python";
};

type Manifest = {
  [pluginName: string]: {
    instructionsUrl?: string;
    catalog?: CatalogInfo;
    [language: string]: LanguageEntry | CatalogInfo | string | undefined;
  };
};

// What a plugin's catalog.json may set. The interactive-lessons-site lists a built plugin on /plugins from these, so a new plugin shows up with the right title, subject and course without an admin step.
const CATALOG_KEYS = ["title", "description", "subject", "gradeBand", "topic", "course", "runtime"];
// The site's own lists (SUBJECTS and GRADE_BANDS in interactive-lessons-site src/lib/pluginMeta.ts). Keep them in step: the site ignores a value it doesn't know.
const CATALOG_SUBJECTS = ["Math", "Science", "History", "English"];
const CATALOG_GRADE_BANDS = ["Middle School", "High School", "College"];
const CATALOG_RUNTIMES = ["javascript", "python"];
const MAX_DESCRIPTION = 300;

/** The text of a markdown file's first "# " heading, or undefined when it has none. */
function firstHeading(markdown: string): string | undefined {
  const match = /^#\s+(.+?)\s*#*\s*$/m.exec(markdown);
  return match ? match[1].trim() : undefined;
}

/** Reads and checks a plugin's optional catalog.json. Returns undefined when there's none; throws a message naming the plugin and the problem when it's malformed, so the build fails instead of listing the plugin wrongly. */
async function readCatalog(pluginName: string, pluginPath: string): Promise<CatalogInfo | undefined> {
  let text: string;
  try {
    text = await fs.readFile(path.join(pluginPath, "catalog.json"), "utf8");
  } catch {
    return undefined;
  }
  const where = `src/plugins/${pluginName}/catalog.json`;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`${where} isn't valid JSON: ${(e as Error).message}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${where} should be a JSON object, like {"description": "...", "subject": "Math"}.`);
  }
  const record = raw as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (!CATALOG_KEYS.includes(key)) {
      throw new Error(`${where} has an unknown key "${key}". It can set: ${CATALOG_KEYS.join(", ")}.`);
    }
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${where}: "${key}" should be a non-empty string.`);
    }
  }
  const field = (key: string) => (record[key] as string | undefined)?.trim();
  const oneOf = (key: string, allowed: string[]) => {
    const value = field(key);
    if (value !== undefined && !allowed.includes(value)) {
      throw new Error(`${where}: "${key}" is "${value}", but it should be one of: ${allowed.join(", ")}.`);
    }
    return value;
  };

  const description = field("description");
  if (!description) {
    throw new Error(`${where} needs a "description": one or two sentences for the plugin's card on /plugins.`);
  }
  if (description.length > MAX_DESCRIPTION) {
    throw new Error(`${where}: "description" is ${description.length} characters; keep it under ${MAX_DESCRIPTION}.`);
  }

  let title = field("title");
  if (!title) {
    try {
      title = firstHeading(await fs.readFile(path.join(pluginPath, "instructions.md"), "utf8"));
    } catch {
      // no instructions.md; the error below says what to add
    }
  }
  if (!title) {
    throw new Error(`${where} has no title: start instructions.md with a "# Title" line, or set "title".`);
  }

  const catalog: CatalogInfo = {
    title,
    description,
    runtime: (oneOf("runtime", CATALOG_RUNTIMES) ?? "javascript") as CatalogInfo["runtime"],
  };
  const subject = oneOf("subject", CATALOG_SUBJECTS);
  const gradeBand = oneOf("gradeBand", CATALOG_GRADE_BANDS);
  const topic = field("topic");
  const course = field("course");
  if (subject) catalog.subject = subject;
  if (gradeBand) catalog.gradeBand = gradeBand;
  if (topic) catalog.topic = topic;
  if (course) catalog.course = course;
  return catalog;
}

// File extension used for each language's starter-code/{main,prefix,suffix}
// files.
const LANGUAGE_EXTENSION: Record<string, string> = {
  BasicJS: "js",
  Python: "py",
};

// Solution files live in their own top-level `solutions/` folder (sibling to
// `languages/`), named after the language they're written in and mapped to
// that language's manifest entry - not nested inside `languages/<lang>/`.
const SOLUTION_FILE_TO_LANGUAGE: Record<string, string> = {
  "solutionCode.js": "BasicJS",
  "solutionCode.py": "Python",
};

function manifestPlugin() {
  let base = "/";

  async function buildManifest() {
    const pluginsDir = path.resolve(__dirname, "src/plugins");
    const manifest: Manifest = {};
    for (const pluginName of await fs.readdir(pluginsDir)) {
      const pluginPath = path.join(pluginsDir, pluginName);
      const stat = await fs.stat(pluginPath);
      if (!stat.isDirectory()) continue;

      manifest[pluginName] = {};

      // Check for an instructions.md directly in the plugin folder
      // (sibling to `languages`, not inside it).
      const instructionsPath = path.join(pluginPath, "instructions.md");
      try {
        await fs.access(instructionsPath);
        manifest[
          pluginName
        ].instructionsUrl = `/plugins-code/${pluginName}/instructions.md`;
      } catch {
        // no instructions.md for this plugin, that's fine
      }

      const catalog = await readCatalog(pluginName, pluginPath);
      if (catalog) manifest[pluginName].catalog = catalog;

      const languagesDir = path.join(pluginPath, "languages");
      for (const lang of await fs.readdir(languagesDir)) {
        const langPath = path.join(languagesDir, lang);
        if (!(await fs.stat(langPath)).isDirectory()) continue;

        const entry: LanguageEntry = {
          implUrl: `/plugins-code/${pluginName}/languages/${lang}/implementation.js`,
        };

        // Starter/prefix/suffix code live together in this language's
        // starter-code/ folder, named main/prefix/suffix by its extension.
        // The site runs prefix + student code + suffix as one program, so a
        // plugin can keep setup and the call that draws out of the editor.
        const ext = LANGUAGE_EXTENSION[lang];
        if (ext) {
          for (const [file, key] of [
            ["main", "starterUrl"],
            ["prefix", "prefixUrl"],
            ["suffix", "suffixUrl"],
          ] as const) {
            try {
              await fs.access(path.join(langPath, "starter-code", `${file}.${ext}`));
              entry[key] = `/plugins-code/${pluginName}/languages/${lang}/starter-code/${file}.${ext}`;
            } catch {
              // no such file for this plugin/language, that's fine
            }
          }
        }

        manifest[pluginName][lang] = entry;
      }

      // Check for a solutions/ folder directly in the plugin folder
      // (sibling to `languages`, not inside it).
      const solutionsDir = path.join(pluginPath, "solutions");
      for (const [solutionFile, lang] of Object.entries(
        SOLUTION_FILE_TO_LANGUAGE
      )) {
        const langEntry = manifest[pluginName][lang];
        if (!langEntry || typeof langEntry === "string" || !("implUrl" in langEntry)) continue;

        try {
          await fs.access(path.join(solutionsDir, solutionFile));
          langEntry.solutionUrl = `/plugins-code/${pluginName}/solutions/${solutionFile}`;
        } catch {
          // no solution file of this kind for this plugin, that's fine
        }
      }
    }
    return manifest;
  }

  return {
    name: "generate-plugins-manifest",
    configResolved(cfg) {
      base = cfg.base || "/";
    },
    async buildStart() {
      const manifest = await buildManifest();
      this.emitFile({
        type: "asset",
        fileName: "plugins-manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
    configureServer() {
      // Dev: keep writing a runtime copy into /public so the dev server can serve it
      const out = path.resolve(__dirname, "public", "plugins-manifest.json");
      // A half-written plugin folder (no languages/ yet) or a malformed catalog.json used to reject here and take the dev server down; log it and keep the last good manifest instead.
      const regenerate = async () => {
        try {
          const manifest = await buildManifest();
          await fs.writeFile(out, JSON.stringify(manifest, null, 2));
        } catch (e) {
          console.error(`plugins-manifest.json not regenerated: ${(e as Error).message}`);
        }
      };
      regenerate();
      chokidar
        .watch(path.resolve(__dirname, "src/plugins"), { ignoreInitial: true })
        .on("all", regenerate);
    },
  };
}

/**
 * `vite preview` falls back to index.html (200, text/html) for any unknown
 * path, which is right for /embed/<name> routes but wrong for files: a
 * missing chunk then fails as a cryptic MIME error, and a missing
 * implementation.js is handed to the site as HTML and run as student code.
 * Answer a real 404 for build artifacts that don't exist.
 */
function missingFiles404() {
  let outDir = "";
  let base = "/";
  return {
    name: "missing-files-404",
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
      base = cfg.base || "/";
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? "").split("?")[0]);
        if (!pathname.startsWith(base)) return next();
        const rel = pathname.slice(base.length);
        if (!rel.startsWith("assets/") && !rel.startsWith("plugins-code/")) {
          return next();
        }
        const file = path.resolve(outDir, rel);
        if (!file.startsWith(outDir + path.sep)) return next();
        try {
          await fs.access(file);
          next();
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          res.end("Not found");
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === "plugins" ? "/pickcode-plugins/" : "/";

  return {
    base,
    preview: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      allowedHosts: ["pincs.stanford.edu"],
    },
    build: {
      outDir: "dist/site",
    },
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "@babel/plugin-proposal-decorators",
              {
                version: "2023-05",
              },
            ],
          ],
        },
      }),
      tailwindcss(),
      manifestPlugin(),
      missingFiles404(),
      viteStaticCopy({
        targets: [
          {
            src: "src/plugins/**/languages/**/*.*",
            dest: "plugins-code",

            rename: (fileName: string, extension: string, fullPath: string) => {
              const root = path.resolve(process.cwd(), "src", "plugins");
              let rel = path.relative(root, fullPath);
              rel = rel.split(path.sep).join(path.posix.sep);
              if (rel.endsWith("/languages/BasicJS/implementation.ts")) {
                // because we're compiling this .ts to .js
                rel = rel.replace(/\.ts$/, ".js");
              }
              return rel;
            },
            transform: {
              handler: (content, filePath) => {
                // This allows for / or \ in the path handling (didn't work on Windows before).
                const normalizedPath = filePath
                  .split(path.sep)
                  .join(path.posix.sep);
                if (
                  normalizedPath.endsWith(
                    "/languages/BasicJS/implementation.ts"
                  )
                ) {
                  return ts.transpileModule(content.toString(), {
                    compilerOptions: {
                      module: ts.ModuleKind.ESNext,
                      target: ts.ScriptTarget.ES2020,
                    },
                  }).outputText;
                }
                return content;
              },
              encoding: "utf-8",
            },
          },
          {
            src: [
              "src/plugins/*/languages/**/*",
              "!src/plugins/*/languages/*/implementation.ts",
            ],
            dest: "plugins-code",
          },
          {
            // Copy each plugin's instructions.md (lives at src/plugins/<name>/instructions.md,
            // not under languages/) to dist/plugins-code/<name>/instructions.md
            src: "src/plugins/*/instructions.md",
            dest: "plugins-code",
            rename: (fileName: string, extension: string, fullPath: string) => {
              const root = path.resolve(process.cwd(), "src", "plugins");
              let rel = path.relative(root, fullPath);
              rel = rel.split(path.sep).join(path.posix.sep);
              return rel; // e.g. "somePlugin/instructions.md"
            },
          },
          {
            // Copy each plugin's solution files (live at
            // src/plugins/<name>/solutions/, not under languages/) to
            // dist/plugins-code/<name>/solutions/
            src: "src/plugins/*/solutions/*",
            dest: "plugins-code",
            rename: (fileName: string, extension: string, fullPath: string) => {
              const root = path.resolve(process.cwd(), "src", "plugins");
              let rel = path.relative(root, fullPath);
              rel = rel.split(path.sep).join(path.posix.sep);
              return rel; // e.g. "somePlugin/solutions/solutionCode.js"
            },
          },
        ],
      }),
    ],
  };
});
