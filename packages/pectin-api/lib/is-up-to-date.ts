import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import globby = require('globby');

import { RollupOptions } from 'rollup';

const statAsync = util.promisify(fs.stat);

export async function isUpToDate(opts: { cwd?: string }, config: RollupOptions | RollupOptions[]) {
    // back-compat for old signature
    if (Array.isArray(config)) {
        // eslint-disable-next-line no-param-reassign
        [config] = config;
    }

    // only need to test one output since all are built simultaneously
    const firstOutput = Array.isArray(config.output) ? config.output[0] : config.output || {};
    const outFile = firstOutput.dir
        ? path.join(firstOutput.dir, firstOutput.entryFileNames || '')
        : firstOutput.file!;

    // short-circuit if output hasn't been built yet
    let outputStat: fs.Stats;

    try {
        outputStat = await statAsync(outFile);
    } catch (ex) {
        // always build when output dir is missing
        return false;
    }

    const matchers = [
        // include all .js and .jsx files
        '**/*.@(js|jsx|ts|tsx)',
        // except *.test.js and *-test.js
        '!**/*@(.|-)test.js',
        // ignoring anything under __tests__
        '!**/__tests__/**',
    ];

    // re-resolve cwd so logging-friendly relative paths don't muck things up
    const cwd = path.resolve(path.dirname(config.input as string));

    if (cwd === opts.cwd) {
        // a "rooted" module needs to ignore output, test, & node_modules
        const outputDir = path.relative(opts.cwd, path.dirname(outFile));

        matchers.push(`!${outputDir}/**`, '!node_modules/**', '!test/**');
    }

    // gather fs.Stat objects for mtime comparison
    const results = await globby(matchers, { cwd, stats: true });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore (it works, trust me mr. typescript)
    const fileStats = results.map(obj => obj.stats);
    const lastBuilt = outputStat.mtime.getTime();

    return fileStats.every(fileStat => fileStat.mtime.getTime() <= lastBuilt);
}
