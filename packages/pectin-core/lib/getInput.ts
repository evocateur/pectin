import path = require('path');
import dotProp = require('dot-prop');

/**
 * By convention, entry points live in the 'src' directory with
 * the same filename as pkg.main.
 *
 * This can be customized by optional properties in pkg.rollup:
 *  - pkg.rollup.rootDir: changes the value of 'src'
 *  - pkg.rollup.input: the full path to entry file
 *
 * @param {Object} pkg
 * @return {String} input path resolved to cwd
 */
export function getInput(pkg, cwd) {
    if (!pkg.main) {
        const location = path.relative('.', path.join(cwd, 'package.json'));

        throw new TypeError(`required field 'main' missing in ${location}`);
    }

    const rootDir = dotProp.get(pkg, 'rollup.rootDir', 'src');
    const input = dotProp.get(pkg, 'rollup.input', rebaseInput(rootDir, pkg.main));

    return path.resolve(cwd, input);
}

function rebaseInput(rootDir, filePath) {
    return path.join(rootDir, path.basename(filePath));
}
