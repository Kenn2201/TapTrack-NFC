/**
 * Universal Codebase → AI / Obsidian Mapper
 * generate-vault.cjs
 *
 * PURPOSE
 * -------
 * Scan a project locally and create a reusable codebase knowledge map
 * for both:
 *
 *   1. AI coding agents
 *   2. Obsidian
 *
 * The generated map helps an AI locate the correct files/functions/routes
 * without repeatedly scanning and opening the entire repository.
 *
 * DEFAULT USAGE
 * -------------
 *
 *   node .\generate-vault.cjs
 *
 * This scans the CURRENT working directory.
 *
 * Scan another project:
 *
 *   node .\generate-vault.cjs "G:\path\to\project"
 *
 * OUTPUT
 * ------
 *
 *   <project>\temp files\obsidian-vault\
 *
 * Important generated files:
 *
 *   AI_MAP.md
 *      Compact navigation map for coding agents.
 *      THIS SHOULD BE READ FIRST.
 *
 *   AI_SYMBOLS.json
 *      Function/class/symbol → exact source file + line lookup.
 *
 *   MAP_META.json
 *      Git branch, commit, generation time and map metadata.
 *
 *   AI_FILES.txt
 *      Compact list of every mapped file.
 *
 *   HOME.md
 *      Human-friendly Obsidian home page.
 *
 *   _INDEX.md
 *      Full index grouped by project section/category.
 *
 *   graph.json
 *      Dependency graph data.
 *
 *   files/
 *      One detailed Obsidian note per mapped source file.
 *
 * SECURITY
 * --------
 *
 * Real .env files are ignored.
 * .env.example is allowed.
 *
 * GENERATED OUTPUT
 * ----------------
 *
 * "temp files" is ignored while scanning so the mapper never maps itself
 * recursively through its generated vault.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// =============================================================================
// PROJECT ROOT
// =============================================================================

const PROJECT_ROOT = path.resolve(
    process.argv[2] || process.cwd()
);

// =============================================================================
// OUTPUT
// =============================================================================

const OUTPUT_DIR = path.join(
    PROJECT_ROOT,
    "temp files",
    "obsidian-vault"
);

// =============================================================================
// CONFIG
// =============================================================================

const CONFIG = {
    projectRoot: PROJECT_ROOT,
    outputDir: OUTPUT_DIR,

    // -------------------------------------------------------------------------
    // Extensions worth mapping
    // -------------------------------------------------------------------------

    extensions: new Set([
        // JavaScript / TypeScript
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",

        // Frontend frameworks
        ".vue",
        ".svelte",
        ".astro",

        // Styles
        ".css",
        ".scss",
        ".sass",
        ".less",

        // Python
        ".py",

        // Java / Kotlin
        ".java",
        ".kt",
        ".kts",

        // Go
        ".go",

        // Rust
        ".rs",

        // PHP / Ruby
        ".php",
        ".rb",

        // C / C++
        ".c",
        ".cc",
        ".cpp",
        ".h",
        ".hpp",

        // C#
        ".cs",

        // Shell / PowerShell
        ".sh",
        ".bash",
        ".zsh",
        ".ps1",
        ".bat",
        ".cmd",

        // Web
        ".html",
        ".htm",

        // Config / Data
        ".json",
        ".jsonc",
        ".yaml",
        ".yml",
        ".toml",
        ".xml",

        // Documentation
        ".md",
        ".mdx",
        ".txt",

        // Database
        ".sql",
    ]),

    // -------------------------------------------------------------------------
    // Useful extensionless / unusual files
    // -------------------------------------------------------------------------

    specialFiles: new Set([
        "Dockerfile",
        "Makefile",
        "Procfile",
        "CMakeLists.txt",

        ".gitignore",
        ".dockerignore",
        ".editorconfig",
        ".npmrc",
        ".nvmrc",

        ".env.example",

        "LICENSE",
    ]),

    // -------------------------------------------------------------------------
    // Directories that must not be scanned
    // -------------------------------------------------------------------------

    ignoreDirs: new Set([
        // Generated mapper output
        "temp files",

        // Git / IDE
        ".git",
        ".idea",

        // Keep .vscode available by default.
        // Add ".vscode" here if you do not want it mapped.

        // JavaScript
        "node_modules",

        // Build output
        "dist",
        "build",
        "out",

        ".next",
        ".nuxt",
        ".svelte-kit",
        ".output",

        // Coverage
        "coverage",
        ".coverage",
        ".nyc_output",

        // Caches
        ".cache",
        ".parcel-cache",
        ".turbo",

        // Provider generated folders
        ".vercel",
        ".netlify",

        // Python
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        ".ruff_cache",
        ".venv",
        "venv",

        // Java / Rust / .NET
        "target",
        "bin",
        "obj",

        // PHP
        "vendor",

        // Generic temp
        "tmp",
    ]),

    // -------------------------------------------------------------------------
    // Sensitive files
    // -------------------------------------------------------------------------

    ignoreFiles: new Set([
        ".env",
        ".env.local",
        ".env.production",
        ".env.development",
        ".env.test",
    ]),

    maxDescriptionLength: 220,
};

// =============================================================================
// STATE
// =============================================================================

let allFiles = [];

const fileByNormalizedPath = new Map();

// =============================================================================
// BASIC HELPERS
// =============================================================================

function normalizePath(value) {
    const normalized = path.normalize(value);

    if (process.platform === "win32") {
        return normalized.toLowerCase();
    }

    return normalized;
}

function toPosix(value) {
    return value.replace(/\\/g, "/");
}

function getRelativePath(absPath) {
    return toPosix(
        path.relative(
            CONFIG.projectRoot,
            absPath
        )
    );
}

function slug(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeYaml(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function uniqueByAbsPath(files) {
    const seen = new Set();
    const result = [];

    for (const file of files) {
        if (!file) {
            continue;
        }

        const key = normalizePath(
            file.absPath
        );

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(file);
    }

    return result;
}

function lineNumberAt(content, index) {
    return content
        .slice(0, index)
        .split(/\r?\n/)
        .length;
}

// =============================================================================
// GIT INFORMATION
// =============================================================================

function getGitInfo() {
    function runGit(args) {
        try {
            return execFileSync(
                "git",
                args,
                {
                    cwd: CONFIG.projectRoot,
                    encoding: "utf8",
                    stdio: [
                        "ignore",
                        "pipe",
                        "ignore",
                    ],
                }
            ).trim();
        } catch {
            return null;
        }
    }

    const shortCommit = runGit([
        "rev-parse",
        "--short",
        "HEAD",
    ]);

    const fullCommit = runGit([
        "rev-parse",
        "HEAD",
    ]);

    const branch = runGit([
        "rev-parse",
        "--abbrev-ref",
        "HEAD",
    ]);

    const status = runGit([
        "status",
        "--porcelain",
    ]);

    return {
        branch: branch || "unknown",
        commit: shortCommit || "unknown",
        fullCommit: fullCommit || "unknown",
        dirty: Boolean(status),
    };
}

// =============================================================================
// IGNORE LOGIC
// =============================================================================

function isIgnoredDirectory(name) {
    return CONFIG.ignoreDirs.has(name);
}

function isIgnoredFile(name) {
    // .env.example is intentionally safe to map.
    if (name === ".env.example") {
        return false;
    }

    if (CONFIG.ignoreFiles.has(name)) {
        return true;
    }

    // Ignore every other .env variant by default.
    if (
        name === ".env" ||
        name.startsWith(".env.")
    ) {
        return true;
    }

    return false;
}

function shouldIncludeFile(fileName) {
    if (isIgnoredFile(fileName)) {
        return false;
    }

    if (
        CONFIG.specialFiles.has(
            fileName
        )
    ) {
        return true;
    }

    const ext = path
        .extname(fileName)
        .toLowerCase();

    return CONFIG.extensions.has(ext);
}

// =============================================================================
// CLASSIFICATION
// =============================================================================

function detectSection(relPath) {
    const normalized =
        toPosix(relPath);

    const parts =
        normalized.split("/");

    if (parts.length <= 1) {
        return "root";
    }

    return parts[0];
}

function detectCategory(relPath) {
    const p =
        "/" +
        toPosix(relPath)
            .toLowerCase();

    const fileName =
        path.basename(relPath)
            .toLowerCase();

    const ext =
        path.extname(fileName)
            .toLowerCase();

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    if (
        p.includes("/test/") ||
        p.includes("/tests/") ||
        p.includes("/__tests__/") ||
        p.includes("/spec/") ||
        p.includes("/specs/") ||
        /\.(test|spec)\.[^.]+$/.test(
            fileName
        )
    ) {
        return "Test";
    }

    // -------------------------------------------------------------------------
    // Components
    // -------------------------------------------------------------------------

    if (
        p.includes("/components/")
    ) {
        return "Component";
    }

    // -------------------------------------------------------------------------
    // Pages
    // -------------------------------------------------------------------------

    if (
        p.includes("/pages/") ||
        p.includes("/views/") ||
        p.includes("/screens/") ||
        p.includes("/user-pages/")
    ) {
        return "Page";
    }

    // -------------------------------------------------------------------------
    // Hooks
    // -------------------------------------------------------------------------

    if (
        p.includes("/hooks/")
    ) {
        return "Hook";
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    if (
        p.includes("/context/") ||
        p.includes("/contexts/") ||
        p.includes("/store/") ||
        p.includes("/stores/")
    ) {
        return "State";
    }

    // -------------------------------------------------------------------------
    // Routes
    // -------------------------------------------------------------------------

    if (
        p.includes("/routes/") ||
        p.includes("/router/")
    ) {
        return "Route";
    }

    // -------------------------------------------------------------------------
    // Controllers
    // -------------------------------------------------------------------------

    if (
        p.includes("/controllers/") ||
        p.includes("/controller/")
    ) {
        return "Controller";
    }

    // -------------------------------------------------------------------------
    // Models / Schemas
    // -------------------------------------------------------------------------

    if (
        p.includes("/models/") ||
        p.includes("/model/") ||
        p.includes("/entities/") ||
        p.includes("/schemas/")
    ) {
        return "Model";
    }

    // -------------------------------------------------------------------------
    // Middleware
    // -------------------------------------------------------------------------

    if (
        p.includes("/middleware/") ||
        p.includes("/middlewares/")
    ) {
        return "Middleware";
    }

    // -------------------------------------------------------------------------
    // Services
    // -------------------------------------------------------------------------

    if (
        p.includes("/services/") ||
        p.includes("/service/")
    ) {
        return "Service";
    }

    // -------------------------------------------------------------------------
    // API
    // -------------------------------------------------------------------------

    if (
        p.includes("/api/") ||
        p.includes("/apis/")
    ) {
        return "API";
    }

    // -------------------------------------------------------------------------
    // Serverless
    // -------------------------------------------------------------------------

    if (
        p.includes("/functions/") ||
        p.includes("/lambda/") ||
        p.includes("/serverless/")
    ) {
        return "Function";
    }

    // -------------------------------------------------------------------------
    // Utils
    // -------------------------------------------------------------------------

    if (
        p.includes("/utils/") ||
        p.includes("/util/") ||
        p.includes("/helpers/") ||
        p.includes("/helper/")
    ) {
        return "Util";
    }

    // -------------------------------------------------------------------------
    // Config folder
    // -------------------------------------------------------------------------

    if (
        p.includes("/config/") ||
        p.includes("/configs/")
    ) {
        return "Config";
    }

    // -------------------------------------------------------------------------
    // Scripts / Tools
    // -------------------------------------------------------------------------

    if (
        p.includes("/scripts/") ||
        p.includes("/tools/")
    ) {
        return "Script";
    }

    // -------------------------------------------------------------------------
    // Assets
    // -------------------------------------------------------------------------

    if (
        p.includes("/assets/")
    ) {
        return "Asset";
    }

    // -------------------------------------------------------------------------
    // Documentation
    // -------------------------------------------------------------------------

    if (
        p.includes("/docs/") ||
        ext === ".md" ||
        ext === ".mdx" ||
        fileName === "readme.md" ||
        fileName === "changelog.md" ||
        fileName === "versioning.md" ||
        fileName === "agents.md"
    ) {
        return "Documentation";
    }

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------

    if (
        [
            ".css",
            ".scss",
            ".sass",
            ".less",
        ].includes(ext)
    ) {
        return "Style";
    }

    // -------------------------------------------------------------------------
    // Known config
    // -------------------------------------------------------------------------

    const knownConfigFiles = [
        "package.json",
        "tsconfig.json",
        "jsconfig.json",

        "vite.config.js",
        "vite.config.ts",
        "vite.config.mjs",

        "webpack.config.js",
        "webpack.config.ts",

        "next.config.js",
        "next.config.mjs",

        "nuxt.config.js",
        "nuxt.config.ts",

        "netlify.toml",
        "appwrite.json",

        ".env.example",

        "dockerfile",
    ];

    if (
        knownConfigFiles.includes(
            fileName
        ) ||
        [
            ".json",
            ".jsonc",
            ".yaml",
            ".yml",
            ".toml",
            ".xml",
        ].includes(ext)
    ) {
        return "Config";
    }

    // -------------------------------------------------------------------------
    // SQL
    // -------------------------------------------------------------------------

    if (ext === ".sql") {
        return "Database";
    }

    return "Source";
}

// =============================================================================
// WALK PROJECT
// =============================================================================

function walk(dir) {
    let entries;

    try {
        entries = fs.readdirSync(
            dir,
            {
                withFileTypes: true,
            }
        );
    } catch (error) {
        console.warn(
            `⚠️ Cannot read: ${dir}`
        );

        console.warn(
            `   ${error.message}`
        );

        return;
    }

    for (const entry of entries) {
        const fullPath =
            path.join(
                dir,
                entry.name
            );

        // ---------------------------------------------------------------------
        // Directory
        // ---------------------------------------------------------------------

        if (entry.isDirectory()) {
            if (
                isIgnoredDirectory(
                    entry.name
                )
            ) {
                continue;
            }

            walk(fullPath);
            continue;
        }

        // ---------------------------------------------------------------------
        // Non-file
        // ---------------------------------------------------------------------

        if (!entry.isFile()) {
            continue;
        }

        // ---------------------------------------------------------------------
        // Filter
        // ---------------------------------------------------------------------

        if (
            !shouldIncludeFile(
                entry.name
            )
        ) {
            continue;
        }

        const relPath =
            getRelativePath(fullPath);

        const record = {
            absPath: fullPath,
            relPath,

            fileName:
                entry.name,

            section:
                detectSection(
                    relPath
                ),

            category:
                detectCategory(
                    relPath
                ),

            extension:
                path.extname(
                    entry.name
                ).toLowerCase(),
        };

        allFiles.push(record);

        fileByNormalizedPath.set(
            normalizePath(fullPath),
            record
        );
    }
}

// =============================================================================
// READ FILE
// =============================================================================

function readTextFile(absPath) {
    try {
        return fs.readFileSync(
            absPath,
            "utf8"
        );
    } catch {
        return "";
    }
}

// =============================================================================
// DESCRIPTION EXTRACTION
// =============================================================================

function extractDescription(
    fileRecord
) {
    const content =
        readTextFile(
            fileRecord.absPath
        ).slice(0, 5000);

    if (!content) {
        return "_No description found._";
    }

    // -------------------------------------------------------------------------
    // JS block comment
    // -------------------------------------------------------------------------

    const blockComment =
        content.match(
            /\/\*\*?([\s\S]*?)\*\//
        );

    if (blockComment) {
        const description =
            blockComment[1]
                .split("\n")
                .map(line =>
                    line
                        .replace(
                            /^\s*\*\s?/,
                            ""
                        )
                        .trim()
                )
                .filter(Boolean)
                .join(" ");

        if (description) {
            return description.slice(
                0,
                CONFIG.maxDescriptionLength
            );
        }
    }

    // -------------------------------------------------------------------------
    // // comment
    // -------------------------------------------------------------------------

    const slashComment =
        content.match(
            /^\s*\/\/\s*(.+)$/m
        );

    if (slashComment) {
        return slashComment[1]
            .trim()
            .slice(
                0,
                CONFIG.maxDescriptionLength
            );
    }

    // -------------------------------------------------------------------------
    // # comment
    // -------------------------------------------------------------------------

    const hashComment =
        content.match(
            /^\s*#\s+(.+)$/m
        );

    if (hashComment) {
        return hashComment[1]
            .trim()
            .slice(
                0,
                CONFIG.maxDescriptionLength
            );
    }

    // -------------------------------------------------------------------------
    // Markdown
    // -------------------------------------------------------------------------

    if (
        fileRecord.extension === ".md" ||
        fileRecord.extension === ".mdx"
    ) {
        const lines =
            content.split(/\r?\n/);

        for (const line of lines) {
            const clean =
                line
                    .replace(
                        /^#+\s*/,
                        ""
                    )
                    .trim();

            if (
                clean &&
                clean !== "---"
            ) {
                return clean.slice(
                    0,
                    CONFIG.maxDescriptionLength
                );
            }
        }
    }

    return "_No description found._";
}

