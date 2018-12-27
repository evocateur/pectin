'use strict';

const path = require('path');
const camelCase = require('camelcase');
const npa = require('npm-package-arg');
const dotProp = require('dot-prop');

module.exports = function getOutput(pkg, cwd, isMultiConfig) {
    const output = [];

    // generated chunks as of rollup v0.68.0 need chunkFileNames, not entryFileNames
    const chunkFileNames = dotProp.get(pkg, 'rollup.chunkFileNames', '[name]-[hash].[format].js');
    const entryFileNames = dotProp.get(pkg, 'rollup.entryFileNames', '[name].[format].js');

    const cjsConfig = {
        format: 'cjs',
    };

    if (isMultiConfig) {
        cjsConfig.dir = path.dirname(path.resolve(cwd, pkg.main));
        cjsConfig.chunkFileNames = chunkFileNames;
        // only one entry point, thus no pattern is required
        cjsConfig.entryFileNames = path.basename(pkg.main);
    } else {
        cjsConfig.file = path.resolve(cwd, pkg.main);
    }

    output.push(cjsConfig);

    if (pkg.module) {
        const esmConfig = {
            format: 'esm',
        };

        if (isMultiConfig) {
            esmConfig.dir = path.dirname(path.resolve(cwd, pkg.module));
            esmConfig.chunkFileNames = chunkFileNames;
            esmConfig.entryFileNames = entryFileNames;
        } else {
            esmConfig.file = path.resolve(cwd, pkg.module);
        }

        output.push(esmConfig);
    }

    // @see https://github.com/defunctzombie/package-browser-field-spec
    if (typeof pkg.browser === 'string') {
        // alternative main (basic)
        output.push({
            file: path.resolve(cwd, pkg.browser),
            format: 'cjs',
            browser: true,
        });
    } else if (pkg.browser) {
        // specific files (advanced)
        output.push(
            pkg.browser[pkg.main] && {
                file: path.resolve(cwd, pkg.browser[pkg.main]),
                format: 'cjs',
                browser: true,
            }
        );
        output.push(
            pkg.browser[pkg.module] && {
                file: path.resolve(cwd, pkg.browser[pkg.module]),
                format: 'esm',
                browser: true,
            }
        );
    }

    if (pkg.unpkg) {
        output.push({
            file: path.resolve(cwd, pkg.unpkg.replace(/(\.min)?\.js$/, '.dev.js')),
            format: 'umd',
            env: 'development',
        });
        output.push({
            file: path.resolve(cwd, pkg.unpkg),
            format: 'umd',
            sourcemap: true,
            env: 'production',
        });
    }

    return output
        .filter(x => Boolean(x))
        .map(obj => {
            const extra = {
                exports: obj.format === 'esm' ? 'named' : 'auto',
            };

            if (obj.format === 'umd') {
                extra.name = nameToPascalCase(pkg.name);
                extra.globals = Object.keys(pkg.peerDependencies || {}).reduce((acc, dep) => {
                    acc[dep] = nameToPascalCase(dep);

                    return acc;
                }, {});
                extra.indent = false;
            }

            return Object.assign(obj, extra);
        });
};

function safeName(name) {
    const spec = npa(name);

    return spec.scope ? spec.name.substr(spec.name.indexOf('/') + 1) : spec.name;
}

function nameToPascalCase(str) {
    const name = safeName(str);

    return camelCase(name, { pascalCase: true });
}
