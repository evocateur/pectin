'use strict';

const path = require('path');
const cosmiconfig = require('cosmiconfig');
const { createConfigItem, loadPartialConfig } = require('@babel/core');

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

function hasTransform(configItem) {
    return /@babel\/plugin-transform-runtime/.test(configItem.file.resolved);
}

function hasSimpleTransform(plugin) {
    return typeof plugin === 'string' && /@babel\/(plugin-)?transform-runtime/.test(plugin);
}

function hasAdvancedTransform(plugin) {
    return Array.isArray(plugin) && /@babel\/(plugin-)?transform-runtime/.test(plugin[0]);
}

function ensureRuntimeHelpers(rc, entryOptions) {
    // avoid mutating cached array
    const plugins = (rc.plugins || []).slice();

    if (plugins.some(hasTransform)) {
        const idx = plugins.findIndex(hasTransform);
        const cfg = plugins[idx];

        plugins.splice(
            idx,
            1,
            createConfigItem(
                [
                    '@babel/plugin-transform-runtime',
                    Object.assign({}, cfg.options, entryOptions),
                    cfg.name,
                ],
                {
                    dirname: rc.root,
                    type: 'plugin',
                }
            )
        );
    } else {
        plugins.push(
            createConfigItem(['@babel/plugin-transform-runtime', entryOptions], {
                dirname: rc.root,
                type: 'plugin',
            })
        );
    }

    // if (plugins.some(hasSimpleTransform)) {
    //     const idx = plugins.findIndex(hasSimpleTransform);

    //     plugins.splice(idx, 1, ['@babel/plugin-transform-runtime', entryOptions]);
    // } else if (plugins.some(hasAdvancedTransform)) {
    //     const idx = plugins.findIndex(hasAdvancedTransform);
    //     const cfg = plugins[idx];

    //     plugins.splice(idx, 1, [
    //         '@babel/plugin-transform-runtime',
    //         Object.assign(cfg.length > 1 ? cfg[1] : {}, entryOptions),
    //     ]);
    // } else {
    //     plugins.push(['@babel/plugin-transform-runtime', entryOptions]);
    // }

    Object.assign(rc, {
        runtimeHelpers: true,
        plugins,
    });
}

module.exports = async function pectinBabelrc(pkg, cwd, output) {
    const { format = 'cjs' } = output || {};
    const { config, filepath } = await explorer.search(cwd);
    const deps = new Set(Object.keys(pkg.dependencies || {}));

    // console.info('config', config);
    // console.warn('filepath', filepath);

    const babelOpts = { cwd };

    if (path.dirname(filepath) === cwd && path.basename(filepath) !== 'package.json') {
        // a leaf-local config
        babelOpts.rootMode = 'root';
        babelOpts.configFile = filepath;
    } else {
        // a root-level config
        babelOpts.rootMode = 'upward-optional';
        babelOpts.filename = path.join(cwd, 'index.js');
    }

    console.warn('babelOpts', babelOpts);
    const partialConfig = loadPartialConfig(babelOpts);

    console.info('partialConfig', partialConfig);

    console.error(pkg.name, 'plugins\n', partialConfig.options.plugins);
    console.error(pkg.name, 'presets\n', partialConfig.options.presets);

    // don't mutate (potentially) cached config
    // const rc = Object.assign({}, config);
    const rc = Object.assign({}, partialConfig.options);

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
    }

    // babel 7 doesn't need `{ modules: false }`, just verify a preset exists
    if (rc.presets.length === 0) {
        const fileLoc = path.relative(cwd, filepath);
        const badConfig =
            path.basename(filepath) === 'package.json'
                ? `"babel" config block of ${fileLoc}`
                : fileLoc;

        throw new Error(`At least one preset (like @babel/preset-env) is required in ${badConfig}`);
    }

    // rollup-specific babel config
    // rc.babelrc = false;
    rc.exclude = 'node_modules/**';

    return rc;
};
