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

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
