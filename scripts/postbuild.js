const { join } = require("path");
const { readFile, writeFile } = require("fs/promises");

const readScript = (file) => readFile(file, 'utf8');
const writeScript = (file, content) => writeFile(file, content, 'utf8');

const RX = /^\/\*(.*)\*\//gms;

const BANNER = `/**
* @author Mosa Muhana <mosamuhana@gmail.com>
* https://github.com/mosamuhana
* See LICENSE file in root directory for full license.
*/`

const addBanner = content => BANNER + '\n' + content;
const splitLines = content => content.split(/\r?\n/g);
const cleanEmptyLines = (content) => splitLines(content).filter(line => line.trim().length > 0).join('\n');
const deleteFirstLine = content => splitLines(content).slice(1).join('\n');
const cleanComments = content => content.replace(RX, "");
const cleanBy = (content, ...fns) => fns.reduce((result, fn) => fn(result), content);
const fixDefinition = content => {
    return content
        .replace(/export declare class/gu, "export class")
        .replace(/export declare function/gu, "export function")
        .replace(/export {};/g, "");
};

async function updateScript(file) {
    const content = await readScript(file);
    const newContent = cleanBy(content,
        //cleanComments,
        cleanEmptyLines,
        addBanner,
    );
    if (newContent !== content) {
        await writeScript(file, newContent);
    }
}

async function updateDefinition(file) {
    const content = await readScript(file);
    const newContent = cleanBy(content,
        deleteFirstLine,
        fixDefinition,
        cleanEmptyLines,
        addBanner,
    );
    if (newContent !== content) {
        await writeScript(file, newContent);
    }
}

async function main() {
    const dist = join(process.cwd(), "dist");
    const distFile = file => join(process.cwd(), `dist/${file}`);
    const name = 'index';
    //const files = [ 'js', 'mjs' ].map(ext => join(dist, `${name}.${ext}`));
    const files = [ 'js', 'mjs' ].map(ext => distFile(`${name}.${ext}`));

    await Promise.all([
        ...files.map(file => updateScript(file)),
        //updateDefinition(join(dist, `${name}.d.ts`)),
        updateDefinition(distFile(`${name}.d.ts`)),
    ]);
}

main();
