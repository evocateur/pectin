'use strict';

const path = require('path');
const { rollup } = require('rollup');
const mainEntry = require('../');

function stubInput(relativeFilePath) {
    const fileName = path.resolve(relativeFilePath);

    return {
        resolveId: id => {
            if (id === fileName) {
                return fileName;
            }

            return null;
        },
        load: id => {
            if (id === fileName) {
                return 'export const theAnswer = 42;';
            }

            return null;
        },
    };
}

async function getEntryChunk(bundle, config = { format: 'esm' }) {
    const { output } = await bundle.generate(config);

    return output.find(chunk => chunk.isEntry);
}

describe('rollup-plugin-main-entry', () => {
    it('throws an error when no pkg.main supplied', async () => {
        try {
            await rollup({
                plugins: [mainEntry({ name: 'oops' })],
            });
        } catch (err) {
            expect(err).toMatchInlineSnapshot(
                `[TypeError: required field 'main' missing in package.json]`
            );
        }
    });

    it('provides cwd-resolved opts.input from rebased pkg.main', async () => {
        const bundle = await rollup({
            plugins: [stubInput('src/foo.js'), mainEntry({ main: 'lib/foo.js' })],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });

    it('accepts custom rootDir option', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput('modules/foo.js'),
                mainEntry({
                    main: 'lib/foo.js',
                    rootDir: 'modules',
                }),
            ],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });

    it('accepts custom rollup.rootDir option', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput('modules/foo.js'),
                mainEntry({
                    main: 'lib/foo.js',
                    rollup: {
                        rootDir: 'modules',
                    },
                }),
            ],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });

    it('preserves rootDir default in rollup package config', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput('src/foo.js'),
                mainEntry({
                    main: 'lib/foo.js',
                    rollup: {
                        foo: true,
                    },
                }),
            ],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });

    it('accepts custom cwd option', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput('/bar/src/foo.js'),
                mainEntry({
                    main: 'lib/foo.js',
                    cwd: '/bar',
                }),
            ],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });

    it('does not overwrite existing opts.input', async () => {
        const bundle = await rollup({
            input: path.resolve('existing.js'),
            plugins: [
                stubInput('existing.js'),
                mainEntry({
                    main: 'lib/foo.js',
                }),
            ],
        });
        const chunk = await getEntryChunk(bundle);

        expect(chunk.exports).toContain('theAnswer');
    });
});
