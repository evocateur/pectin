# `pectin`

> Lightweight CLI for running convention-based rollup builds in lerna monorepos

## Installation

Add it to your local build by running the following command:

```sh
npm i -D pectin
```

## Usage

Test locally with `npx`:

```sh
npx pectin
```

Pass `--help` to describe available options.

Calling it from an npm script is convenient for CI:

```json
{
    "scripts": {
        "build": "pectin"
    }
}
```

```sh
npm run build
```

## Related

Check the [Pectin project docs](https://github.com/evocateur/pectin#readme) for more information.
