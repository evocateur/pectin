'use strict';

const path = require('path');
const loadJsonFile = require('load-json-file');

module.exports = async function loadManifest(pkgPath) {
    const pkgJsonFile = path.resolve(pkgPath);
    const pkg = await loadJsonFile(pkgJsonFile);

    // provides resolved cwd to plugins
    pkg.cwd = path.dirname(pkgJsonFile);

    return pkg;
};
