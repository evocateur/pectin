'use strict';

const path = require('path');
const cloneDeep = require('clone-deep');
const cosmiconfig = require('cosmiconfig');

const explorer = cosmiconfig('babel', {
    // we cannot cache transform because per-package dependencies affect result
    searchPlaces: [
        // babel 7
        'babel.config.js',
        '.babelrc.js',
        // babel 6+
        '.babelrc',
        'package.json',
    ],
});

function hasSimpleTransform(plugin) {
    return typeof plugin === 'string' && /@babel\/(plugin-)?transform-runtime/.test(plugin);
}

function hasAdvancedTransform(plugin) {
    return Array.isArray(plugin) && /@babel\/(plugin-)?transform-runtime/.test(plugin[0]);
}

function ensureRuntimeHelpers(rc, entryOptions) {
    if (rc.plugins.some(hasSimpleTransform)) {
        const idx = rc.plugins.findIndex(hasSimpleTransform);
        const name = rc.plugins[idx];

        rc.plugins.splice(idx, 1, [name, entryOptions]);
    } else if (rc.plugins.some(hasAdvancedTransform)) {
        const idx = rc.plugins.findIndex(hasAdvancedTransform);
        const [name, config = {}] = rc.plugins[idx];

        rc.plugins.splice(idx, 1, [name, { ...config, ...entryOptions }]);
    } else {
        rc.plugins.push(['@babel/plugin-transform-runtime', entryOptions]);
    }

    // eslint-disable-next-line no-param-reassign
    rc.runtimeHelpers = true;
}

function hasDynamicImportSyntax(plugin) {
    return typeof plugin === 'string' && /@babel\/(plugin-)?syntax-dynamic-import/.test(plugin);
}

module.exports = async function pectinBabelrc(pkg, cwd, output) {
    const { format = 'cjs' } = output || {};
    const searchResult = await explorer.search(cwd);

    if (searchResult === null) {
        throw new Error(
            `Babel configuration is required for ${pkg.name}, but no config file was found.`
        );
    }

    const { config, filepath } = searchResult;
    const deps = new Set(Object.keys(pkg.dependencies || {}));

    // don't mutate (potentially) cached config
    const rc = cloneDeep(config);

    // always ensure plugins array exists
    if (!rc.plugins) {
        rc.plugins = [];
    }

    // enable runtime transform when @babel/runtime found in dependencies
    if (deps.has('@babel/runtime')) {
        ensureRuntimeHelpers(rc, {
            useESModules: format === 'esm',
        });
    } else if (deps.has('@babel/runtime-corejs2')) {
        ensureRuntimeHelpers(rc, {
            useESModules: format === 'esm',
            corejs: 2,
        });
    } else if (deps.has('@babel/runtime-corejs3')) {
        ensureRuntimeHelpers(rc, {
            useESModules: format === 'esm',
            corejs: 3,
        });
    }

    // ensure dynamic import syntax is available
    if (format === 'esm' && !rc.plugins.some(hasDynamicImportSyntax)) {
        rc.plugins.unshift('@babel/plugin-syntax-dynamic-import');
    }

    // babel 7 doesn't need `{ modules: false }`, just verify a preset exists
    if (!rc.presets) {
        const fileLoc = path.relative(cwd, filepath);
        const badConfig =
            path.basename(filepath) === 'package.json'
                ? `"babel" config block of ${fileLoc}`
                : fileLoc;

        throw new Error(`At least one preset (like @babel/preset-env) is required in ${badConfig}`);
    }

    // rollup-specific babel config
    rc.babelrc = false;
    rc.exclude = 'node_modules/**';
    rc.extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'];

    return rc;
};
