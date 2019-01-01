'use strict';

const pMap = require('p-map');
const getInput = require('./getInput');
const getOutput = require('./getOutput');
const getPlugins = require('./getPlugins');

module.exports = pectinCore;

async function pectinCore(pkg, { cwd }) {
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