// =============================================================================
// SYMBOL EXTRACTION
// =============================================================================

function extractSymbols(
    fileRecord
) {
    const content =
        readTextFile(
            fileRecord.absPath
        );

    if (!content) {
        return [];
    }

    const ext =
        fileRecord.extension;

    if (
        ![
            ".js",
            ".jsx",
            ".mjs",
            ".cjs",
            ".ts",
            ".tsx",
        ].includes(ext)
    ) {
        return [];
    }

    const symbols = [];
    const seen = new Set();

    function addSymbol(
        name,
        type,
        index
    ) {
        if (!name) {
            return;
        }

        const key =
            `${type}:${name}`;

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        symbols.push({
            name,
            type,
            line:
                lineNumberAt(
                    content,
                    index
                ),
        });
    }

    const patterns = [
        // function hello() {}
        // export function hello() {}
        // export default function hello() {}
        {
            type: "function",
            regex:
                /\b(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
        },

        // class Example {}
        // export default class Example {}
        {
            type: "class",
            regex:
                /\b(?:export\s+(?:default\s+)?)?class\s+([A-Za-z_$][\w$]*)\b/g,
        },

        // const fn = () => {}
        // const fn = async () => {}
        // export const fn = () => {}
        {
            type: "function",
            regex:
                /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g,
        },

        // const fn = function() {}
        {
            type: "function",
            regex:
                /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g,
        },

        // exports.foo = function
        // exports.foo = async function
        {
            type: "exported-function",
            regex:
                /\bexports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g,
        },

        // module.exports.foo = function
        {
            type: "exported-function",
            regex:
                /\bmodule\.exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g,
        },
    ];

    for (
        const {
            type,
            regex,
        } of patterns
    ) {
        let match;

        while (
            (match =
                regex.exec(content)) !==
            null
        ) {
            addSymbol(
                match[1],
                type,
                match.index
            );
        }
    }

    return symbols.sort(
        (a, b) =>
            a.line - b.line
    );
}

// =============================================================================
// EXPRESS ROUTE EXTRACTION
// =============================================================================

function extractRoutes(
    fileRecord
) {
    const content =
        readTextFile(
            fileRecord.absPath
        );

    if (!content) {
        return [];
    }

    if (
        ![
            ".js",
            ".jsx",
            ".mjs",
            ".cjs",
            ".ts",
            ".tsx",
        ].includes(
            fileRecord.extension
        )
    ) {
        return [];
    }

    const routes = [];
    const seen = new Set();

    const routeRegex =
        /\b(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*["'`]([^"'`]+)["'`]/gi;

    let match;

    while (
        (match =
            routeRegex.exec(content)) !==
        null
    ) {
        const method =
            match[1].toUpperCase();

        const route =
            match[2];

        const key =
            `${method}:${route}`;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);

        routes.push({
            method,
            route,
            line:
                lineNumberAt(
                    content,
                    match.index
                ),
        });
    }

    return routes;
}

// =============================================================================
// IMPORT EXTRACTION
// =============================================================================

function parseImports(
    fileRecord
) {
    const content =
        readTextFile(
            fileRecord.absPath
        );

    if (!content) {
        return [];
    }

    const found = new Set();

    const ext =
        fileRecord.extension;

    // -------------------------------------------------------------------------
    // JS / TS / Vue / Svelte / Astro
    // -------------------------------------------------------------------------

    if (
        [
            ".js",
            ".jsx",
            ".mjs",
            ".cjs",
            ".ts",
            ".tsx",
            ".vue",
            ".svelte",
            ".astro",
        ].includes(ext)
    ) {
        const patterns = [
            // import X from "./x"
            /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,

            // export X from "./x"
            /export\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g,

            // require("./x")
            /require\s*\(\s*["']([^"']+)["']\s*\)/g,

            // import("./x")
            /import\s*\(\s*["']([^"']+)["']\s*\)/g,
        ];

        for (const regex of patterns) {
            let match;

            while (
                (match =
                    regex.exec(content)) !==
                null
            ) {
                found.add(
                    match[1]
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // CSS
    // -------------------------------------------------------------------------

    if (
        [
            ".css",
            ".scss",
            ".sass",
            ".less",
        ].includes(ext)
    ) {
        const cssImport =
            /@(?:import|use|forward)\s+(?:url\()?["']([^"']+)["']/g;

        let match;

        while (
            (match =
                cssImport.exec(content)) !==
            null
        ) {
            found.add(
                match[1]
            );
        }
    }

    return [...found];
}

// =============================================================================
// IMPORT RESOLUTION
// =============================================================================

function resolveImport(
    fromFile,
    importString
) {
    if (!importString) {
        return null;
    }

    // Ignore URLs.
    if (
        importString.startsWith(
            "http://"
        ) ||
        importString.startsWith(
            "https://"
        )
    ) {
        return null;
    }

    const isRelative =
        importString.startsWith(".");

    const isAtAlias =
        importString.startsWith("@/");

    const isTildeAlias =
        importString.startsWith("~/");

    // Ignore package imports:
    //
    // react
    // express
    // lucide-react
    //
    // unless project alias syntax is used.
    if (
        !isRelative &&
        !isAtAlias &&
        !isTildeAlias
    ) {
        return null;
    }

    const candidates = [];

    // -------------------------------------------------------------------------
    // @/foo or ~/foo
    // -------------------------------------------------------------------------

    if (
        isAtAlias ||
        isTildeAlias
    ) {
        const aliasPath =
            importString.slice(2);

        candidates.push(
            path.join(
                CONFIG.projectRoot,
                "src",
                aliasPath
            )
        );

        candidates.push(
            path.join(
                CONFIG.projectRoot,
                aliasPath
            )
        );
    }

    // -------------------------------------------------------------------------
    // ./foo or ../foo
    // -------------------------------------------------------------------------

    if (isRelative) {
        candidates.push(
            path.resolve(
                path.dirname(
                    fromFile.absPath
                ),
                importString
            )
        );
    }

    for (
        const candidate
        of candidates
    ) {
        const resolvedPath =
            tryExtensions(
                candidate
            );

        if (!resolvedPath) {
            continue;
        }

        const record =
            fileByNormalizedPath.get(
                normalizePath(
                    resolvedPath
                )
            );

        if (record) {
            return record;
        }
    }

    return null;
}

// =============================================================================
// EXTENSION RESOLUTION
// =============================================================================

function tryExtensions(base) {
    const candidates = [
        base,

        `${base}.js`,
        `${base}.jsx`,
        `${base}.mjs`,
        `${base}.cjs`,

        `${base}.ts`,
        `${base}.tsx`,

        `${base}.vue`,
        `${base}.svelte`,
        `${base}.astro`,

        `${base}.json`,

        `${base}.css`,
        `${base}.scss`,
        `${base}.sass`,
        `${base}.less`,

        path.join(
            base,
            "index.js"
        ),

        path.join(
            base,
            "index.jsx"
        ),

        path.join(
            base,
            "index.ts"
        ),

        path.join(
            base,
            "index.tsx"
        ),

        path.join(
            base,
            "index.vue"
        ),

        path.join(
            base,
            "index.svelte"
        ),
    ];

    for (
        const candidate
        of candidates
    ) {
        try {
            if (
                fs.existsSync(
                    candidate
                ) &&
                fs.statSync(
                    candidate
                ).isFile()
            ) {
                return candidate;
            }
        } catch {
            // Ignore inaccessible candidate.
        }
    }

    return null;
}

// =============================================================================
// DEPENDENCY MAP
// =============================================================================

function buildDependencyMap() {
    const dependencyMap =
        new Map();

    for (const file of allFiles) {
        const imports =
            parseImports(file);

        const resolved = [];

        for (
            const importString
            of imports
        ) {
            const dependency =
                resolveImport(
                    file,
                    importString
                );

            if (
                dependency &&
                normalizePath(
                    dependency.absPath
                ) !==
                normalizePath(
                    file.absPath
                )
            ) {
                resolved.push(
                    dependency
                );
            }
        }

        dependencyMap.set(
            file.absPath,
            uniqueByAbsPath(
                resolved
            )
        );
    }

    return dependencyMap;
}

// =============================================================================
// REVERSE DEPENDENCY MAP
// =============================================================================

function buildReverseDependencyMap(
    dependencyMap
) {
    const reverseMap =
        new Map();

    for (const file of allFiles) {
        reverseMap.set(
            file.absPath,
            []
        );
    }

    for (
        const [
            fromAbsPath,
            dependencies,
        ]
        of dependencyMap.entries()
    ) {
        const source =
            fileByNormalizedPath.get(
                normalizePath(
                    fromAbsPath
                )
            );

        if (!source) {
            continue;
        }

        for (
            const dependency
            of dependencies
        ) {
            const refs =
                reverseMap.get(
                    dependency.absPath
                ) || [];

            refs.push(source);

            reverseMap.set(
                dependency.absPath,
                refs
            );
        }
    }

    for (
        const [
            filePath,
            refs,
        ]
        of reverseMap.entries()
    ) {
        reverseMap.set(
            filePath,
            uniqueByAbsPath(
                refs
            )
        );
    }

    return reverseMap;
}

// =============================================================================
// OBSIDIAN PATHS
// =============================================================================

function getNoteRelativePath(
    fileRecord
) {
    return toPosix(
        path.join(
            "files",
            `${fileRecord.relPath}.md`
        )
    );
}

function getWikiTarget(
    fileRecord
) {
    return toPosix(
        path.join(
            "files",
            fileRecord.relPath
        )
    );
}

// =============================================================================
// DETAILED FILE NOTE
// =============================================================================

function generateNote(
    fileRecord,
    dependencies,
    referencedBy
) {
    const description =
        extractDescription(
            fileRecord
        );

    const symbols =
        extractSymbols(
            fileRecord
        );

    const routes =
        extractRoutes(
            fileRecord
        );

    const dependencySection =
        dependencies.length
            ? dependencies
                .sort(
                    (a, b) =>
                        a.relPath.localeCompare(
                            b.relPath
                        )
                )
                .map(
                    dependency =>
                        `- [[${getWikiTarget(
                            dependency
                        )}|${dependency.relPath}]]`
                )
                .join("\n")
            : "_No resolved internal dependencies._";

    const referencedBySection =
        referencedBy.length
            ? referencedBy
                .sort(
                    (a, b) =>
                        a.relPath.localeCompare(
                            b.relPath
                        )
                )
                .map(
                    reference =>
                        `- [[${getWikiTarget(
                            reference
                        )}|${reference.relPath}]]`
                )
                .join("\n")
            : "_No mapped files reference this file._";

    const symbolSection =
        symbols.length
            ? symbols
                .map(
                    symbol =>
                        `- \`${symbol.name}\` — ${symbol.type} — line ${symbol.line}`
                )
                .join("\n")
            : "_No indexed JS/TS symbols._";

    const routeSection =
        routes.length
            ? routes
                .map(
                    route =>
                        `- \`${route.method} ${route.route}\` — line ${route.line}`
                )
                .join("\n")
            : "_No indexed Express routes._";

    const tags = [
        "codebase",
        `section-${slug(
            fileRecord.section
        )}`,
        slug(
            fileRecord.category
        ),
    ];

    return `---
tags:
${tags
            .map(
                tag => `  - ${tag}`
            )
            .join("\n")}
section: "${escapeYaml(
                fileRecord.section
            )}"
category: "${escapeYaml(
                fileRecord.category
            )}"
source: "${escapeYaml(
                fileRecord.relPath
            )}"
extension: "${escapeYaml(
                fileRecord.extension ||
                "none"
            )}"
generated: true
---

# ${fileRecord.fileName}

> ${description}

## File info

| Property | Value |
|---|---|
| Section | \`${fileRecord.section}\` |
| Category | \`${fileRecord.category}\` |
| Path | \`${fileRecord.relPath}\` |
| Extension | \`${fileRecord.extension || "none"}\` |

## Symbols

${symbolSection}

## Routes

${routeSection}

## Imports / dependencies

${dependencySection}

## Referenced by

${referencedBySection}

## Source location

\`${fileRecord.relPath}\`

> This note is generated. Verify real source behavior before editing.
`;
}

// =============================================================================
// SYMBOL INDEX
// =============================================================================

function generateSymbolIndex() {
    const symbolIndex = {};

    for (const file of allFiles) {
        const symbols =
            extractSymbols(file);

        for (
            const symbol
            of symbols
        ) {
            if (
                !symbolIndex[
                symbol.name
                ]
            ) {
                symbolIndex[
                    symbol.name
                ] = [];
            }

            symbolIndex[
                symbol.name
            ].push({
                path:
                    file.relPath,

                type:
                    symbol.type,

                line:
                    symbol.line,

                category:
                    file.category,

                section:
                    file.section,
            });
        }
    }

    // Sort keys for stable output.
    const sorted = {};

    for (
        const key
        of Object.keys(
            symbolIndex
        ).sort(
            (a, b) =>
                a.localeCompare(b)
        )
    ) {
        sorted[key] =
            symbolIndex[key];
    }

    return sorted;
}

// =============================================================================
// AI FILE LIST
// =============================================================================

function generateAIFileList() {
    return allFiles
        .map(
            file =>
                file.relPath
        )
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
        .join("\n") +
        "\n";
}

// =============================================================================
// AI MAP
// =============================================================================

function generateAIMap(
    dependencyMap,
    reverseMap
) {
    const git =
        getGitInfo();

    const projectName =
        path.basename(
            CONFIG.projectRoot
        );

    let content = `# AI Codebase Map

> **READ THIS FIRST BEFORE REPOSITORY-WIDE SEARCHING.**

This file is generated locally by \`generate-vault.cjs\`.

Its purpose is to help coding agents locate relevant implementation files without repeatedly scanning the entire repository.

## Map Metadata

| Property | Value |
|---|---|
| Project | \`${projectName}\` |
| Branch | \`${git.branch}\` |
| Commit | \`${git.commit}\` |
| Working tree dirty | \`${git.dirty}\` |
| Generated | \`${new Date().toISOString()}\` |
| Files mapped | ${allFiles.length} |

## Agent Navigation Rules

Use this order:

1. Read \`AI_MAP.md\`.
2. If the task names a function/class, search \`AI_SYMBOLS.json\`.
3. Use \`AI_FILES.txt\` for exact path discovery.
4. Open the relevant detailed note under \`files/\` only if useful.
5. Open the actual source file to verify behavior or make changes.
6. Follow direct dependencies/references from the map.
7. Use repository-wide search only when the map is missing, stale, ambiguous, or source behavior contradicts it.

Do **not** assume this generated map is the final implementation truth.

Before changing code, verify important behavior in the real source file.

After significant code changes, regenerate with:

\`\`\`powershell
node .\\generate-vault.cjs
\`\`\`

---

# Repository Map

`;

    const sections = {};

    for (const file of allFiles) {
        if (
            !sections[
            file.section
            ]
        ) {
            sections[
                file.section
            ] = [];
        }

        sections[
            file.section
        ].push(file);
    }

    for (
        const section
        of Object.keys(
            sections
        ).sort(
            (a, b) =>
                a.localeCompare(b)
        )
    ) {
        content +=
            `## ${section}\n\n`;

        const files =
            sections[
                section
            ].sort(
                (a, b) =>
                    a.relPath.localeCompare(
                        b.relPath
                    )
            );

        for (const file of files) {
            const description =
                extractDescription(
                    file
                );

            const symbols =
                extractSymbols(
                    file
                );

            const routes =
                extractRoutes(
                    file
                );

            const dependencies =
                dependencyMap.get(
                    file.absPath
                ) || [];

            const referencedBy =
                reverseMap.get(
                    file.absPath
                ) || [];

            content +=
                `### \`${file.relPath}\`\n`;

            content +=
                `- Category: ${file.category}\n`;

            if (
                description &&
                description !==
                "_No description found._"
            ) {
                content +=
                    `- Purpose hint: ${description}\n`;
            }

            if (symbols.length) {
                const compactSymbols =
                    symbols
                        .slice(0, 30)
                        .map(
                            symbol =>
                                `${symbol.name}@${symbol.line}`
                        )
                        .join(", ");

                content +=
                    `- Symbols: ${compactSymbols}`;

                if (
                    symbols.length > 30
                ) {
                    content +=
                        `, +${symbols.length - 30} more`;
                }

                content += "\n";
            }

            if (routes.length) {
                const compactRoutes =
                    routes
                        .map(
                            route =>
                                `${route.method} ${route.route}@${route.line}`
                        )
                        .join(", ");

                content +=
                    `- Routes: ${compactRoutes}\n`;
            }

            if (
                dependencies.length
            ) {
                content +=
                    `- Depends on: ${dependencies
                        .map(
                            dependency =>
                                `\`${dependency.relPath}\``
                        )
                        .join(", ")}\n`;
            }

            if (
                referencedBy.length
            ) {
                content +=
                    `- Referenced by: ${referencedBy
                        .map(
                            reference =>
                                `\`${reference.relPath}\``
                        )
                        .join(", ")}\n`;
            }

            content += "\n";
        }
    }

    return content;
}

// =============================================================================
// MAP METADATA
// =============================================================================

function generateMapMeta() {
    const git =
        getGitInfo();

    return {
        project:
            path.basename(
                CONFIG.projectRoot
            ),

        root:
            CONFIG.projectRoot,

        generatedAt:
            new Date()
                .toISOString(),

        git: {
            branch:
                git.branch,

            commit:
                git.commit,

            fullCommit:
                git.fullCommit,

            dirty:
                git.dirty,
        },

        filesMapped:
            allFiles.length,

        outputDirectory:
            CONFIG.outputDir,

        primaryAIMap:
            "AI_MAP.md",

        symbolIndex:
            "AI_SYMBOLS.json",

        compactFileList:
            "AI_FILES.txt",

        regenerateCommand:
            "node .\\generate-vault.cjs",
    };
}

// =============================================================================
// FULL INDEX
// =============================================================================

function generateIndex() {
    const bySection = {};

    for (const file of allFiles) {
        if (
            !bySection[
            file.section
            ]
        ) {
            bySection[
                file.section
            ] = [];
        }

        bySection[
            file.section
        ].push(file);
    }

    let content = `# Project Codebase Index

> Automatically generated by \`generate-vault.cjs\`.

**Project:** \`${path.basename(
        CONFIG.projectRoot
    )}\`

**Total mapped files:** ${allFiles.length}

For AI coding agents, prefer [[AI_MAP]] first.

---

`;

    const sections =
        Object.keys(
            bySection
        ).sort(
            (a, b) =>
                a.localeCompare(b)
        );

    for (
        const section
        of sections
    ) {
        const sectionFiles =
            bySection[
            section
            ];

        content +=
            `# ${section}\n\n`;

        content +=
            `**Files:** ${sectionFiles.length}\n\n`;

        const categories = {};

        for (
            const file
            of sectionFiles
        ) {
            if (
                !categories[
                file.category
                ]
            ) {
                categories[
                    file.category
                ] = [];
            }

            categories[
                file.category
            ].push(file);
        }

        for (
            const category
            of Object.keys(
                categories
            ).sort(
                (a, b) =>
                    a.localeCompare(b)
            )
        ) {
            const categoryFiles =
                categories[
                    category
                ].sort(
                    (a, b) =>
                        a.relPath.localeCompare(
                            b.relPath
                        )
                );

            content +=
                `## ${category} (${categoryFiles.length})\n\n`;

            for (
                const file
                of categoryFiles
            ) {
                content +=
                    `- [[${getWikiTarget(
                        file
                    )}|${file.relPath}]]\n`;
            }

            content += "\n";
        }
    }

    return content;
}

// =============================================================================
// HOME
// =============================================================================

function generateHome(
    dependencyMap
) {
    const projectName =
        path.basename(
            CONFIG.projectRoot
        );

    const git =
        getGitInfo();

    const sectionStats = {};
    const categoryStats = {};

    for (const file of allFiles) {
        sectionStats[
            file.section
        ] =
            (
                sectionStats[
                file.section
                ] || 0
            ) + 1;

        categoryStats[
            file.category
        ] =
            (
                categoryStats[
                file.category
                ] || 0
            ) + 1;
    }

    let dependencyCount = 0;

    for (
        const dependencies
        of dependencyMap.values()
    ) {
        dependencyCount +=
            dependencies.length;
    }

    let sectionRows = "";

    for (
        const [
            section,
            count,
        ]
        of Object.entries(
            sectionStats
        ).sort()
    ) {
        sectionRows +=
            `| ${section} | ${count} |\n`;
    }

    let categoryRows = "";

    for (
        const [
            category,
            count,
        ]
        of Object.entries(
            categoryStats
        ).sort()
    ) {
        categoryRows +=
            `| ${category} | ${count} |\n`;
    }

    return `# ${projectName} — Codebase Knowledge Map

> Generated ${new Date().toLocaleString()}

## Start Here

### For AI coding agents

Read:

- [[AI_MAP]]
- \`AI_SYMBOLS.json\`
- \`MAP_META.json\`
- \`AI_FILES.txt\`

Do not start with a full repository scan when the map already contains the location you need.

### For humans

- [[_INDEX|Full Project Index]]
- Press \`Ctrl + G\` for Obsidian Graph View

---

## Repository

\`${CONFIG.projectRoot}\`

## Git

| Property | Value |
|---|---|
| Branch | \`${git.branch}\` |
| Commit | \`${git.commit}\` |
| Dirty working tree | \`${git.dirty}\` |

## Statistics

| Property | Count |
|---|---:|
| Files mapped | ${allFiles.length} |
| Internal dependency links | ${dependencyCount} |
| Top-level sections | ${Object.keys(sectionStats).length} |
| Categories | ${Object.keys(categoryStats).length} |

## Project sections

| Section | Files |
|---|---:|
${sectionRows}

## File categories

| Category | Files |
|---|---:|
${categoryRows}

## Generated Knowledge Files

\`\`\`text
AI_MAP.md
AI_SYMBOLS.json
MAP_META.json
AI_FILES.txt
_INDEX.md
graph.json
files/
\`\`\`

## Refresh

From the project root:

\`\`\`powershell
node .\\generate-vault.cjs
\`\`\`

The generated vault will be replaced.

## Output

\`\`\`text
temp files/obsidian-vault
\`\`\`
`;
}

// =============================================================================
// GRAPH JSON
// =============================================================================

function generateGraph(
    dependencyMap
) {
    const nodes =
        allFiles.map(
            file => ({
                id:
                    file.relPath,

                label:
                    file.fileName,

                section:
                    file.section,

                category:
                    file.category,

                path:
                    file.relPath,
            })
        );

    const edges = [];

    for (
        const [
            sourcePath,
            dependencies,
        ]
        of dependencyMap.entries()
    ) {
        const source =
            fileByNormalizedPath.get(
                normalizePath(
                    sourcePath
                )
            );

        if (!source) {
            continue;
        }

        for (
            const dependency
            of dependencies
        ) {
            edges.push({
                from:
                    source.relPath,

                to:
                    dependency.relPath,
            });
        }
    }

    return {
        project:
            path.basename(
                CONFIG.projectRoot
            ),

        root:
            CONFIG.projectRoot,

        generatedAt:
            new Date()
                .toISOString(),

        stats: {
            nodes:
                nodes.length,

            edges:
                edges.length,
        },

        nodes,
        edges,
    };
}

// =============================================================================
// WRITE DETAILED NOTES
// =============================================================================

function writeFileNotes(
    dependencyMap,
    reverseMap
) {
    for (const file of allFiles) {
        const dependencies =
            dependencyMap.get(
                file.absPath
            ) || [];

        const referencedBy =
            reverseMap.get(
                file.absPath
            ) || [];

        const markdown =
            generateNote(
                file,
                dependencies,
                referencedBy
            );

        const noteRelativePath =
            getNoteRelativePath(
                file
            );

        const outputPath =
            path.join(
                CONFIG.outputDir,
                noteRelativePath
            );

        fs.mkdirSync(
            path.dirname(
                outputPath
            ),
            {
                recursive: true,
            }
        );

        fs.writeFileSync(
            outputPath,
            markdown,
            "utf8"
        );
    }
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
    console.log("");
    console.log(
        "🗺️  Universal Codebase → AI / Obsidian Mapper"
    );

    console.log(
        "============================================================"
    );

    console.log("");
    console.log(
        "📁 Project root:"
    );
    console.log(
        `   ${CONFIG.projectRoot}`
    );

    console.log("");
    console.log(
        "📦 Output vault:"
    );
    console.log(
        `   ${CONFIG.outputDir}`
    );

    console.log("");

    // -------------------------------------------------------------------------
    // Validate root
    // -------------------------------------------------------------------------

    if (
        !fs.existsSync(
            CONFIG.projectRoot
        )
    ) {
        console.error(
            "❌ Project directory does not exist."
        );

        console.error(
            CONFIG.projectRoot
        );

        process.exit(1);
    }

    // Reset state in case the script is ever reused programmatically.
    allFiles = [];
    fileByNormalizedPath.clear();

    // -------------------------------------------------------------------------
    // Remove old generated output
    // -------------------------------------------------------------------------

    console.log(
        "🧹 Removing old generated vault..."
    );

    fs.rmSync(
        CONFIG.outputDir,
        {
            recursive: true,
            force: true,
        }
    );

    // -------------------------------------------------------------------------
    // Scan
    // -------------------------------------------------------------------------

    console.log(
        "🔍 Scanning project..."
    );

    walk(
        CONFIG.projectRoot
    );

    allFiles.sort(
        (a, b) =>
            a.relPath.localeCompare(
                b.relPath
            )
    );

    console.log(
        `✅ Found ${allFiles.length} mappable files.`
    );

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    console.log(
        "🔗 Resolving internal dependencies..."
    );

    const dependencyMap =
        buildDependencyMap();

    const reverseMap =
        buildReverseDependencyMap(
            dependencyMap
        );

    // -------------------------------------------------------------------------
    // Output folder
    // -------------------------------------------------------------------------

    console.log(
        "📁 Creating generated vault..."
    );

    fs.mkdirSync(
        CONFIG.outputDir,
        {
            recursive: true,
        }
    );

    // -------------------------------------------------------------------------
    // AI MAP
    // -------------------------------------------------------------------------

    console.log(
        "🧠 Generating AI_MAP.md..."
    );

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "AI_MAP.md"
        ),
        generateAIMap(
            dependencyMap,
            reverseMap
        ),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // SYMBOL INDEX
    // -------------------------------------------------------------------------

    console.log(
        "🔎 Generating AI_SYMBOLS.json..."
    );

    const symbolIndex =
        generateSymbolIndex();

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "AI_SYMBOLS.json"
        ),
        JSON.stringify(
            symbolIndex,
            null,
            2
        ),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // MAP METADATA
    // -------------------------------------------------------------------------

    console.log(
        "🏷️  Generating MAP_META.json..."
    );

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "MAP_META.json"
        ),
        JSON.stringify(
            generateMapMeta(),
            null,
            2
        ),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // COMPACT FILE LIST
    // -------------------------------------------------------------------------

    console.log(
        "📋 Generating AI_FILES.txt..."
    );

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "AI_FILES.txt"
        ),
        generateAIFileList(),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // Detailed per-file notes
    // -------------------------------------------------------------------------

    console.log(
        "📝 Generating detailed file notes..."
    );

    writeFileNotes(
        dependencyMap,
        reverseMap
    );

    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "_INDEX.md"
        ),
        generateIndex(),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // Home
    // -------------------------------------------------------------------------

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "HOME.md"
        ),
        generateHome(
            dependencyMap
        ),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // Graph
    // -------------------------------------------------------------------------

    const graph =
        generateGraph(
            dependencyMap
        );

    fs.writeFileSync(
        path.join(
            CONFIG.outputDir,
            "graph.json"
        ),
        JSON.stringify(
            graph,
            null,
            2
        ),
        "utf8"
    );

    // -------------------------------------------------------------------------
    // Finished
    // -------------------------------------------------------------------------

    const git =
        getGitInfo();

    console.log("");
    console.log(
        "============================================================"
    );

    console.log(
        "✅ CODEBASE KNOWLEDGE MAP COMPLETE"
    );

    console.log(
        "============================================================"
    );

    console.log("");

    console.log(
        `📄 Files mapped: ${graph.stats.nodes}`
    );

    console.log(
        `🔗 Dependency links: ${graph.stats.edges}`
    );

    console.log(
        `🧠 Indexed symbols: ${Object.keys(symbolIndex).length}`
    );

    console.log(
        `🌿 Git branch: ${git.branch}`
    );

    console.log(
        `🔖 Git commit: ${git.commit}`
    );

    console.log(
        `✏️  Working tree dirty: ${git.dirty}`
    );

    console.log("");

    console.log(
        "📂 Generated at:"
    );

    console.log(
        `   ${CONFIG.outputDir}`
    );

    console.log("");

    console.log(
        "🤖 AI agent should read FIRST:"
    );

    console.log(
        `   ${path.join(CONFIG.outputDir, "AI_MAP.md")}`
    );

    console.log("");

    console.log(
        "🔎 Exact symbol lookup:"
    );

    console.log(
        `   ${path.join(CONFIG.outputDir, "AI_SYMBOLS.json")}`
    );

    console.log("");

    console.log(
        "📌 Obsidian:"
    );

    console.log(
        "   1. Open Obsidian"
    );

    console.log(
        "   2. Open folder as vault"
    );

    console.log(
        `   3. Select: ${CONFIG.outputDir}`
    );

    console.log(
        "   4. Open HOME.md"
    );

    console.log(
        "   5. Press Ctrl+G for Graph View"
    );

    console.log("");
}

// =============================================================================
// RUN
// =============================================================================

main();