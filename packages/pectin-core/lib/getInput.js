'use strict';

const path = require('path');

/**
 * By convention, entry points live in the 'src' directory with
 * the same filename as pkg.main.
 *
 * This can be customized by optional properties in pkg.rollup:
 *  - pkg.rollup.rootDir: changes the value of 'src'
 *  - pkg.rollup.input: the full path to entry file
 *
 * @param {Object} pkg
 * @return {String} input path resolved to pkg.cwd
 */
module.exports = function getInput({ main, cwd, rollup = {} }) {
    if (!main) {
        const location = path.relative('.', path.join(cwd, 'package.json'));

        throw new TypeError(`required field 'main' missing in ${location}`);
    }

    const rootDir = rollup.rootDir || 'src';
    const input = rollup.input || rebaseInput(rootDir, main);

    return path.resolve(cwd, input);
};

function rebaseInput(rootDir, filePath) {
    return path.join(rootDir, path.basename(filePath));
}
