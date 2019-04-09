'use strict';

const log = require('npmlog');
const yargs = require('yargs/yargs');
const { findConfigs } = require('@pectin/api');
const invokeRollup = require('./invoke-rollup');
const { version } = require('../package.json');

log.heading = 'pectin';

async function handler(argv) {
    log.notice('cli', `v${version}`);

    if (argv.watch) {
        // always runs, no matter what
        log.info('watching', 'packages');
        invokeRollup(argv);
    } else if ((await findConfigs(argv)).length === 0) {
        // nothing to do, avoid rollup error
        log.info('skipping', 'packages unchanged since last build');
    } else {
        // (possibly) incremental build
        log.info('building', 'packages');
        invokeRollup(argv);
    }
}

module.exports = function CLI(argv, cwd) {
    return yargs(argv, cwd)
        .usage(
            '$0',
            'Execute incremental rollup builds on all monorepo packages.',
            () => {},
            handler
        )
        .options({
            w: {
                alias: 'watch',
                description: 'Rebuild packages on change',
                type: 'boolean',
            },
            cwd: {
                description: 'Current working directory',
                defaultDescription: 'process.cwd()',
                default: () => process.cwd(),
            },
            concurrency: {
                description: 'Number of concurrent filesystem tasks',
                defaultDescription: '# of CPUs',
                type: 'number',
            },
        })
        .alias('h', 'help')
        .alias('v', 'version');
};
