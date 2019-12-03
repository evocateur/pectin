/* eslint-disable @typescript-eslint/ban-ts-ignore */
import dotProp = require('dot-prop');
// @ts-ignore pending migration to typescript
import babel = require('rollup-plugin-babel');
import commonjs = require('rollup-plugin-commonjs');
// @ts-ignore (TODO: migrate to @rollup/plugin-json)
import json = require('rollup-plugin-json');
import nodeResolve = require('rollup-plugin-node-resolve');
import mainEntry from 'rollup-plugin-main-entry';
import replace = require('rollup-plugin-replace');
import subpathExternals from 'rollup-plugin-subpath-externals';
// @ts-ignore pending migration to typescript(?)
import svg = require('rollup-plugin-svg');
import { terser } from 'rollup-plugin-terser';
import babelrc from '@pectin/babelrc';
/* eslint-enable */

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { Plugin } from 'rollup';
import { RollupOutputOptions } from './getOutput';

export async function getPlugins(
    pkg: PackageManifest,
    cwd: string,
    output: RollupOutputOptions
): Promise<Plugin[]> {
    const env: string | undefined = dotProp.get(output, 'env');
    const fmt: string | undefined = dotProp.get(output, 'format');
    const min = fmt === 'umd' && env === 'production';
    const rc = await babelrc(pkg, cwd, output);

    return [
        mainEntry(pkg, cwd),
        subpathExternals(pkg, output),
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore (it fucking works, goddammit)
        nodeResolve({
            preferBuiltins: true,
            // https://github.com/rollup/rollup-plugin-node-resolve/pull/151
            extensions: ['.mjs', '.js', '.jsx', '.json', '.node', '.ts', '.tsx'],
            // https://github.com/rollup/rollup-plugin-node-resolve/pull/182
            mainFields: [
                'module',
                // just in case dependencies have missed the memo
                'jsnext:main',
                'main',
            ],
        }),
        // https://github.com/rollup/rollup-plugin-replace#usage
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore (it fucking works, goddammit)
        replace(
            Object.assign(env ? { 'process.env.NODE_ENV': JSON.stringify(env) } : {}, {
                'process.env.BROWSER': JSON.stringify(output.browser || false),
                'process.env.VERSION': JSON.stringify(pkg.version),
            })
        ),
        // https://github.com/rollup/rollup-plugin-json#usage
        json(),
        // https://github.com/antony/rollup-plugin-svg
        dotProp.get(pkg, 'rollup.inlineSVG') && svg(),
        // https://github.com/rollup/rollup-plugin-babel#configuring-babel
        babel(rc),
        // https://github.com/rollup/rollup-plugin-commonjs#usage
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore (it fucking works, goddammit)
        commonjs(),
        min &&
            terser({
                /* eslint-disable @typescript-eslint/camelcase */
                // https://github.com/terser-js/terser#minify-options
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                },
                mangle: {
                    keep_classnames: true,
                    keep_fnames: true,
                },
                /* eslint-enable @typescript-eslint/camelcase */
            }),
    ].filter(x => Boolean(x));
}
