'use strict';

const path = require('path');
const Tacks = require('tacks');
const tempy = require('tempy');
const pectinBabelrc = require('../');

const { Dir, File } = Tacks;

function createFixture(spec) {
    const cwd = tempy.directory();

    new Tacks(Dir({ ...spec })).create(cwd);

    return cwd;
}

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const TEMP_DIR_REGEXP = /([^\s"]*[\\/][0-9a-f]{32})([^\s"]*)/g;
// the excluded quotes are due to other snapshot serializers mutating the raw input

expect.addSnapshotSerializer({
    test(val) {
        return typeof val === 'string' && TEMP_DIR_REGEXP.test(val);
    },
    serialize(val, config, indentation, depth) {
        const str = val.replace(TEMP_DIR_REGEXP, (match, cwd, subPath) =>
            path.join('<REPO_ROOT>', subPath)
        );

        // top-level strings don't need quotes, but nested ones do (object properties, etc)
        return depth ? `"${str}"` : str;
    },
});

describe('pectin-babelrc', () => {
    it('generates config for rollup-plugin-babel', async () => {
        const pkg = {
            name: 'babel-7-config',
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/env'],
            }),
            'package.json': File(pkg),
        });
        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [],
              "presets": Array [
                "@babel/env",
              ],
            }
        `);
    });

    it('enables runtimeHelpers when @babel/runtime is a dependency', async () => {
        const pkg = {
            name: 'helpers-runtime',
            dependencies: {
                '@babel/runtime': '^7.0.0',
                'lodash': '^4.17.4',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
            }),
            'package.json': File(pkg),
        });
        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).toHaveProperty('runtimeHelpers', true);
    });

    it('does not mutate cached config', async () => {
        const pkg = {
            name: 'no-mutate',
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['lodash'],
            }),
            'package.json': File(pkg),
        });

        const opts = await pectinBabelrc(pkg, cwd);

        // cosmiconfig caches live objects
        opts.foo = 'bar';

        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).not.toHaveProperty('foo');
    });

    it('finds babel.config.js config', async () => {
        const pkg = {
            name: 'with-babel-config-js',
        };
        const cwd = createFixture({
            'babel.config.js': File(`
                module.exports = {
                    presets: ['@babel/preset-env'],
                };
            `),
            'package.json': File(pkg),
        });

        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [],
              "presets": Array [
                "@babel/preset-env",
              ],
            }
        `);
    });

    it('finds .babelrc.js config', async () => {
        const pkg = {
            name: 'with-babelrc-js',
        };
        const cwd = createFixture({
            '.babelrc.js': File(`
                module.exports = {
                    presets: ['@babel/preset-env'],
                };
            `),
            'package.json': File(pkg),
        });
        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [],
              "presets": Array [
                "@babel/preset-env",
              ],
            }
        `);
    });

    it('finds pkg.babel config', async () => {
        const pkg = {
            name: 'with-babel-prop',
            babel: {
                presets: ['@babel/preset-env'],
            },
        };
        const cwd = createFixture({
            'package.json': File(pkg),
        });
        const rc = await pectinBabelrc(pkg, cwd);

        expect(rc).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [],
              "presets": Array [
                "@babel/preset-env",
              ],
            }
        `);
    });

    it('does not duplicate simple runtime transform', async () => {
        const pkg = {
            name: 'no-duplicate-transform-simple',
            dependencies: {
                '@babel/runtime': '^7.0.0',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-runtime', 'lodash'],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', [
            '@babel/plugin-syntax-dynamic-import',
            ['@babel/plugin-transform-runtime', { useESModules: true }],
            'lodash',
        ]);
    });

    it('does not duplicate advanced runtime transform', async () => {
        const pkg = {
            name: 'no-duplicate-transform-advanced',
            dependencies: {
                '@babel/runtime': '^7.0.0',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/env'],
                plugins: [
                    'graphql-tag',
                    [
                        '@babel/transform-runtime',
                        {
                            corejs: true,
                        },
                    ],
                ],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', [
            '@babel/plugin-syntax-dynamic-import',
            'graphql-tag',
            [
                '@babel/transform-runtime',
                {
                    corejs: true,
                    useESModules: true,
                },
            ],
        ]);
    });

    it('adds missing config to advanced runtime transform', async () => {
        const pkg = {
            name: 'add-config-transform-advanced',
            dependencies: {
                '@babel/runtime': '^7.0.0',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/env'],
                // admittedly weird...
                plugins: [['@babel/plugin-transform-runtime']],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', [
            '@babel/plugin-syntax-dynamic-import',
            ['@babel/plugin-transform-runtime', { useESModules: true }],
        ]);
    });

    it('passes { corejs: 2 } to runtime transform when alternate dependency detected', async () => {
        const pkg = {
            name: 'add-config-transform-advanced',
            dependencies: {
                '@babel/runtime-corejs2': '^7.0.0',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/env'],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', [
            '@babel/plugin-syntax-dynamic-import',
            ['@babel/plugin-transform-runtime', { useESModules: true, corejs: 2 }],
        ]);
    });

    it('passes { corejs: 3 } to runtime transform when alternate dependency detected', async () => {
        const pkg = {
            name: 'add-config-transform-advanced',
            dependencies: {
                '@babel/runtime-corejs3': '^7.4.0',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/env'],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', [
            '@babel/plugin-syntax-dynamic-import',
            ['@babel/plugin-transform-runtime', { useESModules: true, corejs: 3 }],
        ]);
    });

    it('does not duplicate existing @babel/syntax-dynamic-import plugin', async () => {
        const pkg = {
            name: 'no-duplicate-syntax',
            dependencies: {
                lodash: '*',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['lodash', '@babel/syntax-dynamic-import'],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'esm' });

        expect(opts).toHaveProperty('plugins', ['lodash', '@babel/syntax-dynamic-import']);
    });

    it('does not add syntax-dynamic-import plugin to non-ESM format', async () => {
        const pkg = {
            name: 'no-cjs-dynamic-import',
            dependencies: {
                lodash: '*',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['lodash'],
            }),
            'package.json': File(pkg),
        });
        const opts = await pectinBabelrc(pkg, cwd, { format: 'cjs' });

        expect(opts).toHaveProperty('plugins', ['lodash']);
    });

    it('throws an error when .babelrc preset is missing', async () => {
        const pkg = {
            name: 'no-presets',
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                plugins: ['lodash'],
            }),
            'package.json': File(pkg),
        });

        try {
            await pectinBabelrc(pkg, cwd);
        } catch (err) {
            expect(err.message).toMatchInlineSnapshot(
                `"At least one preset (like @babel/preset-env) is required in .babelrc"`
            );
        }

        expect.assertions(1);
    });

    it('throws an error when pkg.babel preset is missing', async () => {
        const pkg = {
            name: 'no-prop-presets',
            babel: {
                plugins: ['lodash'],
            },
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            'package.json': File(pkg),
        });

        try {
            await pectinBabelrc(pkg, cwd);
        } catch (err) {
            expect(err.message).toMatchInlineSnapshot(
                `"At least one preset (like @babel/preset-env) is required in \\"babel\\" config block of package.json"`
            );
        }

        expect.assertions(1);
    });

    it('throws an error when no babel config found', async () => {
        const pkg = {
            name: 'no-babel-config',
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            'package.json': File(pkg),
        });

        try {
            await pectinBabelrc(pkg, cwd);
        } catch (err) {
            expect(err.message).toMatchInlineSnapshot(
                `"Babel configuration is required for no-babel-config, but no config file was found."`
            );
        }

        expect.assertions(1);
    });

    it('works all together', async () => {
        const pkg1 = {
            name: 'pkg1',
        };
        const pkg2 = {
            name: 'pkg2',
            babel: {
                presets: ['@babel/env'],
                plugins: ['lodash'],
            },
        };
        const pkg3 = {
            name: 'pkg3',
            dependencies: {
                '@babel/runtime': '*',
            },
        };
        const pkg4 = {
            name: 'pkg4',
            dependencies: {
                '@babel/runtime': '*',
            },
        };

        const cwd = createFixture({
            'package.json': File({
                name: 'monorepo',
                private: true,
                babel: {
                    presets: ['@babel/preset-env'],
                    plugins: ['@babel/plugin-proposal-object-rest-spread'],
                },
            }),
            'packages': Dir({
                pkg1: Dir({
                    'package.json': File(pkg1),
                }),
                pkg2: Dir({
                    'package.json': File(pkg2),
                }),
                pkg3: Dir({
                    '.babelrc': File({
                        presets: ['@babel/preset-env'],
                    }),
                    'package.json': File(pkg3),
                }),
                pkg4: Dir({
                    'package.json': File(pkg4),
                }),
            }),
        });

        pkg1.cwd = path.join(cwd, 'packages', 'pkg1');
        pkg2.cwd = path.join(cwd, 'packages', 'pkg2');
        pkg3.cwd = path.join(cwd, 'packages', 'pkg3');
        pkg4.cwd = path.join(cwd, 'packages', 'pkg4');

        const [config1, config2, config3, config4] = await Promise.all([
            pectinBabelrc(pkg1, pkg1.cwd),
            pectinBabelrc(pkg2, pkg2.cwd),
            pectinBabelrc(pkg3, pkg3.cwd),
            pectinBabelrc(pkg4, pkg4.cwd, { format: 'esm' }),
        ]);

        expect(config1).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>/packages/pkg1",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [
                "@babel/plugin-proposal-object-rest-spread",
              ],
              "presets": Array [
                "@babel/preset-env",
              ],
            }
        `);
        expect(config2).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>/packages/pkg2",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [
                "lodash",
              ],
              "presets": Array [
                "@babel/env",
              ],
            }
        `);
        expect(config3).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>/packages/pkg3",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [
                Array [
                  "@babel/plugin-transform-runtime",
                  Object {
                    "useESModules": false,
                  },
                ],
              ],
              "presets": Array [
                "@babel/preset-env",
              ],
              "runtimeHelpers": true,
            }
        `);
        expect(config4).toMatchInlineSnapshot(`
            Object {
              "babelrc": false,
              "cwd": "<REPO_ROOT>/packages/pkg4",
              "exclude": "node_modules/**",
              "extensions": Array [
                ".js",
                ".jsx",
                ".es6",
                ".es",
                ".mjs",
                ".ts",
                ".tsx",
              ],
              "plugins": Array [
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-proposal-object-rest-spread",
                Array [
                  "@babel/plugin-transform-runtime",
                  Object {
                    "useESModules": true,
                  },
                ],
              ],
              "presets": Array [
                "@babel/preset-env",
              ],
              "runtimeHelpers": true,
            }
        `);
    });
});
