# `@pectin/core`

> Core implementation of pectin logic

## Usage

```js
'use strict';

const pectin = require('@pectin/core');

const cwd = process.cwd(); // default
const pkg = require('./package.json');

const rollupConfig = pectin(pkg, { cwd });
```

The generated Rollup config is used in both `rollup-config-pectin` and `@pectin/api`.

**Note:** This package requires node >=8.9.

## Options

To transform SVG imports into inlined data URIs, pass `rollup.inlineSVG = true` in your package.json:

```json
{
    "name": "my-pkg",
    "version": "1.0.0",
    "rollup": {
        "inlineSVG": true
    }
}
```

If you are using [babel-plugin-inline-react-svg](https://github.com/airbnb/babel-plugin-inline-react-svg) in your Babel config you **should not** configure this option as it will break the plugin.

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
