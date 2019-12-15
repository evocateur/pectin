import path = require('path');
import cloneDeep = require('clone-deep');
import { cosmiconfig } from 'cosmiconfig';
import resolveFrom = require('resolve-from');

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { OutputOptions } from 'rollup';

// lazy copypasta of https://github.com/babel/babel/blob/e74efd2/packages/babel-core/src/config/validation/options.js#L249-L257
type PluginOptions = {};
type PluginTarget = string;
type PluginIdentifier = string;
type PluginItem =
    | PluginTarget
    | [PluginTarget, PluginOptions]
    | [PluginTarget, PluginOptions, PluginIdentifier];

// TODO: employ @rollup/plugin-babel types when they are available
type RuntimeConfig = {
    babelrc: boolean;
    cwd: string;
    exclude: string;
    extensions: string[];
    presets: PluginItem[];
    plugins: PluginItem[];
    runtimeHelpers?: boolean;
};

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

function isRuntimeTransform(plugin: string): boolean {
    return /@babel\/(plugin-)?transform-runtime/.test(plugin);
}

function hasSimpleTransform(plugin: string | unknown): boolean {
    return typeof plugin === 'string' && isRuntimeTransform(plugin);
}

function hasAdvancedTransform(plugin: string[] | unknown): boolean {
    return Array.isArray(plugin) && isRuntimeTransform(plugin[0]);
}

// @see https://github.com/babel/babel/issues/10261
// @see https://github.com/babel/babel/pull/10325
function resolveDependencyVersion(cwd: string, depName: string): string | undefined {
    // we can't do a straight-up `require('@babel/runtime/package.json')`
    // because that doesn't respect the target package's cwd
    const pkgPath = resolveFrom(cwd, `${depName}/package.json`);

    // istanbul ignore next: undefined doesn't matter, we tried our best
    // eslint-disable-next-line global-require, zillow/import/no-dynamic-require
    return pkgPath ? require(pkgPath).version : undefined;
}

type BabelEntryOptions = {
    useESModules: boolean;
    version: string | undefined;
    corejs?: number;
};

function ensureRuntimeHelpers(rc: RuntimeConfig, entryOptions: BabelEntryOptions): void {
    if (rc.plugins.some(hasSimpleTransform)) {
        const idx = rc.plugins.findIndex(hasSimpleTransform);
        const name = rc.plugins[idx] as string;

        rc.plugins.splice(idx, 1, [name, entryOptions]);
    } else if (rc.plugins.some(hasAdvancedTransform)) {
        const idx = rc.plugins.findIndex(hasAdvancedTransform);
        const [name, config = {}] = rc.plugins[idx] as [PluginTarget, PluginOptions];

        rc.plugins.splice(idx, 1, [name as string, { ...config, ...entryOptions }]);
    } else {
        rc.plugins.push(['@babel/plugin-transform-runtime', entryOptions]);
    }

    // eslint-disable-next-line no-param-reassign
    rc.runtimeHelpers = true;
}

function hasDynamicImportSyntax(plugin: string): boolean {
    return typeof plugin === 'string' && /@babel\/(plugin-)?syntax-dynamic-import/.test(plugin);
}

export default async function babelrc(
    pkg: PackageManifest,
    cwd: string = process.cwd(),
    output?: OutputOptions
): Promise<RuntimeConfig> {
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
            version: resolveDependencyVersion(cwd, '@babel/runtime'),
        });
    } else if (deps.has('@babel/runtime-corejs2')) {
        ensureRuntimeHelpers(rc, {
            useESModules: format === 'esm',
            version: resolveDependencyVersion(cwd, '@babel/runtime-corejs2'),
            corejs: 2,
        });
    } else if (deps.has('@babel/runtime-corejs3')) {
        ensureRuntimeHelpers(rc, {
            useESModules: format === 'esm',
            version: resolveDependencyVersion(cwd, '@babel/runtime-corejs3'),
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
    rc.cwd = cwd;

    return rc;
}
