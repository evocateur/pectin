# `rollup-plugin-subpath-externals`

> Externalize all dependencies, even subpath imports

## Usage

Use this plugin in your `rollup.config.js` to externalize all `dependencies`, even subpath imports (lodash, babel-runtime) and `peerDependencies`.

```
const subpathExternals = require('rollup-plugin-subpath-externals');
const pkg = require('./package.json);

module.exports = {
    plugins: [
        subpathExternals(pkg)
    ]
};
```

**Note:** This package requires node >=8.9.

## Options

To express more fine-grained control over what dependencies are externalized, you may pass package props under the `rollup` namespace:

### Explicit External

Only module names passed to `rollup.external` (_and_ builtin modules) will be externalized, all others will be inlined.

```json
{
    "rollup": {
        "external": ["lodash"]
    }
}
```

### Partial Bundling

Any dependency names passed to `rollup.bundle` will always be inlined, not externalized.

```json
{
    "rollup": {
        "bundle": ["three"]
    }
}
```

`rollup.bundle` is processed after `rollup.external`, and thus any duplicates between the two collections will always be inlined.

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
