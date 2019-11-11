import path = require('path');

export default function rollupPluginMainEntry({
    main,
    rollup = {},
    rootDir = rollup.rootDir || 'src',
    cwd = '.',
}) {
    if (!main) {
        const location = path.relative('.', path.join(cwd, 'package.json'));

        throw new TypeError(`required field 'main' missing in ${location}`);
    }

    return {
        name: 'main-entry',
        options(opts) {
            // by convention, entry points always live in 'src' directory
            // with the same filename as pkg.main
            if (
                !opts.input ||
                // rollup v1.11.0 now defaults missing input to an empty array
                (Array.isArray(opts.input) && opts.input.length === 0)
            ) {
                // eslint-disable-next-line no-param-reassign
                opts.input = [path.resolve(cwd, rootDir, path.basename(main))];
            }

            return opts;
        },
    };
}
