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

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
