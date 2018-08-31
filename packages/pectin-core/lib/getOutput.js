'use strict';

const path = require('path');

module.exports = function getOutput({ main, module, cwd }) {
    const output = [
        {
            file: path.resolve(cwd, main),
            format: 'cjs',
            sourcemap: true,
        },
    ];

    if (module) {
        output.push({
            file: path.resolve(cwd, module),
            format: 'es',
            sourcemap: true,
        });
    }

    return output;
};
