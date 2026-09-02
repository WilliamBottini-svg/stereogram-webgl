import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

/*
 * webpage-templates replaces `ejs.resolveInclude` with an identity function so it can
 * track which components a page uses. EJS, however, strips the leading "/" from absolute
 * include paths before calling `resolveInclude` and relies on it to re-root them, so on
 * Linux/macOS every `#include('/abs/path')` came back as `abs/path` and the build failed
 * with ENOENT. (Windows paths start with a drive letter and are unaffected, which is why
 * the upstream project never hit this.) Re-root the path here, then hand it to the
 * webpage-templates resolver so component tracking keeps working.
 */
{
    // Resolve the very ejs instance webpage-templates loaded, so the patch applies to it.
    const ejs = require(
        require.resolve("ejs", { paths: [path.dirname(require.resolve("webpage-templates"))] })
    ) as { resolveInclude: (name: string, filename: string, isDir?: boolean) => string };
    const templatesResolveInclude = ejs.resolveInclude;
    ejs.resolveInclude = (name: string, filename: string, isDir?: boolean): string => {
        const rooted =
            isDir && filename && !path.isAbsolute(name) ? path.resolve(filename, name) : name;
        return templatesResolveInclude(rooted, filename, isDir);
    };
}

/** Repository metadata for this fork, read from package.json so it is defined once. */
const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
) as { homepage: string; repository: string; version: string };
const FORK_HOMEPAGE = packageJson.homepage.replace(/\/?$/, "/");
const FORK_REPO_SLUG = packageJson.repository.replace(/^github:/, ""); // owner/repo
const FORK_REPO_URL = `https://github.com/${FORK_REPO_SLUG}`;
const FORK_BLOB_BASE = `${FORK_REPO_URL}/blob/main/`;
const FORK_RAW_BASE = `${FORK_REPO_URL}/raw/main`;
/* webpage-templates hardcodes its author's GitHub account when building the readme page. */
const UPSTREAM_USER = "piellardj";

