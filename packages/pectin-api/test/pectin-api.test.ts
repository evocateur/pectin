import path = require('path');
import Tacks = require('tacks');
import tempy = require('tempy');
import touch = require('touch');
import { findConfigs, generateConfig, isUpToDate } from '../lib/pectin-api';

const { Dir, File, Symlink } = Tacks;

type UpdateHelper = {
    (fp: string): Promise<void>;
    cwd: string;
};

const makeUpdater = (cwd: string): UpdateHelper => {
    const ctime = Date.now() / 1000;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore (the types are wrong, stuff it mr. typescript)
    const opts: touch.Options = { mtime: ctime + 1 };
    const updater = async (fp: string): Promise<void> => touch(path.join(cwd, 'modules', fp), opts);

    // avoid process.cwd() calls
    updater.cwd = cwd;

    return updater;
};

type TacksItem = Tacks.Dir | Tacks.File | Tacks.Symlink;

function createFixture(pkgSpec: { [fp: string]: TacksItem }): UpdateHelper {
    const cwd = tempy.directory();
    const fixture = new Tacks(
        Dir({
            '.babelrc': File({
                presets: ['@babel/preset-env'],
            }),
            'lerna.json': File({
                packages: ['modules/**'],
            }),
            'package.json': File({
                name: 'monorepo',
                private: true,
            }),
            'modules': Dir(pkgSpec),
        })
    );

    fixture.create(cwd);
    process.chdir(cwd);

    return makeUpdater(cwd);
}

