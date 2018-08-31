# `@pectin/babelrc`

> Locate and prepare custom babel config for rollup-plugin-babel

## Usage

In a `rollup.config.js`:

```
const babel = require('rollup-plugin-babel');
const babelrc = require('@pectin/babelrc');
const pkg = require('./package.json);

module.exports = {
    plugins: [
        babel(babelrc(pkg))
    ]
};
```

**Note:** This package requires node >=8.9.

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
