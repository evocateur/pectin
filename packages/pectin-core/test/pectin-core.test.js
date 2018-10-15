'use strict';

const path = require('path');
const util = require('util');
const { rollup } = require('rollup');
const { execFile } = require('child_process');
const Tacks = require('tacks');
const tempy = require('tempy');
const pectinCore = require('../');

const { Dir, File } = Tacks;
const execFileAsync = util.promisify(execFile);

function createFixture(pkgSpec) {
    const cwd = tempy.directory();
    const fixture = new Tacks(
        Dir({
            // .babelrc is necessary to avoid an
            // implicit resolution from repo root
            '.babelrc': File({ presets: ['env', 'react'] }),
            ...pkgSpec,
        })
    );

    fixture.create(cwd);

    return cwd;
}

describe('pectin-core', () => {
    // avoid polluting other test state
    const REPO_ROOT = path.resolve('.');

    afterAll(() => {
        process.chdir(REPO_ROOT);
    });

    it('generates rollup config from provided pkgPath', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'pkg-main',
                main: 'dist/index.js',
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        await expect(pectinCore(pkgPath)).resolves.toEqual({
            input: path.join(cwd, 'src/index.js'),
            output: [
                {
                    file: path.join(cwd, 'dist/index.js'),
                    format: 'cjs',
                    sourcemap: true,
                },
            ],
            plugins: [
                expect.objectContaining({ name: 'main-entry' }),
                expect.objectContaining({ name: 'subpath-externals' }),
                expect.objectContaining({ name: 'node-resolve' }),
                expect.objectContaining({ name: 'json' }),
                expect.objectContaining({ name: 'babel' }),
                expect.objectContaining({ name: 'commonjs' }),
            ],
        });
    });

    it('adds svg plugin via opt-in pkg.rollup.inlineSVG', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'inline-svg-data-uri',
                main: 'dist/index.js',
                rollup: {
                    inlineSVG: true,
                },
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');
        const config = await pectinCore(pkgPath);

        expect(config.plugins).toEqual([
            expect.objectContaining({ name: 'main-entry' }),
            expect.objectContaining({ name: 'subpath-externals' }),
            expect.objectContaining({ name: 'node-resolve' }),
            expect.objectContaining({ name: 'json' }),
            // order is important, must come before babel()
            expect.objectContaining({ name: 'svg' }),
            expect.objectContaining({ name: 'babel' }),
            expect.objectContaining({ name: 'commonjs' }),
        ]);
    });

    it('generates rollup config with modules output', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'pkg-module',
                main: 'dist/index.js',
                module: 'dist/index.module.js',
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        await expect(pectinCore(pkgPath)).resolves.toHaveProperty('output', [
            {
                file: path.join(cwd, 'dist/index.js'),
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: path.join(cwd, 'dist/index.module.js'),
                format: 'es',
                sourcemap: true,
            },
        ]);
    });

    it('customizes input with pkg.rollup.rootDir', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'rollup-root-dir',
                main: 'dist/rollup-root-dir.js',
                rollup: {
                    rootDir: 'modules',
                },
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        await expect(pectinCore(pkgPath)).resolves.toHaveProperty(
            'input',
            path.join(cwd, 'modules/rollup-root-dir.js')
        );
    });

    it('overrides input with pkg.rollup.input', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'rollup-input',
                main: 'dist/rollup-input.js',
                rollup: {
                    input: 'app.js',
                },
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        await expect(pectinCore(pkgPath)).resolves.toHaveProperty(
            'input',
            path.join(cwd, 'app.js')
        );
    });

    it('resolves pkgPath from cwd', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'from-cwd',
                main: 'dist/index.js',
            }),
        });

        process.chdir(cwd);

        await expect(pectinCore('package.json')).resolves.toHaveProperty(
            'input',
            path.join(cwd, 'src/index.js')
        );
    });

    it('throws an error when no pkg.main supplied', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'no-pkg-main',
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        // required to normalize snapshot
        process.chdir(cwd);

        await expect(pectinCore(pkgPath)).rejects.toThrowErrorMatchingSnapshot();
    });

    it('exports named helpers', () => {
        expect(pectinCore).toHaveProperty('createConfig');
        expect(typeof pectinCore.createConfig).toBe('function');

        expect(pectinCore).toHaveProperty('loadManifest');
        expect(typeof pectinCore.loadManifest).toBe('function');
    });

    test('integration', async () => {
        const cwd = createFixture({
            'package.json': File({
                name: 'integration',
                main: 'dist/index.js',
                module: 'dist/index.module.js',
                rollup: {
                    inlineSVG: true,
                },
                dependencies: {
                    react: '*',
                },
                devDependencies: {
                    'babel-plugin-external-helpers': '^6.22.0',
                    'babel-plugin-transform-object-rest-spread': '^6.26.0',
                    'babel-preset-env': '^1.6.0',
                    'babel-preset-react': '^6.24.1',
                },
            }),
            src: Dir({
                'test.svg': File(
                    `<?xml version="1.0" ?><svg viewBox="0 0 151.57 151.57" xmlns="http://www.w3.org/2000/svg"><line x1="47.57" x2="103.99" y1="103.99" y2="47.57"/><line x1="45.8" x2="105.7" y1="45.87" y2="105.77"/></svg>`
                ),
                'index.js': File(`
import React from 'react';
import svgTest from './test.svg';
export default function FooComponent() {
    return <div>{svgTest}</div>;
};
`),
            }),
        });
        const pkgPath = path.join(cwd, 'package.json');

        // copy over pre-installed devDependencies for babel's sake
        await execFileAsync('tar', ['-xf', path.join(__dirname, 'node_modules_fixture.tar')], {
            cwd,
        });

        const config = await pectinCore(pkgPath);
        const { output: outputOptions, ...inputOptions } = config;
        const [cjsOutput, esmOutput] = outputOptions;

        const bundle = await rollup(inputOptions);

        const esm = await bundle.write(esmOutput);
        const cjs = await bundle.write(cjsOutput);

        expect(esm.code).toMatchSnapshot('esm');
        expect(cjs.code).toMatchSnapshot('cjs');
    });
});
