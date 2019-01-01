'use strict';

const pMap = require('p-map');
const getInput = require('./getInput');
const getOutput = require('./getOutput');
const getPlugins = require('./getPlugins');
const loadManifest = require('./loadManifest');

async function createConfig(pkg) {
    const { cwd } = pkg;
    const input = getInput(pkg, cwd);
    const output = getOutput(pkg, cwd);
    const plugins = await getPlugins(pkg, cwd, output[0]);

    return { input, output, plugins };
}

module.exports = async function pectinCore(pkgPath) {
    return createConfig(await loadManifest(pkgPath));
};

module.exports.createConfig = createConfig;
module.exports.createMultiConfig = createMultiConfig;
module.exports.loadManifest = loadManifest;

async function createMultiConfig(pkg, { cwd }) {
    const input = getInput(pkg, cwd);
    const outputs = getOutput(pkg, cwd, true);

    return pMap(outputs, async output => {
        const plugins = await getPlugins(pkg, cwd, output);

        return {
            input,
            // output array for consistency with createConfig()
            output: [output],
            plugins,
            inlineDynamicImports: output.browser === true || output.format === 'umd',
        };
    });
}
