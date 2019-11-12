import path = require('path');
import pectin from '@pectin/core';

import { CoreProperties as PackageManifest } from '@schemastore/package';

const cwd = process.cwd();
// eslint-disable-next-line zillow/import/no-dynamic-require
const pkg: PackageManifest = require(path.resolve(cwd, 'package.json'));

export default pectin(pkg, { cwd });
