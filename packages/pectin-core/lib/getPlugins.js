'use strict';

const dotProp = require('dot-prop');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const mainEntry = require('rollup-plugin-main-entry');
const subpathExternals = require('rollup-plugin-subpath-externals');
const svg = require('rollup-plugin-svg');
const { terser } = require('rollup-plugin-terser');
const babelrc = require('@pectin/babelrc');

module.exports = async function getPlugins(pkg, cwd, output) {
    const env = dotProp.get(output, 'env');
    const fmt = dotProp.get(output, 'format');
    const min = fmt === 'umd' && env === 'production';
    const rc = await babelrc(pkg, cwd, output);

    return [
        mainEntry(pkg),
        subpathExternals(pkg, output),
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        nodeResolve({
            preferBuiltins: true,
            // https://github.com/rollup/rollup-plugin-node-resolve/pull/151
            extensions: ['.mjs', '.js', '.jsx', '.json', '.node'],
            // just in case dependencies have missed the memo
            jsnext: true,
        }),
        // https://github.com/rollup/rollup-plugin-json#usage
        json(),
        // https://github.com/antony/rollup-plugin-svg
        dotProp.get(pkg, 'rollup.inlineSVG') && svg(),
        // https://github.com/rollup/rollup-plugin-babel#configuring-babel
        babel(rc),
        // https://github.com/rollup/rollup-plugin-commonjs#usage
        commonjs(),
        min &&
            terser({
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
};
