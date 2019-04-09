'use strict';

const log = require('npmlog');
const { findConfigs } = require('@pectin/api');
const invokeRollup = require('../lib/invoke-rollup');
const cli = require('../lib/pectin-cli');

// silence logging
log.level = 'silent';

// implementation tested elsewhere
jest.mock('@pectin/api');

findConfigs.mockImplementation(() =>
    Promise.resolve([
        /* no changes */
    ])
);

// in kat we trust
jest.mock('../lib/invoke-rollup');

// helper method allows async handler to resolve
const run = (...args) =>
    new Promise((resolve, reject) =>
        cli()
            .fail((msg, err) => {
                setImmediate(() => reject(err));
            })
            .parse(args, (err, argv) => {
                // I have no idea why Jest + Node v8.x needs this wrapper
                // Without it, all the mock call assertions fail because the
                // call registration has not been made yet?
                // Basically, it's resolving "too quickly", as far as I can tell
                setImmediate(() => resolve(argv));
            })
    );

describe('pectin-cli', () => {
    it('calls rollup with arguments', async () => {
        findConfigs.mockResolvedValueOnce(['changed']);

        const argv = await run();

        expect(invokeRollup).lastCalledWith(argv);
    });

    it('does not call rollup when targets unchanged', async () => {
        await run();

        expect(invokeRollup).not.toBeCalled();
    });

    it('passes --watch to rollup', async () => {
        const argv = await run('-w');

        expect(argv).toHaveProperty('watch', true);
        expect(invokeRollup).lastCalledWith(argv);
    });

    it('passes --cwd to pectin', async () => {
        findConfigs.mockResolvedValueOnce(['changed']);

        const argv = await run('--cwd', 'foo/bar');

        expect(argv).toHaveProperty('cwd', 'foo/bar');
        expect(invokeRollup).lastCalledWith(argv);
    });

    it('passes --concurrency to pectin', async () => {
        findConfigs.mockResolvedValueOnce(['changed']);

        // process.argv members are always strings
        const argv = await run('--concurrency', '1');

        expect(argv).toHaveProperty('concurrency', 1);
        expect(invokeRollup).lastCalledWith(argv);
    });
});
