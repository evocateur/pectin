import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import dotProp = require('dot-prop');
import globby = require('globby');
import project = require('@lerna/project');
import runTopologically = require('@lerna/run-topologically');
import pectin from '@pectin/core';

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { RollupOptions } from 'rollup';

const statAsync = util.promisify(fs.stat);

export async function findConfigs(opts: { cwd?: string; concurrency: number; watch: boolean }) {
    const concurrency = opts.concurrency || os.cpus().length;
    const watch = opts.watch || !!process.env.ROLLUP_WATCH;

    const lernaPackages = await project.getPackages(opts.cwd);
    const configs = await runTopologically(
        lernaPackages,
        // clones internal JSON, maps synthetic location to cwd property
        (pkg: { toJSON: () => PackageManifest; location: string }) =>
            generateConfig(pkg.toJSON(), { cwd: pkg.location, watch }),
        { concurrency }
    );

    // flatten then compact
    return configs
        .reduce((acc: any[], val: any) => acc.concat(val), [])
        .filter((x: any) => Boolean(x));
}

export async function generateConfig(
    pkg: PackageManifest,
    opts: {
        cwd?: string;
        watch: boolean;
    }
): Promise<RollupOptions[] | null> {
    let config: any;

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
        config = await pectin(pkg, opts);

        // improve the logging output by shortening the input path
        for (const obj of config) {
            obj.input = path.relative('.', obj.input);
        }
    } catch (ex) {
        // skip packages that throw errors (e.g., missing pkg.main)

        // eslint-disable-next-line no-console
        console.error(ex);

        // TODO: re-throw if this is an _unexpected_ error
        return null;
    }

    if (opts.watch) {
        // don't clear the screen during watch
        for (const obj of config) {
            // @ts-ignore (missing rollup type, totally works mr. typescript)
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
    // @ts-ignore (it works, trust me mr. typescript)
    const fileStats = results.map(obj => obj.stats);
    const lastBuilt = outputStat.mtime.getTime();

    return fileStats.every(fileStat => fileStat.mtime.getTime() <= lastBuilt);
}
