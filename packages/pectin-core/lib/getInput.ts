import path = require('path');
import dotProp = require('dot-prop');

import { CoreProperties as PackageManifest } from '@schemastore/package';

function rebaseInput(rootDir: string, filePath: string): string {
    return path.join(rootDir, path.basename(filePath));
}

/**
 * By convention, entry points live in the 'src' directory with
 * the same filename as pkg.main.
 *
 * This can be customized by optional properties in pkg.rollup:
 *  - pkg.rollup.rootDir: changes the value of 'src'
 *  - pkg.rollup.input: the full path to entry file
 *
 * @param {PackageManifest} pkg
 * @return {String} input path resolved to cwd
 */
export function getInput(pkg: PackageManifest, cwd: string): string {
    if (!pkg.main) {
        const location = path.relative('.', path.join(cwd, 'package.json'));

        throw new TypeError(`required field 'main' missing in ${location}`);
    }

    const rootDir = dotProp.get(pkg, 'rollup.rootDir', 'src');
    const input = dotProp.get(pkg, 'rollup.input', rebaseInput(rootDir, pkg.main));

    return path.resolve(cwd, input);
}
