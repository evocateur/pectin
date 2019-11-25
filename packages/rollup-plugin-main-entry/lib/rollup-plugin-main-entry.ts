import path = require('path');

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { Plugin, InputOptions } from 'rollup';

export default function mainEntry(
    pkg: PackageManifest,
    cwd = (pkg.cwd as string) || process.cwd()
): Plugin {
    const { rollup: { rootDir = 'src' } = {} } = pkg;

    if (!pkg.main) {
        const location = path.relative('.', path.join(cwd, 'package.json'));

        throw new TypeError(`required field 'main' missing in ${location}`);
    }

    return {
        name: 'main-entry',
        options: (opts): InputOptions => {
            // by convention, entry points always live in 'src' directory
            // with the same filename as pkg.main
            if (
                !opts.input ||
                // rollup v1.11.0 now defaults missing input to an empty array
                (Array.isArray(opts.input) && opts.input.length === 0)
            ) {
                // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-non-null-assertion
                opts.input = [path.resolve(cwd, rootDir as string, path.basename(pkg.main!))];
            }

            return opts;
        },
    };
}
