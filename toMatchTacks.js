'use strict';

/* eslint-disable
    zillow/import/no-extraneous-dependencies,
    node/no-extraneous-require,
    node/no-unpublished-require
*/
const path = require('path');
const Tacks = require('tacks');
const loadFromDir = require('tacks/load-from-dir');
const diff = require('jest-diff');
/* eslint-enable */

module.exports = toMatchTacks;

/**
 * A matcher for Tacks trees.
 *
 *      const toMatchTacks = require('./toMatchTacks');
 *      expect.extend({ toMatchTacks });
 *
 * @param {String} actualDirectory
 * @param {Object} expectedConfig
 */
function toMatchTacks(actualDirectory, expectedConfig) {
    const { matcherHint, printExpected, printReceived } = this.utils;

    const actual = loadFromDir(path.resolve(actualDirectory)).toSource();
    const expected = new Tacks(expectedConfig).toSource();
    const pass = actual === expected;

    const message = pass
        ? () =>
              `${matcherHint('.not.toMatchTacks')}\n\n` +
              'Expected value to not be:\n' +
              `  ${printExpected(expected)}\n` +
              'Received:\n' +
              `  ${printReceived(actual)}`
        : () => {
              const diffString = diff(expected, actual, {
                  expand: this.expand,
              });

              return `${`${matcherHint('.toMatchTacks')}\n\n` +
                  'Expected value to be:\n' +
                  `  ${printExpected(expected)}\n` +
                  'Received:\n' +
                  `  ${printReceived(actual)}`}${
                  diffString ? `\n\nDifference:\n\n${diffString}` : ''
              }`;
          };

    return {
        actual,
        expected,
        message,
        pass,
    };
}