describe('pectin-api', () => {
    // avoid polluting other test state
    const REPO_ROOT = path.resolve(__dirname, '../../..');

    afterAll(() => {
        process.chdir(REPO_ROOT);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete process.env.ROLLUP_WATCH;
    });

    it('builds packages when output directory is missing', async () => {
        createFixture({
            'no-output': Dir({
                'package.json': File({
                    name: '@test/no-output',
                    main: 'dist/index.js',
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            }),
        });

        await expect(findConfigs()).resolves.toMatchObject([
            { input: 'modules/no-output/src/index.js' },
        ]);
    });

    it('builds packages in topological order', async () => {
        createFixture({
            'a-dependent': Dir({
                'package.json': File({
                    name: '@test/a-dependent',
                    main: 'dist/index.js',
                    dependencies: {
                        '@test/their-dependency': 'file:../their-dependency',
                    },
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            }),
            'their-dependency': Dir({
                'package.json': File({
                    name: '@test/their-dependency',
                    main: 'dist/index.js',
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            }),
        });

        await expect(findConfigs()).resolves.toMatchObject([
            { input: 'modules/their-dependency/src/index.js' },
            { input: 'modules/a-dependent/src/index.js' },
        ]);
    });

    it('builds packages when input files are newer than output', async () => {
        const updateFile = createFixture({
            'old-output': Dir({
                'package.json': File({
                    name: '@test/old-output',
                    main: 'lib/index.js',
                }),
                'lib': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default from "./other";'),
                    'other.js': File('export default "test";'),
                }),
            }),
        });

        await updateFile('old-output/src/other.js');

        await expect(findConfigs()).resolves.toMatchObject([
            { input: 'modules/old-output/src/index.js' },
        ]);
    });

    it('matches .jsx files, too', async () => {
        const updateFile = createFixture({
            'jsx-input': Dir({
                'package.json': File({
                    name: '@test/jsx-input',
                    main: 'dist/index.js',
                }),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default from "./other";'),
                    'other.jsx': File('export default "test";'),
                }),
            }),
        });

        await updateFile('jsx-input/src/other.jsx');

        await expect(findConfigs()).resolves.toMatchObject([
            { input: 'modules/jsx-input/src/index.js' },
        ]);
    });

    it('does not build when input files are older than output', async () => {
        const updateFile = createFixture({
            'old-input': Dir({
                'package.json': File({
                    name: '@test/old-input',
                    main: 'lib/index.js',
                }),
                'lib': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default from "./other";'),
                    'other.js': File('export default "test";'),
                }),
            }),
        });

        await Promise.all([
            updateFile('old-input/lib/index.js'),
            // less than OR equal
            updateFile('old-input/src/other.js'),
        ]);

        await expect(findConfigs()).resolves.toStrictEqual([]);
    });

    it('does not compare build output with itself', async () => {
        const updateFile = createFixture({
            'rooted-input': Dir({
                'package.json': File({
                    name: '@test/rooted-input',
                    main: 'dist/index.js',
                    rollup: {
                        input: 'app.js',
                    },
                }),
                'app.js': File('export default "test";'),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
            }),
        });

        await updateFile('rooted-input/dist/index.js');

        await expect(findConfigs()).resolves.toStrictEqual([]);
    });

    it('does not compare tests or node_modules with last build', async () => {
        const updateFile = createFixture({
            'rooted-ignore': Dir({
                'package.json': File({
                    name: '@test/rooted-ignore',
                    main: 'dist/index.js',
                    rollup: {
                        input: 'app.js',
                    },
                }),
                'app.js': File('export default "test";'),
                '__tests__': Dir({
                    'ignored.js': File('ignored'),
                }),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'node_modules': Dir({
                    foo: Dir({
                        'index.js': File('ignored'),
                        'package.json': File({
                            name: 'foo',
                            main: 'index.js',
                        }),
                    }),
                }),
                'src': Dir({
                    '__tests__': Dir({
                        'ignored.js': File('ignored'),
                    }),
                    'ignored-test.js': File('ignored'),
                    'ignored.test.js': File('ignored'),
                }),
                'test': Dir({
                    'ignored.js': File('ignored'),
                }),
            }),
        });

        await Promise.all([
            updateFile('rooted-ignore/__tests__/ignored.js'),
            updateFile('rooted-ignore/node_modules/foo/index.js'),
            updateFile('rooted-ignore/src/__tests__/ignored.js'),
            updateFile('rooted-ignore/src/ignored-test.js'),
            updateFile('rooted-ignore/src/ignored.test.js'),
            updateFile('rooted-ignore/test/ignored.js'),
        ]);

        await expect(findConfigs()).resolves.toStrictEqual([]);
    });

    it('does not watch a module with pkg.rollup.ignoreWatch', async () => {
        const updateFile = createFixture({
            unwatched: Dir({
                'package.json': File({
                    name: '@test/unwatched',
                    main: 'dist/index.js',
                    rollup: {
                        ignoreWatch: true,
                    },
                }),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            }),
        });

        await updateFile('unwatched/src/index.js');

        // simulate `rollup --watch`
        process.env.ROLLUP_WATCH = 'true';

        await expect(findConfigs()).resolves.toStrictEqual([]);
    });

    it('does not build a module with pkg.rollup.skip', async () => {
        createFixture({
            skipped: Dir({
                'package.json': File({
                    name: '@test/skipped',
                    main: 'dist/index.js',
                    rollup: {
                        skip: true,
                    },
                }),
                'lib': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
            }),
        });

        await expect(findConfigs()).resolves.toStrictEqual([]);
    });

    it('does not build a module with missing pkg.main', async () => {
        // avoid console spam when error is logged
        jest.spyOn(console, 'error').mockImplementation(() => {});

        createFixture({
            'no-pkg-main': Dir({
                'package.json': File({
                    name: '@test/no-pkg-main',
                }),
                'lib': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
            }),
        });

        await expect(findConfigs()).resolves.toStrictEqual([]);

        // eslint-disable-next-line no-console
        expect(console.error).toHaveBeenCalled();
    });

    it('uses cwd argument instead of implicit process.cwd()', async () => {
        const { cwd } = createFixture({
            'explicit-cwd': Dir({
                'package.json': File({
                    name: '@test/explicit-cwd',
                    main: 'dist/index.js',
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            }),
        });

        // change implicit process.cwd()
        process.chdir(REPO_ROOT);

        await expect(findConfigs({ cwd })).resolves.toMatchObject([
            {
                input: path.relative('.', path.join(cwd, 'modules/explicit-cwd/src/index.js')),
            },
        ]);
    });

    it('supports recursive package globs', async () => {
        const updateFile = createFixture({
            app: Dir({
                'package.json': File({
                    name: '@test/app',
                    main: 'dist/index.js',
                    dependencies: {
                        'missing-dist': '../lib/missing-dist',
                    },
                }),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'node_modules': Dir({
                    'missing-dist': Symlink('../../lib/missing-dist'),
                }),
                'src': Dir({
                    'index.js': File('export default from "./other";'),
                    'other.js': File('export default "test";'),
                }),
            }),
            lib: Dir({
                'missing-dist': Dir({
                    'package.json': File({
                        name: '@test/missing-dist',
                        main: 'dist/index.js',
                        module: 'dist/index.module.js',
                        dependencies: {
                            bar: '^1.0.0',
                        },
                    }),
                    'node_modules': Dir({
                        bar: Dir({
                            'lib': Dir({
                                'index.js': File('ignored'),
                            }),
                            'package.json': File({
                                name: 'bar',
                                main: 'lib/index.js',
                            }),
                            'src': Dir({
                                'index.js': File('do not transpile node_modules :P'),
                            }),
                        }),
                    }),
                    'src': Dir({
                        'index.js': File('export default "test";'),
                    }),
                }),
            }),
        });

        await Promise.all([
            updateFile('app/src/other.js'),
            updateFile('lib/missing-dist/node_modules/bar/src/index.js'),
        ]);

        await expect(findConfigs()).resolves.toMatchObject([
            {
                input: 'modules/lib/missing-dist/src/index.js',
                output: [{ format: 'cjs', exports: 'auto' }],
            },
            {
                input: 'modules/lib/missing-dist/src/index.js',
                output: [{ format: 'esm', exports: 'named' }],
            },
            {
                input: 'modules/app/src/index.js',
                output: [{ format: 'cjs', exports: 'auto' }],
            },
        ]);
    });

    it('sets watch config for all inputs when enabled', async () => {
        const updateFile = createFixture({
            'watch-existing': Dir({
                'package.json': File({
                    name: '@test/watch-existing',
                    main: 'lib/index.js',
                    module: 'lib/index.module.js',
                }),
                'lib': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default from "./other";'),
                    'other.js': File('export default "test";'),
                }),
            }),
            'watch-missing': Dir({
                'package.json': File({
                    name: '@test/watch-missing',
                    main: 'lib/index.js',
                }),
                'src': Dir({
                    'index.js': File('export default "unbuilt";'),
                }),
            }),
        });

        await Promise.all([
            updateFile('watch-existing/lib/index.js'),
            // watch always builds _everything_
            updateFile('watch-existing/src/other.js'),
        ]);

        await expect(findConfigs({ watch: true })).resolves.toMatchObject([
            { watch: { clearScreen: false } },
            { watch: { clearScreen: false } },
            { watch: { clearScreen: false } },
        ]);
    });

    describe('generateConfig', () => {
        it('supports 1.x cwd config location', async () => {
            const { cwd } = createFixture({
                'package.json': File({
                    name: '@test/pkg-cwd',
                    main: 'dist/index.js',
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            });
            const pkg = {
                name: '@test/pkg-cwd',
                main: 'dist/index.js',
                cwd,
            };
            const opts = {};
            const config = await generateConfig(pkg, opts);

            expect(config).toMatchObject([
                {
                    input: 'src/index.js',
                    output: [{ format: 'cjs', exports: 'auto' }],
                },
            ]);
            // options are not mutated
            expect(opts).toStrictEqual({});
        });
    });

    describe('isUpToDate', () => {
        it('supports 1.x argument signature', async () => {
            const updateFile = createFixture({
                'package.json': File({
                    name: '@test/up-to-date',
                    main: 'dist/index.js',
                }),
                'dist': Dir({
                    'index.js': File('module.exports = "test";'),
                }),
                'src': Dir({
                    'index.js': File('export default "test";'),
                }),
            });
            const { cwd } = updateFile;

            await updateFile('src/index.js');

            const result = await isUpToDate(
                { cwd },
                {
                    input: 'src/index.js',
                    output: [
                        {
                            file: path.resolve(cwd, 'dist/index.js'),
                            format: 'cjs',
                            exports: 'auto',
                        },
                    ],
                }
            );

            expect(result).toBe(false);
        });
    });
});
