# `rollup-config-pectin`

> Rollup config for tree-shakeable libraries based on conventional patterns

## Usage

```sh
rollup -c node:pectin -i src/index.js
```

Your `package.json` needs _both_ a `main` and `module` property.
The preset used in your `.babelrc` file _must_ accept options.

**Note:** This package requires node >=8.9.

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
