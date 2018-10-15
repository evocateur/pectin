'use strict';

const path = require('path');
const camelCase = require('camelcase');
const npa = require('npm-package-arg');

module.exports = function getOutput(pkg, cwd) {
    const output = [
        {
            file: path.resolve(cwd, pkg.main),
            format: 'cjs',
        },
    ];

    if (pkg.module) {
        output.push({
            file: path.resolve(cwd, pkg.module),
            format: 'esm',
        });
    }

    // @see https://github.com/defunctzombie/package-browser-field-spec
    if (typeof pkg.browser === 'string') {
        // alternative main (basic)
        output.push({
            file: path.resolve(cwd, pkg.browser),
            format: 'cjs',
        });
    } else if (pkg.browser) {
        // specific files (advanced)
        output.push(
            pkg.browser[pkg.main] && {
                file: path.resolve(cwd, pkg.browser[pkg.main]),
                format: 'cjs',
            }
        );
        output.push(
            pkg.browser[pkg.module] && {
                file: path.resolve(cwd, pkg.browser[pkg.module]),
                format: 'esm',
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

    return output.filter(x => Boolean(x)).map(obj => {
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
