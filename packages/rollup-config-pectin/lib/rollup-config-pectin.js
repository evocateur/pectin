'use strict';

const path = require('path');
const pectin = require('@pectin/core');

const cwd = process.cwd();
// eslint-disable-next-line zillow/import/no-dynamic-require
const pkg = require(path.resolve(cwd, 'package.json'));

module.exports = pectin.createMultiConfig(pkg, { cwd });
