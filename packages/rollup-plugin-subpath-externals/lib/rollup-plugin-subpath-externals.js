'use strict';

const builtins = require('builtin-modules');

// ensure subpath imports (lodash, babel-runtime) are also externalized
module.exports = function subpathExternals(pkg, output) {
    const { format } = output || {};
    const { dependencies = {}, peerDependencies = {} } = pkg;
    const pkgDeps =
        format !== 'umd'
            ? Object.keys(dependencies).concat(Object.keys(peerDependencies))
            : Object.keys(peerDependencies);

    // subpath imports always begin with module name (never on builtins)
    const subPathImport = new RegExp(`^(${pkgDeps.join('|')})/`);

    // rollup-plugin-node-resolve emits silly warnings even with preferBuiltins: true
    const resolvedExternals = new Set(pkgDeps.concat(builtins));

    function externalPredicate(id, parentId, isResolved) {
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
};
