import path = require('path');
import resolveFrom = require('resolve-from');

// istanbul ignore next
export function invokeRollup(argv: {
    concurrency: number;
    cwd: string;
    watch: boolean;
    _: string[];
}): void {
    const corePath = resolveFrom(__dirname, '@pectin/api/package.json');
    const autoPath = path.join(path.dirname(corePath), 'auto.js');
    const opts = ['--config', autoPath];

    if (argv.watch) {
        opts.unshift('--watch');
    }

    if (argv._.length) {
        opts.push(...argv._);
    }

    /* eslint-disable
        global-require,
        zillow/import/no-dynamic-require,
        @typescript-eslint/no-var-requires
    */
    // @see https://github.com/zkat/npx/blob/b7c8b9f07605b9f41931ad3ef8e74a65d2f062bb/index.js#L258-L268
    const Module = require('module');
    const rollupPkg = resolveFrom(argv.cwd, 'rollup/package.json');
    // instead of hard-coded subpath, read package.json metadata to retrieve bin location
    const rollupBin = path.join(path.dirname(rollupPkg), require(rollupPkg).bin.rollup);

    process.argv = [process.argv[0], rollupBin].concat(opts);

    // ✨MAGIC✨
    Module.runMain();
}
