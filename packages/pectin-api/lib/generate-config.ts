import * as path from 'path';
import dotProp = require('dot-prop');
import pectin from '@pectin/core';

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { RollupOptions } from 'rollup';

import { isUpToDate } from './is-up-to-date';

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
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
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
