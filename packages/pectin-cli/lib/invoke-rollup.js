'use strict';

const path = require('path');
const resolveFrom = require('resolve-from');

module.exports = invokeRollup;

// istanbul ignore next
function invokeRollup(argv) {
    const corePath = resolveFrom(__dirname, '@pectin/api/package.json');
    const autoPath = path.join(path.dirname(corePath), 'auto.js');
    const opts = ['--config', autoPath];

    if (argv.watch) {
        opts.unshift('--watch');
    }

    // @see https://github.com/zkat/npx/blob/b7c8b9f07605b9f41931ad3ef8e74a65d2f062bb/index.js#L258-L268
    const Module = require('module'); // eslint-disable-line global-require
    const rollupPkg = resolveFrom(argv.cwd, 'rollup/package.json');
    const rollupBin = path.join(path.dirname(rollupPkg), 'bin/rollup');

    process.argv = [process.argv[0], rollupBin].concat(opts);

    // ✨MAGIC✨
    Module.runMain();
}
