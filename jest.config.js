'use strict';

// http://facebook.github.io/jest/docs/en/configuration.html#content
module.exports = {
    clearMocks: true,
    collectCoverageFrom: ['**/lib/*.js', '!packages/pectin-core/lib/globalModule.js'],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['cobertura', 'html', 'text'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    roots: ['<rootDir>/packages'],
    testEnvironment: 'node',
};
