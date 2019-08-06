'use strict';

const path = require('path');
const pMap = require('p-map');
const getInput = require('./getInput');
const getOutput = require('./getOutput');
const getPlugins = require('./getPlugins');

module.exports = pectinCore;

/**
 * Generate Rollup configs for a package.
 *
 * @param {Object} pkg parsed package.json
 * @param {Object} [opts] optional options object
 * @param {String} opts.cwd current working directory
 */
async function pectinCore(pkg, opts) {
    const cwd = path.resolve((opts && opts.cwd) || '.');
    const input = getInput(pkg, cwd);
    const outputs = getOutput(pkg, cwd);

    return pMap(outputs, async output => {
        const plugins = await getPlugins(pkg, cwd, output);

        return {
            input,
            output: [output],
            plugins,
            inlineDynamicImports: output.browser === true || output.format === 'umd',
        };
    });
}
