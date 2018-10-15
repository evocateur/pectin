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

    return output.filter(x => Boolean(x)).map(obj => {
        const extra = {
            exports: obj.format === 'esm' ? 'named' : 'auto',
        };

        return Object.assign(obj, extra);
    });
};
