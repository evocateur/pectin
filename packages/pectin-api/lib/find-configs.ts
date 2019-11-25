import os = require('os');
import project = require('@lerna/project');
import runTopologically = require('@lerna/run-topologically');

import { CoreProperties as PackageManifest } from '@schemastore/package';
import { RollupOptions } from 'rollup';

import { generateConfig } from './generate-config';

export async function findConfigs(opts?: {
    cwd?: string;
    concurrency: number;
    watch: boolean;
}): Promise<RollupOptions[]> {
    const concurrency = (opts && opts.concurrency) || os.cpus().length;
    const watch =
        opts && typeof opts.watch !== 'undefined' ? opts.watch : !!process.env.ROLLUP_WATCH;

    const lernaPackages = await project.getPackages((opts && opts.cwd) || process.cwd());
    const configs = await runTopologically(
        lernaPackages,
        // clones internal JSON, maps synthetic location to cwd property
        (pkg: { toJSON: () => PackageManifest; location: string }) =>
            generateConfig(pkg.toJSON(), { cwd: pkg.location, watch }),
        { concurrency }
    );

    // flatten then compact
    return configs
        .reduce((acc: RollupOptions[], val: RollupOptions) => acc.concat(val), [])
        .filter((x: RollupOptions) => Boolean(x));
}
