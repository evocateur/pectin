'use strict';

const config = require('eslint-plugin-zillow/prettier.config');

// just here so the editor plugins don't get fired
module.exports = Object.assign({}, config, {
    overrides: [
        {
            files: [
                'lerna.json',
                'package.json',
                'package-lock.json',
                '.eslintrc.yaml',
                '.travis.yml',
            ],
            options: {
                tabWidth: 2,
            },
        },
    ],
});
