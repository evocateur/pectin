import path = require('path');
import { rollup, Plugin, RollupBuild, OutputChunk, PreRenderedChunk } from 'rollup';
import mainEntry from '../lib/rollup-plugin-main-entry';

function stubInput(relativeFilePath: string): Plugin {
    const fileName = path.resolve(relativeFilePath);

    return {
        name: 'stub-input',
        resolveId: (id): string => {
            if (id === fileName) {
                return fileName;
            }

            return null;
        },
        load: (id): string => {
            if (id === fileName) {
                return 'export const theAnswer = 42;';
            }

            return null;
        },
    };
}

async function getEntryChunk(bundle: RollupBuild): Promise<OutputChunk> {
    const { output } = await bundle.generate({ format: 'esm' });

    // jesus this is convoluted. apparently interface extension only works for one hop?
    return (output as OutputChunk[]).find(chunk => (chunk as PreRenderedChunk).isEntry);
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

    it('accepts custom cwd parameter', async () => {
        const bundle = await rollup({
            plugins: [
                stubInput('/bar/src/foo.js'),
                mainEntry(
                    {
                        main: 'lib/foo.js',
                    },
                    '/bar'
                ),
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
