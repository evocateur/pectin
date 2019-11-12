import os = require('os');
import project = require('@lerna/project');
import runTopologically = require('@lerna/run-topologically');

import { CoreProperties as PackageManifest } from '@schemastore/package';

import { generateConfig } from './generate-config';

export async function findConfigs(opts: { cwd?: string; concurrency: number; watch: boolean }) {
    const concurrency = opts.concurrency || os.cpus().length;
    const watch = opts.watch || !!process.env.ROLLUP_WATCH;

    const lernaPackages = await project.getPackages(opts.cwd);
    const configs = await runTopologically(
        lernaPackages,
        // clones internal JSON, maps synthetic location to cwd property
        (pkg: { toJSON: () => PackageManifest; location: string }) =>
            generateConfig(pkg.toJSON(), { cwd: pkg.location, watch }),
        { concurrency }
    );

    // flatten then compact
    return configs
        .reduce((acc: any[], val: any) => acc.concat(val), [])
        .filter((x: any) => Boolean(x));
}
