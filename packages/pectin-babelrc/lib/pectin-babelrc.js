'use strict';

const path = require('path');
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
    // avoid mutating cached array
    const plugins = (rc.plugins || []).slice();

    if (plugins.some(hasSimpleTransform)) {
        const idx = plugins.findIndex(hasSimpleTransform);

        plugins.splice(idx, 1, ['@babel/plugin-transform-runtime', entryOptions]);
    } else if (plugins.some(hasAdvancedTransform)) {
        const idx = plugins.findIndex(hasAdvancedTransform);
        const cfg = plugins[idx];

        plugins.splice(idx, 1, [
            '@babel/plugin-transform-runtime',
            Object.assign(cfg.length > 1 ? cfg[1] : {}, entryOptions),
        ]);
    } else {
        plugins.push(['@babel/plugin-transform-runtime', entryOptions]);
    }

    Object.assign(rc, {
        runtimeHelpers: true,
        plugins,
    });
}

function hasDynamicImportSyntax(plugin) {
    return typeof plugin === 'string' && /@babel\/(plugin-)?syntax-dynamic-import/.test(plugin);
}

function ensureDynamicImportSyntax(rc) {
    // avoid concatenating falsey value
    const plugins = rc.plugins || [];

    if (!plugins.some(hasDynamicImportSyntax)) {
        Object.assign(rc, {
            plugins: ['@babel/plugin-syntax-dynamic-import'].concat(plugins),
        });
    }
}

module.exports = async function pectinBabelrc(pkg, cwd, output) {
    const { format = 'cjs' } = output || {};
    const { config, filepath } = await explorer.search(cwd);
    const deps = new Set(Object.keys(pkg.dependencies || {}));

    // don't mutate (potentially) cached config
    const rc = Object.assign({}, config);

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
    if (format === 'esm') {
        ensureDynamicImportSyntax(rc);
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
