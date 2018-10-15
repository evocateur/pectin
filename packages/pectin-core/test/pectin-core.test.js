'use strict';

const path = require('path');
const { rollup } = require('rollup');
const Tacks = require('tacks');
const tempy = require('tempy');
const pMap = require('p-map');
const pectinCore = require('../');

const { Dir, File } = Tacks;

function createFixture(pkgSpec) {
    const cwd = tempy.directory();
    const fixture = new Tacks(
        Dir({
            // .babelrc is necessary to avoid an
            // implicit resolution from repo root
            '.babelrc': File({
                presets: ['@babel/env', '@babel/preset-react'],
            }),
            ...pkgSpec,
        })
    );

    fixture.create(cwd);

    return cwd;
}

function generateResults(configs) {
    if (!Array.isArray(configs)) {
        // eslint-disable-next-line no-param-reassign
        configs = [configs];
    }

    return pMap(configs, ({ output: outputOptions, ...inputOptions }) =>
        rollup(inputOptions).then(bundle => {
            if (Array.isArray(outputOptions)) {
                return Promise.all(outputOptions.map(opts => bundle.generate(opts)));
            }

            return bundle.generate(outputOptions);
        })
    ).then(results =>
        // flatten results
        results.reduce((arr, result) => arr.concat(result), [])
    );
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
                    exports: 'auto',
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
                exports: 'auto',
            },
            {
                file: path.join(cwd, 'dist/index.module.js'),
                format: 'esm',
                exports: 'named',
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

        expect(pectinCore).toHaveProperty('createMultiConfig');
        expect(typeof pectinCore.createMultiConfig).toBe('function');

        expect(pectinCore).toHaveProperty('loadManifest');
        expect(typeof pectinCore.loadManifest).toBe('function');
    });

    it('generates basic pkg.browser output', async () => {
        const pkg = {
            name: 'basic-browser-outputs',
            main: './dist/index.js',
            module: './dist/index.module.js',
            browser: './dist/index.browser.js',
        };
        const cwd = createFixture({
            'package.json': File(pkg),
            src: Dir({
                'index.js': File('export default class Basic {};'),
            }),
        });

        const configs = await pectinCore.createMultiConfig(pkg, { cwd });
        const results = await generateResults(configs);
        const fileNames = results.map(result => `dist/${result.fileName}`);
        const [cjsMain, esmModule, cjsBrowser] = results.map(
            result => `// dist/${result.fileName}\n${result.code}`
        );

        expect(fileNames).toEqual([
            'dist/index.js',
            'dist/index.module.js',
            'dist/index.browser.js',
        ]);
        expect(cjsMain).toMatchInlineSnapshot(`
"// dist/index.js
'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError(\\"Cannot call a class as a function\\");
  }
}

var Basic = function Basic() {
  _classCallCheck(this, Basic);
};

module.exports = Basic;
"
`);
        expect(esmModule).toMatchInlineSnapshot(`
"// dist/index.module.js
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError(\\"Cannot call a class as a function\\");
  }
}

var Basic = function Basic() {
  _classCallCheck(this, Basic);
};

export default Basic;
"
`);
        expect(cjsBrowser).toMatchInlineSnapshot(`
"// dist/index.browser.js
'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError(\\"Cannot call a class as a function\\");
  }
}

var Basic = function Basic() {
  _classCallCheck(this, Basic);
};

module.exports = Basic;
"
`);
    });

    it('generates advanced pkg.browser outputs', async () => {
        const pkg = {
            name: 'advanced-browser-outputs',
            main: './dist/index.js',
            module: './dist/index.module.js',
            browser: {
                './dist/index.js': './dist/index.browser.js',
                './dist/index.module.js': './dist/index.module.browser.js',
            },
            dependencies: {
                '@babel/runtime': '^7.0.0',
            },
        };
        const cwd = createFixture({
            'package.json': File(pkg),
            src: Dir({
                'index.js': File('export default class Advanced {};'),
            }),
        });
        const configs = await pectinCore.createMultiConfig(pkg, { cwd });
        const results = await generateResults(configs);
        const fileNames = results.map(result => `dist/${result.fileName}`);
        const [cjsMain, esmModule, cjsBrowser, esmBrowser] = results.map(
            result => `// dist/${result.fileName}\n${result.code}`
        );

        expect(fileNames).toEqual([
            'dist/index.js',
            'dist/index.module.js',
            'dist/index.browser.js',
            'dist/index.module.browser.js',
        ]);

        expect(cjsMain).toMatchInlineSnapshot(`
"// dist/index.js
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));

var Advanced = function Advanced() {
  _classCallCheck(this, Advanced);
};

module.exports = Advanced;
"
`);
        expect(esmModule).toMatchInlineSnapshot(`
"// dist/index.module.js
import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';

var Advanced = function Advanced() {
  _classCallCheck(this, Advanced);
};

export default Advanced;
"
`);
        expect(cjsBrowser).toMatchInlineSnapshot(`
"// dist/index.browser.js
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));

var Advanced = function Advanced() {
  _classCallCheck(this, Advanced);
};

module.exports = Advanced;
"
`);
        expect(esmBrowser).toMatchInlineSnapshot(`
"// dist/index.module.browser.js
import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';

var Advanced = function Advanced() {
  _classCallCheck(this, Advanced);
};

export default Advanced;
"
`);
    });

    it('generates pkg.unpkg UMD output for unscoped package with peers', async () => {
        const pkg = {
            name: 'unpkg-umd-output',
            main: './dist/index.js',
            module: './dist/index.module.js',
            unpkg: './dist/index.min.js',
            peerDependencies: {
                react: '*',
            },
            dependencies: {
                '@babel/runtime': '^7.0.0',
            },
        };
        const cwd = createFixture({
            'package.json': File(pkg),
            src: Dir({
                'index.js': File(
                    'import React from "react"; export default () => React.render("woo");'
                ),
            }),
        });
        const configs = await pectinCore.createMultiConfig(pkg, { cwd });
        const results = await generateResults(configs);
        const fileNames = results.map(result => `dist/${result.fileName}`);
        const minOutput = results.pop().code;
        const umdOutput = results.pop().code;

        expect(fileNames).toContain('dist/index.dev.js');
        expect(fileNames).toContain('dist/index.min.js');
        expect(umdOutput).toMatchInlineSnapshot(`
"(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
typeof define === 'function' && define.amd ? define(['react'], factory) :
(global.UnpkgUmdOutput = factory(global.React));
}(this, (function (React) { 'use strict';

React = React && React.hasOwnProperty('default') ? React['default'] : React;

var index = (function () {
  return React.render(\\"woo\\");
});

return index;

})));
"
`);
        expect(minOutput).toMatchInlineSnapshot(`
"!function(e,t){\\"object\\"==typeof exports&&\\"undefined\\"!=typeof module?module.exports=t(require(\\"react\\")):\\"function\\"==typeof define&&define.amd?define([\\"react\\"],t):e.UnpkgUmdOutput=t(e.React)}(this,function(e){\\"use strict\\";e=e&&e.hasOwnProperty(\\"default\\")?e.default:e;return function(){return e.render(\\"woo\\")}});
"
`);
    });

    it('generates pkg.unpkg UMD output for scoped package without peers', async () => {
        const pkg = {
            name: '@unpkg/scoped-umd',
            main: './dist/index.js',
            unpkg: './dist/index.min.js',
        };
        const cwd = createFixture({
            'package.json': File(pkg),
            src: Dir({
                'index.js': File('export default function main() { console.log("yay"); }'),
            }),
        });
        const configs = await pectinCore.createMultiConfig(pkg, { cwd });
        const results = await generateResults(configs);
        const minOutput = results.pop().code;
        const umdOutput = results.pop().code;

        expect(umdOutput).toMatchInlineSnapshot(`
"(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global.ScopedUmd = factory());
}(this, (function () { 'use strict';

function main() {
  console.log(\\"yay\\");
}

return main;

})));
"
`);
        expect(minOutput).toMatchInlineSnapshot(`
"!function(e,o){\\"object\\"==typeof exports&&\\"undefined\\"!=typeof module?module.exports=o():\\"function\\"==typeof define&&define.amd?define(o):e.ScopedUmd=o()}(this,function(){\\"use strict\\";return function(){console.log(\\"yay\\")}});
"
`);
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
                    '@babel/runtime': '^7.0.0',
                    react: '*',
                },
            }),
            src: Dir({
                'test.svg': File(
                    `<?xml version="1.0" ?><svg viewBox="0 0 151.57 151.57" xmlns="http://www.w3.org/2000/svg"><line x1="47.57" x2="103.99" y1="103.99" y2="47.57"/><line x1="45.8" x2="105.7" y1="45.87" y2="105.77"/></svg>`
                ),
                // a class is a lot more interesting output
                'index.js': File(`
import React from 'react';
import svgTest from './test.svg';

export default class Foo extends React.Component {
    render() {
        return <div>{svgTest}</div>;
    }
};
`),
            }),
        });

        const config = await pectinCore(path.join(cwd, 'package.json'));
        const { output: outputOptions, ...inputOptions } = config;
        const [cjsOutput, esmOutput] = outputOptions;

        const bundle = await rollup(inputOptions);

        const esm = await bundle.generate(esmOutput);
        const cjs = await bundle.generate(cjsOutput);

        expect(esm.code).toMatchInlineSnapshot(`
"import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';
import _possibleConstructorReturn from '@babel/runtime/helpers/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/getPrototypeOf';
import _inherits from '@babel/runtime/helpers/inherits';
import React from 'react';

var svgTest = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDE1MS41NyAxNTEuNTciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjQ3LjU3IiB4Mj0iMTAzLjk5IiB5MT0iMTAzLjk5IiB5Mj0iNDcuNTciLz48bGluZSB4MT0iNDUuOCIgeDI9IjEwNS43IiB5MT0iNDUuODciIHkyPSIxMDUuNzciLz48L3N2Zz4=';

var Foo =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Foo, _React$Component);

  function Foo() {
    _classCallCheck(this, Foo);

    return _possibleConstructorReturn(this, _getPrototypeOf(Foo).apply(this, arguments));
  }

  _createClass(Foo, [{
    key: \\"render\\",
    value: function render() {
      return React.createElement(\\"div\\", null, svgTest);
    }
  }]);

  return Foo;
}(React.Component);

export default Foo;
"
`);
        expect(cjs.code).toMatch("'use strict';");
        expect(cjs.code).toMatch('_interopDefault');
        expect(cjs.code).toMatch("require('@babel/runtime/helpers/createClass')");
        expect(cjs.code).toMatch('module.exports = Foo;');
        // transpiled code is otherwise identical
    });
});
