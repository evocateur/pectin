import path = require('path');
import pMap = require('p-map');
import { getInput } from './getInput';
import { getOutput } from './getOutput';
import { getPlugins } from './getPlugins';

/**
 * Generate Rollup configs for a package.
 *
 * @param {Object} pkg parsed package.json
 * @param {Object} [opts] optional options object
 * @param {String} opts.cwd current working directory
 */
export default async function pectinCore(pkg, opts) {
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
