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

module.exports = async function pectinBabelrc(pkg, cwd, output) {
    const { format = 'cjs' } = output || {};
    const { config, filepath } = await explorer.search(cwd);

    // don't mutate (potentially) cached config
    const rc = Object.assign({}, config);

    // enable runtime transform when @babel/runtime found in dependencies
    if ('@babel/runtime' in (pkg.dependencies || {})) {
        rc.runtimeHelpers = true;

        // avoid mutating cached array
        rc.plugins = (rc.plugins || []).slice();

        if (rc.plugins.some(hasSimpleTransform)) {
            const idx = rc.plugins.findIndex(hasSimpleTransform);

            rc.plugins.splice(idx, 1, [
                '@babel/plugin-transform-runtime',
                { useESModules: format === 'esm' },
            ]);
        } else if (rc.plugins.some(hasAdvancedTransform)) {
            const idx = rc.plugins.findIndex(hasAdvancedTransform);
            const cfg = rc.plugins[idx];

            rc.plugins.splice(idx, 1, [
                '@babel/plugin-transform-runtime',
                Object.assign(cfg.length > 1 ? cfg[1] : {}, {
                    useESModules: format === 'esm',
                }),
            ]);
        } else {
            rc.plugins.push([
                '@babel/plugin-transform-runtime',
                { useESModules: format === 'esm' },
            ]);
        }
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

    return rc;
};
