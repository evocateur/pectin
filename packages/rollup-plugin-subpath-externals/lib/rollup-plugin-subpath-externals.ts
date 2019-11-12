import builtins = require('builtin-modules');
import dotProp = require('dot-prop');

import { CoreProperties as PackageManifest } from '@schemastore/package';

// ensure subpath imports (lodash, babel-runtime) are also externalized
export default function subpathExternals(pkg: PackageManifest, output) {
    const external = dotProp.get(pkg, 'rollup.external');
    const bundled = dotProp.get(pkg, 'rollup.bundle');
    const { format } = output || {};
    const { dependencies = {}, peerDependencies = {} } = pkg;

    let pkgDeps;

    if (external) {
        pkgDeps = external;
    } else if (format === 'umd') {
        pkgDeps = Object.keys(peerDependencies);
    } else {
        pkgDeps = Object.keys(dependencies).concat(Object.keys(peerDependencies));
    }

    if (bundled) {
        const inlined = new Set(bundled);

        pkgDeps = pkgDeps.filter(dep => !inlined.has(dep));
    }

    // subpath imports always begin with module name (never on builtins)
    const subPathImport = new RegExp(`^(${pkgDeps.join('|')})/`);

    // rollup-plugin-node-resolve emits silly warnings even with preferBuiltins: true
    const resolvedExternals = new Set(pkgDeps.concat(builtins));

    function externalPredicate(id, _parentId, isResolved) {
        if (isResolved === true) {
            // early return when the work has already been done
            return resolvedExternals.has(id);
        }

        if (id[0] === '.') {
            // always ignore relative imports
            return false;
        }

        if (resolvedExternals.has(id)) {
            // short-circuit for exact matches
            return true;
        }

        if (subPathImport.test(id)) {
            // enable subsequent short-circuit
            resolvedExternals.add(id);

            return true;
        }

        return false;
    }

    return {
        name: 'subpath-externals',
        options: opts => {
            // eslint-disable-next-line no-param-reassign
            opts.external = externalPredicate;
        },
    };
}
