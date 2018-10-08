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

describe('pectin-babelrc', () => {
    it('appends @babel/plugin-external-helpers to babelrc plugins when missing', async () => {
        const pkg = {
            name: 'helpers-external',
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['transform-object-rest-spread'],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
    });

    it('does not duplicate @babel/plugin-external-helpers in babelrc plugins', async () => {
        const pkg = {
            name: 'helpers-existing',
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-external-helpers', 'lodash'],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
    });

    it('does not pass options to non-configurable presets', async () => {
        const pkg = {
            name: 'preset-non-config',
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env', 'react'],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
    });

    it('overrides preset modules config', async () => {
        const pkg = {
            name: 'preset-config-override',
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: [['@babel/preset-env', { loose: true, modules: 'commonjs' }]],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
    });

    it('enables runtimeHelpers when @babel/runtime is a dep', async () => {
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
                plugins: [],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
    });

    it('creates babelrc plugins if missing', async () => {
        const pkg = {
            name: 'no-plugins',
            dependencies: {
                lodash: '^4.17.4',
            },
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
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

        const opts = pectinBabelrc(pkg, cwd);

        // cosmiconfig caches live objects
        opts.foo = 'bar';

        await expect(pectinBabelrc(pkg, cwd)).resolves.not.toHaveProperty('foo');
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

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
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

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
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

        await expect(pectinBabelrc(pkg, cwd)).resolves.toMatchSnapshot();
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

        await expect(pectinBabelrc(pkg, cwd)).rejects.toThrowErrorMatchingSnapshot();
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

        await expect(pectinBabelrc(pkg, cwd)).rejects.toThrowErrorMatchingSnapshot();
    });

    it('throws an error when no configurable preset is found', async () => {
        const pkg = {
            name: 'no-configurable-preset',
        };
        const cwd = createFixture({
            '.babelrc': File({
                presets: ['react'],
            }),
            'package.json': File(pkg),
        });

        await expect(pectinBabelrc(pkg, cwd)).rejects.toThrowErrorMatchingSnapshot();
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

        expect(config1).toMatchObject({
            plugins: [
                'transform-object-rest-spread',
                expect.stringContaining('@babel/plugin-external-helpers'),
            ],
        });
        expect(config2).toMatchObject({
            plugins: ['lodash', expect.stringContaining('@babel/plugin-external-helpers')],
        });
        expect(config3).toMatchObject({
            plugins: [expect.stringContaining('@babel/plugin-external-helpers')],
        });
        expect(config4).toMatchObject({
            presets: [['@babel/preset-env', {}]],
            plugins: ['transform-object-rest-spread'],
        });
    });
});
