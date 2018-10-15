'use strict';

const path = require('path');

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

    return output.filter(x => Boolean(x)).map(obj => {
        const extra = {
            exports: obj.format === 'esm' ? 'named' : 'auto',
        };

        return Object.assign(obj, extra);
    });
};
