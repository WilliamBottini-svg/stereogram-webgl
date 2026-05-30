/**
 * Copies hand-written static assets (CSS, service worker) from src/static/
 * into docs/. Run as part of the build chain so devs don't have to keep two
 * copies of the same file in sync by hand.
 */

const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");

const SRC = path.resolve(__dirname, "static");
const DST = path.resolve(__dirname, "..", "docs");

const COPIES = [
    { from: "css/custom.css", to: "css/custom.css" },
    { from: "sw.js", to: "sw.js" },
];

for (const { from, to } of COPIES) {
    const srcPath = path.join(SRC, from);
    const dstPath = path.join(DST, to);
    if (!fs.existsSync(srcPath)) {
        console.warn(`Skipping ${from}: source file does not exist.`);
        continue;
    }
    fse.ensureDirSync(path.dirname(dstPath));
    fs.copyFileSync(srcPath, dstPath);
    console.log(
        `Copied ${path.relative(process.cwd(), srcPath)} -> ${path.relative(process.cwd(), dstPath)}`
    );
}
