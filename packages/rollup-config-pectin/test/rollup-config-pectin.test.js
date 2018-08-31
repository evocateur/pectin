'use strict';

const pectinCore = require('@pectin/core');

jest.mock('@pectin/core', () => jest.fn(() => 'I am tested elsewhere!'));

describe('rollup-config-pectin', () => {
    it('exports rollup config from cwd', () => {
        // eslint-disable-next-line global-require
        expect(require('../')).toBe('I am tested elsewhere!');
        expect(pectinCore).lastCalledWith('package.json');
    });
});
