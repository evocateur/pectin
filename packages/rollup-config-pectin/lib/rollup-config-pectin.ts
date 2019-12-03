import path = require('path');
import pectin from '@pectin/core';

import { CoreProperties as PackageManifest } from '@schemastore/package';

const cwd = process.cwd();
// eslint-disable-next-line zillow/import/no-dynamic-require, @typescript-eslint/no-var-requires
const pkg: PackageManifest = require(path.resolve(cwd, 'package.json'));

// this needs to stay a raw CJS default export
module.exports = pectin(pkg, { cwd });
