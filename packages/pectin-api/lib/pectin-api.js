'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const dotProp = require('dot-prop');
const globby = require('globby');
const pMap = require('p-map');
const { getPackages } = require('@lerna/project');
const { createMultiConfig } = require('@pectin/core');

const statAsync = util.promisify(fs.stat);

exports.findConfigs = findConfigs;
exports.generateConfig = generateConfig;
exports.isUpToDate = isUpToDate;

async function findConfigs({
    cwd: startDir,
    concurrency = os.cpus().length,
    watch = !!process.env.ROLLUP_WATCH,
} = {}) {
    const lernaPackages = await getPackages(startDir);
    const configs = await pMap(
        // clones internal JSON, maps synthetic location to cwd property
        lernaPackages.map(pkg => [pkg.toJSON(), pkg.location]),
        ([pkg, cwd]) => generateConfig(pkg, { cwd, watch }),
        { concurrency }
    );

    // flatten then compact
    return configs.reduce((acc, val) => acc.concat(val), []).filter(x => Boolean(x));
}

async function generateConfig(pkg, opts) {
    let config;

    // completely ignore packages that opt-out
    if (dotProp.has(pkg, 'rollup.skip')) {
        return null;
    }

    // allow per-package opt-out of watch
    if (opts.watch && dotProp.has(pkg, 'rollup.ignoreWatch')) {
        return null;
    }

    // back-compat for old property location
    if (pkg.cwd) {
        // eslint-disable-next-line no-param-reassign
        opts = Object.assign({}, opts, {
            cwd: pkg.cwd,
        });
    }

    try {
        config = await createMultiConfig(pkg, opts);

        // improve the logging output by shortening the input path
        for (const obj of config) {
            obj.input = path.relative('.', obj.input);
        }
    } catch (ex) {
        // skip packages that throw errors (e.g., missing pkg.main)
        // TODO: re-throw if this is an _unexpected_ error
        return null;
    }

    if (opts.watch) {
        // don't clear the screen during watch
        for (const obj of config) {
            obj.watch = {
                clearScreen: false,
            };
        }
    } else if (await isUpToDate(opts, config)) {
        // no changes, don't rebuild
        return null;
    }

    return config;
}

async function isUpToDate(opts, config) {
    // back-compat for old signature
    if (Array.isArray(config)) {
        // eslint-disable-next-line no-param-reassign
        [config] = config;
    }

    // only need to test one output since all are built simultaneously
    const outFile = config.output[0].file;

    // short-circuit if output hasn't been built yet
    let outputStat;

    try {
        outputStat = await statAsync(outFile);
    } catch (ex) {
        // always build when output dir is missing
        return false;
    }

    const matchers = [
        // include all .js and .jsx files
        '**/*.@(js|jsx)',
        // except *.test.js and *-test.js
        '!**/*@(.|-)test.js',
        // ignoring anything under __tests__
        '!**/__tests__/**',
    ];

    // re-resolve cwd so logging-friendly relative paths don't muck things up
    const cwd = path.resolve(path.dirname(config.input));

    if (cwd === opts.cwd) {
        // a "rooted" module needs to ignore output, test, & node_modules
        const outputDir = path.relative(opts.cwd, path.dirname(outFile));

        matchers.push(`!${outputDir}/**`, '!node_modules/**', '!test/**');
    }

    // gather fs.Stat objects for mtime comparison
    const fileStats = await globby(matchers, { cwd, stats: true });
    const lastBuilt = outputStat.mtime.getTime();

    return fileStats.every(fileStat => fileStat.mtime.getTime() <= lastBuilt);
}
