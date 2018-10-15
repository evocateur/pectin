'use strict';

const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const mainEntry = require('rollup-plugin-main-entry');
const subpathExternals = require('rollup-plugin-subpath-externals');
const svg = require('rollup-plugin-svg');
const babelrc = require('@pectin/babelrc');

module.exports = async function getPlugins(pkg) {
    const rc = await babelrc(pkg, pkg.cwd);

    return [
        mainEntry(pkg),
        subpathExternals(pkg),
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
        svg(),
        // https://github.com/rollup/rollup-plugin-babel#configuring-babel
        babel(rc),
        // https://github.com/rollup/rollup-plugin-commonjs#usage
        commonjs(),
    ];
};
