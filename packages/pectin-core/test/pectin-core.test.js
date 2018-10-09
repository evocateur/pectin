'use strict';

const path = require('path');
const { rollup } = require('rollup');
const Tacks = require('tacks');
const tempy = require('tempy');
const pectinCore = require('../');

const { Dir, File } = Tacks;

function createFixture(pkgSpec) {
    const cwd = tempy.directory();
    const fixture = new Tacks(
        Dir({
            // .babelrc is necessary to avoid an
            // implicit resolution from repo root
            '.babelrc': File({
                presets: ['@babel/env'],
            }),
            ...pkgSpec,
        })
    );

    fixture.create(cwd);

    return cwd;
}

describe('pectin-core', () => {
    // avoid polluting other test state
    const REPO_ROOT = path.resolve('.');

    afterEach(() => {
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
                expect.objectContaining({ name: 'svg' }),
            ],
        });
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
            }),
            src: Dir({
                'test.svg': File(`test`),
                // a class is a lot more interesting output
                'index.js': File(`
import svgTest from './test.svg';

export default class Foo {
    bar() {
        return svgTest;
    }
};
`),
            }),
        });

        const config = await pectinCore(path.join(cwd, 'package.json'));
        const { output: outputOptions, ...inputOptions } = config;
        const [cjsOutput, esmOutput] = outputOptions;

        const bundle = await rollup(inputOptions);

        const esm = await bundle.write(esmOutput);
        const cjs = await bundle.write(cjsOutput);

        expect(esm.code).toMatchInlineSnapshot(`
"function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError(\\"Cannot call a class as a function\\");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if (\\"value\\" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var svgTest = 'data:image/svg+xml;base64,dGVzdA==';

var Foo =
/*#__PURE__*/
function () {
  function Foo() {
    _classCallCheck(this, Foo);
  }

  _createClass(Foo, [{
    key: \\"bar\\",
    value: function bar() {
      return svgTest;
    }
  }]);

  return Foo;
}();

export default Foo;
"
`);
        expect(cjs.code).toMatch("'use strict';");
        expect(cjs.code).toMatch('module.exports = Foo;');
        // transpiled code is otherwise identical
    });
});
