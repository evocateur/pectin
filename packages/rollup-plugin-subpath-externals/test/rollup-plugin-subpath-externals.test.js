'use strict';

const { rollup } = require('rollup');
const subpathExternals = require('../');

function stubFile(fileName, fileContent) {
    return {
        resolveId: id => {
            if (id === fileName) {
                return fileName;
            }

            return null;
        },
        load: id => {
            if (id === fileName) {
                return fileContent;
            }

            return null;
        },
    };
}

function stubInput(fileContent) {
    return {
        ...stubFile('stub.js', fileContent),
        options: opts => {
            // eslint-disable-next-line no-param-reassign
            opts.input = 'stub.js';
        },
    };
}

describe('rollup-plugin-subpath-externals', () => {
    it('overwrites existing opts.external', async () => {
        const bundle = await rollup({
            external: importee => `overwritten-${importee}`,
            plugins: [
                stubInput(`
                    import trim from 'lodash/trim';
                    export default (s) => trim(s);
                `),
                subpathExternals({
                    dependencies: { lodash: '*' },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['lodash/trim']);
    });

    it('ignores local imports', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import local from './local';
                    export default (s) => local(s);
                `),
                stubFile('./local', 'export default function local() {}'),
                subpathExternals({
                    dependencies: { somelib: '*' },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual([]);
    });

    it('ignores devDependencies', async () => {
        const bundle = await rollup({
            plugins: [
                stubFile('foo', 'export default function foo() {};'),
                stubInput(`
                    import foo from 'foo';
                    export default (s) => foo(s);
                `),
                subpathExternals({
                    devDependencies: { foo: '*' },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual([]);
    });

    it('externalizes exact matches', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import { trim } from 'lodash';
                    export default (s) => trim(s);
                `),
                subpathExternals({
                    dependencies: { lodash: '*' },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['lodash']);
    });

    it('externalizes subpath imports', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import trim from 'lodash/trim';
                    export default (s) => trim(s);
                `),
                subpathExternals({
                    dependencies: { lodash: '*' },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['lodash/trim']);
    });

    it('externalizes peerDependencies', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import React from 'react';
                    export default (s) => React.render(s);
                `),
                subpathExternals({
                    devDependencies: {
                        enzyme: '*',
                        react: '*',
                    },
                    peerDependencies: {
                        react: '^15.0.0 || ^16.0.0',
                    },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['react']);
    });

    it('externalizes _only_ peerDependencies when output.format is "umd"', async () => {
        const bundle = await rollup({
            plugins: [
                {
                    resolveId(id) {
                        if (id === 'whackadoodle') {
                            return 'whackadoodle';
                        }

                        return null;
                    },
                    load: id => {
                        if (id === 'whackadoodle') {
                            return 'export default function whackaDoodle() {};';
                        }

                        return null;
                    },
                },
                stubInput(`
                    import React from 'react';
                    import woo from 'whackadoodle';
                    export default (s) => React.render(woo(s));
                `),
                subpathExternals(
                    {
                        dependencies: {
                            whackadoodle: '*',
                        },
                        devDependencies: {
                            react: '*',
                        },
                        peerDependencies: {
                            react: '^15.0.0 || ^16.0.0',
                        },
                    },
                    { format: 'umd' }
                ),
            ],
        });

        const { code } = await bundle.generate({
            format: 'umd',
            name: 'StubComponent',
            globals: {
                react: 'React',
            },
            indent: '    ',
        });

        expect(code).toMatchInlineSnapshot(`
"(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
    typeof define === 'function' && define.amd ? define(['react'], factory) :
    (global = global || self, global.StubComponent = factory(global.React));
}(this, function (React) { 'use strict';

    React = React && React.hasOwnProperty('default') ? React['default'] : React;

    function whackaDoodle() {}

    var stub = (s) => React.render(whackaDoodle(s));

    return stub;

}));
"
`);
    });

    it('externalizes node built-ins', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import url from 'url';
                    import qs from 'querystring';
                    export default (s) => url.join(s, qs.stringify({ s }));
                `),
                subpathExternals({}),
            ],
        });

        expect(bundle.imports).toStrictEqual(['url', 'querystring']);
    });

    it('accepts explicit external config via package prop', async () => {
        const bundle = await rollup({
            plugins: [
                {
                    resolveId(id) {
                        if (id === 'embedded') {
                            return 'embedded';
                        }

                        return null;
                    },
                    load: id => {
                        if (id === 'embedded') {
                            return 'export default function embedded(k) { return k; };';
                        }

                        return null;
                    },
                },
                stubInput(`
                    import embedded from 'embedded';
                    import trim from 'lodash/trim';
                    export default (s) => embedded(trim(s));
                `),
                subpathExternals({
                    rollup: {
                        external: ['lodash'],
                    },
                    dependencies: {
                        embedded: 'test',
                        lodash: '*',
                    },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['lodash/trim']);

        const { code } = await bundle.generate({ format: 'esm' });

        expect(code).toMatchInlineSnapshot(`
"import trim from 'lodash/trim';

function embedded(k) { return k; }

var stub = (s) => embedded(trim(s));

export default stub;
"
`);
    });

    it('accepts explicit bundle config via package prop', async () => {
        const bundle = await rollup({
            plugins: [
                {
                    resolveId(id) {
                        if (id === 'inlined') {
                            return 'inlined';
                        }

                        return null;
                    },
                    load: id => {
                        if (id === 'inlined') {
                            return 'export default function inlined(k) { return k; };';
                        }

                        return null;
                    },
                },
                stubInput(`
                    import inlined from 'inlined';
                    import trim from 'lodash/trim';
                    export default (s) => inlined(trim(s));
                `),
                subpathExternals({
                    rollup: {
                        bundle: ['inlined'],
                    },
                    dependencies: {
                        inlined: 'test',
                        lodash: '*',
                    },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['lodash/trim']);

        const { code } = await bundle.generate({ format: 'esm' });

        expect(code).toMatchInlineSnapshot(`
"import trim from 'lodash/trim';

function inlined(k) { return k; }

var stub = (s) => inlined(trim(s));

export default stub;
"
`);
    });

    it('works all together', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput(`
                    import url from 'url';
                    import get from 'lodash/get';
                    import peer from 'a-peer-dependency';
                    export default function stub() {
                        return peer(url.resolve('/', get(opts, 'path')));
                    }
                `),
                subpathExternals({
                    peerDependencies: {
                        'a-peer-dependency': '*',
                    },
                    dependencies: {
                        lodash: '*',
                    },
                }),
            ],
        });

        expect(bundle.imports).toStrictEqual(['url', 'lodash/get', 'a-peer-dependency']);
    });
});
