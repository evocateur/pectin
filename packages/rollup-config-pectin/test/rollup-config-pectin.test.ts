'use strict';

const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CONFIG_FILE = path.resolve(__dirname, '../lib/rollup-config-pectin');

expect.addSnapshotSerializer({
    test(val) {
        return typeof val === 'string' && val.indexOf(REPO_ROOT) > -1;
    },
    serialize(val, config, indentation, depth) {
        const str = val.replace(REPO_ROOT, '<REPO_ROOT>');

        // top-level strings don't need quotes, but nested ones do (object properties, etc)
        return depth ? `"${str}"` : str;
    },
});

describe('rollup-config-pectin', () => {
    it('exports rollup config from cwd', async () => {
        // config file expects to operate in CWD
        process.chdir(path.resolve(__dirname, '..'));

        // eslint-disable-next-line global-require, zillow/import/no-dynamic-require
        const config = await require(CONFIG_FILE);

        expect(config).toHaveLength(1);
        expect(config[0]).toMatchInlineSnapshot(
            {
                plugins: expect.any(Array),
            },
            `
Object {
  "inlineDynamicImports": false,
  "input": "<REPO_ROOT>/packages/rollup-config-pectin/src/rollup-config-pectin.js",
  "output": Array [
    Object {
      "chunkFileNames": "[name]-[hash].[format].js",
      "dir": "<REPO_ROOT>/packages/rollup-config-pectin/dist",
      "entryFileNames": "rollup-config-pectin.js",
      "exports": "auto",
      "format": "cjs",
    },
  ],
  "plugins": Any<Array>,
}
`
        );
    });
});
