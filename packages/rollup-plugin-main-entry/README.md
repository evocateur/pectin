# `rollup-plugin-main-entry`

> Conventional entry point for rollup builds with pkg.main

## Usage

Use this plugin in your `rollup.config.js` to default the entry point using the `main` property of your `package.json` file.

```
const mainEntry = require('rollup-plugin-main-entry');
const pkg = require('./package.json);

module.exports = {
    plugins: [
        mainEntry(pkg)
    ]
};
```

If `pkg.main` is `"lib/index.js"`, the rollup entry will be `src/index.js`.

**Note:** This package requires node >=8.9.

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
