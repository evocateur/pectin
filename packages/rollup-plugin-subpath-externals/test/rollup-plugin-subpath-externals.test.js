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

        expect(bundle.imports).toEqual(['lodash/trim']);
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

        expect(bundle.imports).toEqual([]);
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

        expect(bundle.imports).toEqual([]);
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

        expect(bundle.imports).toEqual(['lodash']);
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

        expect(bundle.imports).toEqual(['lodash/trim']);
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

        expect(bundle.imports).toEqual(['react']);
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

        expect(bundle.imports).toEqual(['url', 'querystring']);
    });

    test('integration', async () => {
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

        expect(bundle.imports).toEqual(['url', 'lodash/get', 'a-peer-dependency']);
    });
});
