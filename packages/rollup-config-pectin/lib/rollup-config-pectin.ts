import path = require('path');
import pectin from '@pectin/core';

const cwd = process.cwd();
// eslint-disable-next-line zillow/import/no-dynamic-require
const pkg = require(path.resolve(cwd, 'package.json'));

export default pectin(pkg, { cwd });
