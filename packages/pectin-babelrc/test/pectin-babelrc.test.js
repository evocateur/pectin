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

const REPO_ROOT = path.resolve(__dirname, '../../..');

expect.addSnapshotSerializer({
    test(val) {
        return typeof val === 'string' && val.indexOf(REPO_ROOT) > -1;
    },
    serialize(val, config, indentation, depth) {
        const str = val.replace(REPO_ROOT, '<REPO_ROOT>');

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
  "exclude": "node_modules/**",
  "presets": Array [
    "@babel/env",
  ],
  "runtimeHelpers": false,
}
`);
    });

    it('enables runtimeHelpers when @babel/runtime is a dependency', async () => {
        const pkg = {
            name: 'helpers-runtime',
            dependencies: {
                '@babel/runtime': '^7.0.0',
                lodash: '^4.17.4',
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
  "exclude": "node_modules/**",
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
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
  "exclude": "node_modules/**",
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
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
  "exclude": "node_modules/**",
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
}
`);
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

    test('integration', async () => {
        const pkg1 = {
            name: 'pkg1',
        };
        const pkg2 = {
            name: 'pkg2',
            babel: {
                presets: ['@babel/preset-env'],
                plugins: ['lodash'],
            },
        };
        const pkg3 = {
            name: 'pkg3',
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
                    plugins: ['transform-object-rest-spread'],
                },
            }),
            packages: Dir({
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
            pectinBabelrc(pkg4, pkg4.cwd),
        ]);

        expect(config1).toMatchInlineSnapshot(`
Object {
  "babelrc": false,
  "exclude": "node_modules/**",
  "plugins": Array [
    "transform-object-rest-spread",
  ],
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
}
`);
        expect(config2).toMatchInlineSnapshot(`
Object {
  "babelrc": false,
  "exclude": "node_modules/**",
  "plugins": Array [
    "lodash",
  ],
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
}
`);
        expect(config3).toMatchInlineSnapshot(`
Object {
  "babelrc": false,
  "exclude": "node_modules/**",
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": false,
}
`);
        expect(config4).toMatchInlineSnapshot(`
Object {
  "babelrc": false,
  "exclude": "node_modules/**",
  "plugins": Array [
    "transform-object-rest-spread",
  ],
  "presets": Array [
    "@babel/preset-env",
  ],
  "runtimeHelpers": true,
}
`);
    });
});
