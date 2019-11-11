import dotProp = require('dot-prop');
import babel = require('rollup-plugin-babel');
import commonjs = require('rollup-plugin-commonjs');
import json = require('rollup-plugin-json');
import nodeResolve = require('rollup-plugin-node-resolve');
import mainEntry = require('rollup-plugin-main-entry');
import replace = require('rollup-plugin-replace');
import subpathExternals = require('rollup-plugin-subpath-externals');
import svg = require('rollup-plugin-svg');
import { terser } from 'rollup-plugin-terser';
import babelrc from '@pectin/babelrc';

export async function getPlugins(pkg, cwd, output) {
    const env = dotProp.get(output, 'env');
    const fmt = dotProp.get(output, 'format');
    const min = fmt === 'umd' && env === 'production';
    const rc = await babelrc(pkg, cwd, output);

    return [
        mainEntry(pkg),
        subpathExternals(pkg, output),
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        // @ts-ignore
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
        // @ts-ignore
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
        // @ts-ignore
        commonjs(),
        min &&
            terser({
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
            }),
    ].filter(x => Boolean(x));
}
