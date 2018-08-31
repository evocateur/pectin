'use strict';

const getInput = require('./getInput');
const getOutput = require('./getOutput');
const getPlugins = require('./getPlugins');
const loadManifest = require('./loadManifest');

async function createConfig(pkg) {
    const input = getInput(pkg);
    const output = getOutput(pkg);
    const plugins = await getPlugins(pkg);

    return { input, output, plugins };
}

module.exports = async function pectinCore(pkgPath) {
    return createConfig(await loadManifest(pkgPath));
};

module.exports.createConfig = createConfig;
module.exports.loadManifest = loadManifest;
