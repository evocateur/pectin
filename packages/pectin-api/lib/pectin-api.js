'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const dotProp = require('dot-prop');
const findUp = require('find-up');
const globby = require('globby');
const loadJsonFile = require('load-json-file');
const pMap = require('p-map');
const { loadManifest, createConfig } = require('@pectin/core');

const statAsync = util.promisify(fs.stat);

exports.findConfigs = findConfigs;
exports.generateConfig = generateConfig;
exports.isUpToDate = isUpToDate;

async function findConfigs({
    cwd,
    concurrency = os.cpus().length,
    watch = !!process.env.ROLLUP_WATCH,
} = {}) {
    const manifests = await findManifests(cwd);
    const pkgs = await pMap(manifests, m => loadManifest(m), { concurrency: 100 });
    const configs = await pMap(pkgs, pkg => generateConfig(pkg, { watch }), { concurrency });

    return configs.filter(x => Boolean(x));
}

async function findManifests(cwd) {
    const lernaJsonPath = await findUp('lerna.json', { cwd });
    const lernaConfig = await loadJsonFile(lernaJsonPath);
    const patterns = lernaConfig.packages.map(rootGlob => `${rootGlob}/package.json`);

    return globby(patterns, {
        absolute: true,
        cwd: path.dirname(lernaJsonPath),
        ignore: ['**/node_modules/**'],
    });
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

    try {
        config = await createConfig(pkg);

        // improve the logging output by shortening the input path
        config.input = path.relative('.', config.input);
    } catch (ex) {
        // skip packages that throw errors (e.g., missing pkg.main)
        // TODO: re-throw if this is an _unexpected_ error
        return null;
    }

    if (opts.watch) {
        // don't clear the screen during watch
        config.watch = {
            clearScreen: false,
        };
    } else if (await isUpToDate(pkg, config)) {
        // no changes, don't rebuild
        return null;
    }

    return config;
}

async function isUpToDate(pkg, config) {
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

    if (cwd === pkg.cwd) {
        // a "rooted" module needs to ignore output, test, & node_modules
        const outputDir = path.relative(pkg.cwd, path.dirname(outFile));

        matchers.push(`!${outputDir}/**`, '!node_modules/**', '!test/**');
    }

    // gather fs.Stat objects for mtime comparison
    const fileStats = await globby(matchers, { cwd, stats: true });
    const lastBuilt = outputStat.mtime.getTime();

    return fileStats.every(fileStat => fileStat.mtime.getTime() <= lastBuilt);
}