const data = {
    title: "Stereogram",
    description: "Stereogram (aka Magic Eye) online generator running on GPU with WebGL.",
    introduction: [
        "An autostereogram (also known as Magic Eye) is a 2D image designed to create the illusion of 3D. In each image, there is a 3D object that can only be viewed by looking at the image a certain way, as if the screen was transparent and you looked at the wall behind it. It gets easier with practice.",
        "Autostereograms were very popular in the '90s. They take advantage of stereopsis: the brain tries to reconstruct depth by combining the two slightly different images perceived by each eye.",
        "In this project, you can use your own depth map, customize the tiles as well as the way the image is computed. It all runs on GPU and can also handle live moving scenes in real time.",
    ],
    githubProjectName: "stereogram-webgl",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "main",
    },
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: ["script/gl-matrix-2.5.1-min.js", "script/main.min.js"],
    indicators: [
        {
            id: "fps-indicator",
            label: "FPS",
        },
        {
            id: "stripes-count-indicator",
            label: "Stripes count",
        },
        {
            id: "tilesize-indicator",
            label: "Tile size",
        },
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true,
    },
    controlsSections: [
        {
            title: "Depth map",
            controls: [
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show greyscale",
                    id: "show-heightmap-checkbox-id",
                    checked: false,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Depth",
                    id: "depth-range-id",
                    min: 0,
                    max: 1,
                    value: 1,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Invert",
                    id: "invert-heightmap-checkbox-id",
                    checked: false,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Mode",
                    id: "heightmap-mode-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Still",
                            value: "still",
                            checked: true,
                        },
                        {
                            label: "Moving",
                            value: "moving",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Select,
                    title: "Preset",
                    id: "heightmap-preset-select-id",
                    placeholder: "Custom",
                    options: [
                        {
                            value: "planet.png",
                            label: "Planet",
                            checked: true,
                        },
                        {
                            value: "bumps.png",
                            label: "Bumps",
                        },
                        {
                            value: "smile.png",
                            label: "Smile",
                        },
                        {
                            value: "hand.png",
                            label: "Hand",
                        },
                        {
                            value: "ripple.png",
                            label: "Ripple",
                        },
                        {
                            value: "head.png",
                            label: "Head",
                        },
                        {
                            value: "atomium.png",
                            label: "Atomium",
                        },
                        {
                            value: "car.png",
                            label: "Car",
                        },
                        {
                            value: "dolphin.png",
                            label: "Dolphin",
                        },
                        {
                            value: "tree.png",
                            label: "Tree",
                        },
                        {
                            value: "ship.png",
                            label: "Ship",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Select,
                    title: "Preset",
                    id: "model-preset-select-id",
                    placeholder: "Custom",
                    options: [
                        {
                            value: "primitives",
                            label: "Primitives",
                            checked: true,
                        },
                        {
                            value: "cube",
                            label: "Cube",
                        },
                        {
                            value: "monkey",
                            label: "Monkey",
                        },
                        {
                            value: "bunny",
                            label: "Bunny",
                        },
                        {
                            value: "atomium",
                            label: "Atomium",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.FileUpload,
                    title: "Custom",
                    id: "input-heightmap-upload-button",
                    accept: [".png", ".jpg", ".bmp", ".webp"],
                    defaultMessage: "Upload a depth map",
                },
            ],
        },
        {
            title: "Tile",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Mode",
                    id: "tile-mode-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Texture",
                            value: "texture",
                            checked: true,
                        },
                        {
                            label: "Noise",
                            value: "noise",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Select,
                    title: "Preset",
                    id: "tile-preset-select-id",
                    placeholder: "Custom",
                    options: [
                        {
                            value: "wallpaper.png",
                            label: "Wallpaper",
                        },

                        {
                            value: "space.png",
                            label: "Space",
                            checked: true,
                        },
                        {
                            value: "foliage.png",
                            label: "Foliage",
                        },
                        {
                            value: "giraffe.png",
                            label: "Giraffe",
                        },
                        {
                            value: "stones.png",
                            label: "Stones",
                        },
                        {
                            value: "leaves.png",
                            label: "Leaves",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Resolution",
                    id: "tile-noise-resolution-range-id",
                    min: 8,
                    max: 64,
                    value: 16,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Square",
                    id: "tile-noise-square-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Colored",
                    id: "tile-noise-colored-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.FileUpload,
                    title: "Custom",
                    id: "input-tile-upload-button",
                    accept: [".png", ".jpg", ".bmp", ".webp"],
                    defaultMessage: "Upload a pattern",
                },
            ],
        },
        {
            title: "Pattern placement",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Offset X",
                    id: "tile-pattern-offset-x-range-id",
                    min: -0.5,
                    max: 0.5,
                    value: 0,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Offset Y",
                    id: "tile-pattern-offset-y-range-id",
                    min: -0.5,
                    max: 0.5,
                    value: 0,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zoom",
                    id: "tile-pattern-zoom-range-id",
                    min: 0.25,
                    max: 4,
                    value: 1,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Repeat scale X",
                    id: "tile-pattern-repeat-x-range-id",
                    min: 0.5,
                    max: 2,
                    value: 1,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Repeat scale Y",
                    id: "tile-pattern-repeat-y-range-id",
                    min: 0.5,
                    max: 2,
                    value: 1,
                    step: 0.01,
                },
            ],
        },
        {
            title: "Pattern crop",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Left",
                    id: "tile-crop-min-u-range-id",
                    min: 0,
                    max: 1,
                    value: 0,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Right",
                    id: "tile-crop-max-u-range-id",
                    min: 0,
                    max: 1,
                    value: 1,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Top",
                    id: "tile-crop-min-v-range-id",
                    min: 0,
                    max: 1,
                    value: 0,
                    step: 0.01,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Bottom",
                    id: "tile-crop-max-v-range-id",
                    min: 0,
                    max: 1,
                    value: 1,
                    step: 0.01,
                },
            ],
        },
        {
            title: "Stripes",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Main stripe",
                    id: "main-stripe-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "left",
                            label: "Left",
                        },
                        {
                            value: "middle",
                            label: "Middle (beta)",
                            checked: true,
                        },
                        {
                            value: "right",
                            label: "Right",
                        },
                        {
                            value: "custom",
                            label: "Custom",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Custom position",
                    id: "main-stripe-custom-range-id",
                    min: 0,
                    max: 1000,
                    value: 500,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Mode",
                    id: "stripes-mode-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "adaptative",
                            label: "Adaptative",
                            checked: true,
                        },
                        {
                            value: "fixed",
                            label: "Fixed",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Stripes width",
                    id: "stripes-width-range-id",
                    min: 20,
                    max: 200,
                    value: 80,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Stripes count",
                    id: "stripes-count-range-id",
                    min: 8,
                    max: 24,
                    value: 16,
                    step: 1,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show UV",
                    id: "show-uv-checkbox-id",
                    checked: false,
                },
            ],
        },
        {
            title: "Output",
            controls: [
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show indicators",
                    id: "show-indicators-checkbox-id",
                    checked: false,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Fullscreen preview",
                    id: "preview-fit-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Square",
                            value: "square",
                            checked: true,
                        },
                        {
                            label: "Fill screen",
                            value: "fill",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Use browser fullscreen",
                    id: "browser-fullscreen-preview-checkbox-id",
                    checked: false,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Download size",
                    id: "download-size-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "1024",
                            label: "1024",
                        },
                        {
                            value: "2048",
                            label: "2048",
                            checked: true,
                        },
                        {
                            value: "4096",
                            label: "4096",
                        },
                    ],
                },
                {
                    type: Demopage.supportedControls.FileDownload,
                    id: "image-download-id",
                    label: "Download image",
                },
            ],
        },
    ],
};

