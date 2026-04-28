import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Stereogram",
    description: "Stereogram (aka Magic Eye) online generator running on GPU with WebGL.",
    introduction: [
        "An autostereogram (also known as Magic Eye) is a 2D image designed to create the illusion of 3D. In each image, there is a 3D object that can only be viewed by looking at the image a certain way, as if the screen was transparent and you looked at the wall behind it. It gets easier with practice.",
        "Autostereograms were very popular in the '90s. They take advantage of stereopsis: the brain tries to reconstruct depth by combining the two slightly different images perceived by each eye.",
        "In this project, you can use your own depth map, customize the tiles as well as the way the image is computed. It all runs on GPU and can also handle live moving scenes in real time."
    ],
    githubProjectName: "stereogram-webgl",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "main"
    },
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/gl-matrix-2.5.1-min.js",
        "script/main.min.js"
    ],
    indicators: [
        {
            id: "fps-indicator",
            label: "FPS"
        },
        {
            id: "stripes-count-indicator",
            label: "Stripes count"
        },
        {
            id: "tilesize-indicator",
            label: "Tile size"
        },
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
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
                    step: 0.01
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
                    ]
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
                        }
                    ]
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
                        }
                    ]
                },
                {
                    type: Demopage.supportedControls.FileUpload,
                    title: "Custom",
                    id: "input-heightmap-upload-button",
                    accept: [".png", ".jpg", ".bmp", ".webp"],
                    defaultMessage: "Upload a depth map"
                },
            ]
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
                            value: "noise"
                        },
                    ]
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
                        }
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Resolution",
                    id: "tile-noise-resolution-range-id",
                    min: 8,
                    max: 64,
                    value: 16,
                    step: 1
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
                    defaultMessage: "Upload a pattern"
                },
            ]
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
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Offset Y",
                    id: "tile-pattern-offset-y-range-id",
                    min: -0.5,
                    max: 0.5,
                    value: 0,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zoom",
                    id: "tile-pattern-zoom-range-id",
                    min: 0.25,
                    max: 4,
                    value: 1,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Repeat scale X",
                    id: "tile-pattern-repeat-x-range-id",
                    min: 0.5,
                    max: 2,
                    value: 1,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Repeat scale Y",
                    id: "tile-pattern-repeat-y-range-id",
                    min: 0.5,
                    max: 2,
                    value: 1,
                    step: 0.01
                },
            ]
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
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Right",
                    id: "tile-crop-max-u-range-id",
                    min: 0,
                    max: 1,
                    value: 1,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Top",
                    id: "tile-crop-min-v-range-id",
                    min: 0,
                    max: 1,
                    value: 0,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Bottom",
                    id: "tile-crop-max-v-range-id",
                    min: 0,
                    max: 1,
                    value: 1,
                    step: 0.01
                },
            ]
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
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Custom position",
                    id: "main-stripe-custom-range-id",
                    min: 0,
                    max: 1000,
                    value: 500,
                    step: 1
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
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Stripes width",
                    id: "stripes-width-range-id",
                    min: 20,
                    max: 200,
                    value: 80,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Stripes count",
                    id: "stripes-count-range-id",
                    min: 8,
                    max: 24,
                    value: 16,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show UV",
                    id: "show-uv-checkbox-id",
                    checked: false,
                },
            ]
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
                    label: "Download image"
                }
            ]
        }
    ]
};

/**
 * Demopage / webpage-templates hardcodes the header (home), intro copy, and "project links" in EJS.
 * We strip those from the main demo page and add clear text attribution in the footer.
 */
const ORIGINAL_AUTHOR_ATTRIBUTION_HTML = `    <p class="page-attribution">Original project by <a href="https://github.com/piellardj" rel="noopener noreferrer">Jérémie Piellard</a> · <a href="https://piellardj.github.io" rel="noopener noreferrer">Website</a> · <a href="https://github.com/piellardj/stereogram-webgl" rel="noopener noreferrer">Source</a></p>
`;

const ORIGINAL_AUTHOR_ATTRIBUTION_CSS = `
.page-attribution{margin-top:12px;font-size:14px;line-height:1.4;color:#5e5e5e;color:var(--var-color-block-actionitem,#5e5e5e)}.page-attribution a{color:inherit;text-decoration:underline}.page-attribution a:hover{color:#7e7e7e;color:var(--var-color-block-actionitem-hover,#7e7e7e)}
`;

function patchGeneratedHtml(filepath: string, options: { stripProjectLinks: boolean; stripHeaderAndIntro?: boolean }): void {
    let html = fs.readFileSync(filepath, "utf8");
    // `description` contains a nested `project-links` div; strip that first so intro removal can match cleanly.
    if (options.stripProjectLinks) {
        html = html.replace(/\s*<br>\s*\n\s*<div class="project-links">[\s\S]*?<\/div>/, "");
    }
    if (options.stripHeaderAndIntro) {
        html = html.replace(/<header>[\s\S]*?<\/header>\s*/, "");
        html = html.replace(
            /<div class="intro">\s*<h1>[\s\S]*?<\/h1>\s*<div class="description">[\s\S]*?<\/div>\s*<\/div>\s*/,
            "",
        );
    }
    if (html.indexOf("page-attribution") === -1) {
        html = html.replace("</footer>", `${ORIGINAL_AUTHOR_ATTRIBUTION_HTML}</footer>`);
    }
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

patchGeneratedHtml(path.join(DEST_DIR, "index.html"), { stripProjectLinks: true, stripHeaderAndIntro: true });
const readmeIndexPath = path.join(DEST_DIR, "readme", "index.html");
if (fs.existsSync(readmeIndexPath)) {
    patchGeneratedHtml(readmeIndexPath, { stripProjectLinks: false });
}
appendAttributionCss(path.join(DEST_DIR, "css", "page.css"));
appendAttributionCss(path.join(DEST_DIR, "readme", "css", "page.css"));
