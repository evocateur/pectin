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

const NON_CONFIGURABLE_PRESETS = new Set([
    'flow',
    'react',
    'stage-0',
    'stage-1',
    'stage-2',
    'stage-3',
]);

function hasConfigurablePreset(rc) {
    return (
        rc.presets &&
        rc.presets.some(preset => Array.isArray(preset) || !NON_CONFIGURABLE_PRESETS.has(preset))
    );
}

module.exports = async function pectinBabelrc(pkg, cwd) {
    const { config, filepath } = await explorer.search(cwd);

    // don't mutate (potentially) cached config
    const rc = Object.assign({}, config);

    const presetOptions = {
        modules: false,
    };

    // enable runtime transform when @babel/runtime found in dependencies
    const runtimeHelpers = '@babel/runtime' in (pkg.dependencies || {});

    // pass options to presets
    if (hasConfigurablePreset(rc)) {
        rc.presets = rc.presets.map(preset => {
            let result;

            if (NON_CONFIGURABLE_PRESETS.has(preset)) {
                result = preset;
            } else if (typeof preset === 'string') {
                result = [preset, presetOptions];
            } else {
                result = [preset[0], Object.assign({}, preset[1], presetOptions)];
            }

            return result;
        });
    } else {
        const fileLoc = path.relative(cwd, filepath);
        const badConfig =
            path.basename(filepath) === 'package.json'
                ? `"babel" config block of ${fileLoc}`
                : fileLoc;

        throw new Error(
            `At least one options-accepting preset (like @babel/preset-env) is required in ${badConfig}`
        );
    }

    // add @babel/plugin-external-helpers if runtime is not enabled
    if (!runtimeHelpers) {
        if (!rc.plugins) {
            rc.plugins = [require.resolve('@babel/plugin-external-helpers')];
        } else if (rc.plugins.indexOf('@babel/plugin-external-helpers') === -1) {
            rc.plugins = rc.plugins.concat(require.resolve('@babel/plugin-external-helpers'));
        }
    }

    // rollup-specific babel config
    rc.babelrc = false;
    rc.exclude = 'node_modules/**';

    return rc;
};