/**
 * Demopage / webpage-templates hardcodes the header (home), intro copy, "project links" and a
 * footer with its author's personal contact badges in EJS. We strip those from the main demo
 * page, point the footer at this fork's repository, and add clear text attribution to the
 * original author.
 */
const ORIGINAL_AUTHOR_ATTRIBUTION_HTML = `    <p class="page-attribution">Original project by <a href="https://github.com/piellardj" rel="noopener noreferrer">Jérémie Piellard</a> · <a href="https://piellardj.github.io" rel="noopener noreferrer">Website</a> · <a href="https://github.com/piellardj/stereogram-webgl" rel="noopener noreferrer">Source</a></p>
`;

const FORK_BADGE_SHELF_HTML = `      <div class="badge-shelf">
        <a class="badge" href="${FORK_REPO_URL}" title="Source code on GitHub" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 1024 1024">
            <path d="M512 0C229 0 0 229 0 512c0 226 147 418 350 486 26 5 35-11 35-25 0-12 0-53-1-95C242 909 212 818 212 818c-23-59-57-75-57-75-47-32 4-31 4-31 51 4 78 53 78 53 46 78 120 56 149 43 5-33 18-56 33-68C305 725 185 682 185 485c0-56 20-102 53-137-5-13-23-65 5-136 0 0 43-14 141 53 41-11 85-17 128-17 44 0 87 6 128 17 98-66 141-52 141-52 28 71 10 123 5 136 33 36 53 81 53 137 0 197-120 240-234 253 18 16 35 47 35 95 0 68-1 124-1 141 0 14 9 30 35 25C877 930 1024 738 1024 512 1024 229 795 0 512 0z" />
          </svg>
        </a>
      </div>
`;

const ORIGINAL_AUTHOR_ATTRIBUTION_CSS = `
.page-attribution{margin-top:12px;font-size:14px;line-height:1.4;color:#5e5e5e;color:var(--var-color-block-actionitem,#5e5e5e)}.page-attribution a{color:inherit;text-decoration:underline}.page-attribution a:hover{color:#7e7e7e;color:var(--var-color-block-actionitem-hover,#7e7e7e)}
`;

/**
 * Extra <head> content for the app page that the demopage template cannot express:
 * the redesigned stylesheet, a theme-color that matches it, and the no-flash theme
 * bootstrap (see `src/ts/theme.ts`). Previously these were pasted into docs/index.html by
 * hand after each build, so a plain `npm run build` silently shipped the un-themed page.
 */
function appHeadExtrasHtml(version: string): string {
    return [
        `    <meta name="theme-color" content="#f7f7f9">`,
        `    <link rel="stylesheet" type="text/css" href="css/custom.css?v=${version}">`,
        `    <script>`,
        `      // No-flash theme bootstrap: set data-theme before any styles paint.`,
        `      (function () {`,
        `        try {`,
        `          var stored = localStorage.getItem("stereogram-theme");`,
        `          var theme = stored === "dark" || stored === "light"`,
        `            ? stored`,
        `            : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");`,
        `          document.documentElement.dataset.theme = theme;`,
        `          var meta = document.querySelector('meta[name="theme-color"]');`,
        `          if (meta) meta.content = theme === "dark" ? "#0f1115" : "#f7f7f9";`,
        `        } catch (e) { /* ignore */ }`,
        `      })();`,
        `    </script>`,
        "",
    ].join("\n");
}

/** Social-sharing metadata; the app is built around shareable links, so make them unfurl nicely. */
function socialMetaHtml(pageUrl: string): string {
    const image = `${FORK_RAW_BASE}/src/readme/preview_planet.jpg`;
    return [
        `    <meta property="og:type" content="website">`,
        `    <meta property="og:title" content="${data.title}">`,
        `    <meta property="og:description" content="${data.description}">`,
        `    <meta property="og:url" content="${pageUrl}">`,
        `    <meta property="og:image" content="${image}">`,
        `    <meta name="twitter:card" content="summary_large_image">`,
        "",
    ].join("\n");
}

