# `@pectin/core`

> Core implementation of pectin logic

## Usage

```
const pectinCore = require('@pectin/core');

const rollupConfig = pectinCore('path/to/package.json');
```

The generated Rollup config is used in both `rollup-config-pectin` and `@pectin/api`.

Named helpers are also exported, useful when the manifest loading and config generation steps must be separated.

```
const { loadManifest, createConfig } = require('@pectin/core');

const pkg = loadManifest('path/to/package.json');
const rollupConfig = createConfig(pkg);
```

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