function patchGeneratedHtml(
    filepath: string,
    options: {
        pageUrl: string;
        stripProjectLinks: boolean;
        stripHeaderAndIntro?: boolean;
        appHead?: boolean;
    }
): void {
    let html = fs.readFileSync(filepath, "utf8");
    // `description` contains a nested `project-links` div; strip that first so intro removal can match cleanly.
    if (options.stripProjectLinks) {
        html = html.replace(/\s*<br>\s*\n\s*<div class="project-links">[\s\S]*?<\/div>/, "");
    }
    if (options.stripHeaderAndIntro) {
        html = html.replace(/<header>[\s\S]*?<\/header>\s*/, "");
        html = html.replace(
            /<div class="intro">\s*<h1>[\s\S]*?<\/h1>\s*<div class="description">[\s\S]*?<\/div>\s*<\/div>\s*/,
            ""
        );
    }
    if (options.appHead && html.indexOf("css/custom.css") === -1) {
        html = html.replace(
            /^(\s*<link rel="stylesheet"[^>]*href="css\/page\.css\?v=([^"]+)"[^>]*>)\n/m,
            (match: string, link: string, version: string) =>
                `${link}\n${appHeadExtrasHtml(version)}`
        );
    }
    if (html.indexOf("og:title") === -1) {
        html = html.replace(/^\s*<\/head>/m, `${socialMetaHtml(options.pageUrl)}  </head>`);
    }
    // The template footer carries the upstream author's e-mail / LinkedIn badges; replace it
    // with a link to this repository and keep an explicit attribution line underneath.
    html = html.replace(
        /^\s*<div class="badge-shelf">[\s\S]*?<\/div>\s*$/m,
        FORK_BADGE_SHELF_HTML.trimEnd()
    );
    if (html.indexOf("page-attribution") === -1) {
        html = html.replace("</footer>", `${ORIGINAL_AUTHOR_ATTRIBUTION_HTML}</footer>`);
    }
    fs.writeFileSync(filepath, html);
}

/**
 * The readme page is rendered from README.md, but webpage-templates assumes the repository
 * belongs to its author: images are rewritten to the upstream repo and the header "Live
 * project" button points at the upstream demo. Retarget both at this fork, and make the
 * README's relative links (which work on GitHub) absolute so they also work from the page.
 */
function patchReadmeHtml(filepath: string): void {
    let html = fs.readFileSync(filepath, "utf8");
    const upstreamRaw = `https://github.com/${UPSTREAM_USER}/${data.githubProjectName}/raw/${data.readme.branchName}`;
    html = html.split(upstreamRaw).join(FORK_RAW_BASE);
    html = html
        .split(`https://${UPSTREAM_USER}.github.io/${data.githubProjectName}/`)
        .join(FORK_HOMEPAGE);
    // Only touch the rendered README (inside <main>): the <head> links to css/favicons are
    // relative on purpose.
    html = html.replace(/<main>[\s\S]*<\/main>/, (mainHtml: string) =>
        mainHtml.replace(/href="([^"]+)"/g, (match: string, href: string) => {
            if (/^(?:[a-z]+:|#|\/)/i.test(href)) {
                return match; // absolute URL, anchor, or site-root path: leave as is
            }
            return `href="${new URL(href, `${FORK_BLOB_BASE}README.md`).href}"`;
        })
    );
    fs.writeFileSync(filepath, html);
}

function appendAttributionCss(pageCssPath: string): void {
    if (!fs.existsSync(pageCssPath)) {
        return;
    }
    const existing = fs.readFileSync(pageCssPath, "utf8");
    if (existing.indexOf("page-attribution") !== -1) {
        return;
    }
    fs.appendFileSync(pageCssPath, ORIGINAL_AUTHOR_ATTRIBUTION_CSS);
}

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);

fse.copySync(path.join(SRC_DIR, "static"), DEST_DIR);

patchGeneratedHtml(path.join(DEST_DIR, "index.html"), {
    pageUrl: FORK_HOMEPAGE,
    stripProjectLinks: true,
    stripHeaderAndIntro: true,
    appHead: true,
});
const readmeIndexPath = path.join(DEST_DIR, "readme", "index.html");
if (fs.existsSync(readmeIndexPath)) {
    patchReadmeHtml(readmeIndexPath);
    patchGeneratedHtml(readmeIndexPath, {
        pageUrl: `${FORK_HOMEPAGE}readme/`,
        stripProjectLinks: false,
    });
}
appendAttributionCss(path.join(DEST_DIR, "css", "page.css"));
appendAttributionCss(path.join(DEST_DIR, "readme", "css", "page.css"));
