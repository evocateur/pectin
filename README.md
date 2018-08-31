# Pectin

> [Rollup][]-related tools for incremental transpilation of packages in [Lerna][]-based monorepos

## Getting Started

The easiest way to start using Pectin is to install the CLI and run it during an npm lifecycle, such as `"prerelease"`:

```sh
npm i -D @pectin/cli
```

In your monorepo's root `package.json` (aka "manifest"):

```json
{
    "scripts": {
        "clean": "git clean -fdx packages",
        "prerelease": "npm run clean && pectin",
        "release": "lerna publish",
        "lint": "eslint .",
        "pretest": "pectin && npm run lint",
        "test": "jest"
    }
}
```

Configured this way, you can always ensure your packages have the latest build output whenever anyone executes `npm run release` _or_ incrementally build recent changes before `npm test`.

Once installed locally, you can experiment with the CLI via `npx`:

```sh
npx pectin -h
```

To watch packages and rebuild on source change, pass `-w`, just like Rollup's CLI:

```sh
npx pectin -w
```

## Motivation

One advantage of a [Lerna][] monorepo is that you can reduce the amount of repetition between modules by running all development-related tasks (build, lint, test, and so on) from the root of the repository instead of each package one-by-one. This works fine for tools that are capable of running over many packages simultaneously without breaking a sweat, like `jest` and `eslint`.

Running Rollup builds over many different package roots, however, is a much trickier business. Pectin was built to facilitate running Rollup builds for all packages in a monorepo, with special consideration for unique monorepo circumstances such as incremental builds, npm lifecycle behavior, and per-package options.

For example, it isn't always the case that _every_ package in a monorepo actually needs to be rebuilt every time the build is run. Consider running `jest --watch` in a monorepo with 15 packages, but you're only working on one. The naïve approach finds all the packages and passes all of them to Rollup, which means Rollup builds for every package. Pectin optimizes this by testing the "freshness" of the built output against the source tree and only building when a file in the source tree has a more recent change (a higher `mtime`, for filesystem wizards).

Pectin's CLI was written to seamlessly wrap `rollup`. It helps avoid, among other things, Rollup's CLI emitting a warning and exiting non-zero when you pass an empty array (that is, no changes since the last build) to Rollup via the default export of `rollup.config.js`. Pectin's CLI supports all options supported by Rollup's CLI.

## Packages

-   [`@pectin/api`](./packages/pectin-api#readme)
-   [`@pectin/babelrc`](./packages/pectin-babelrc#readme)
-   [`@pectin/cli`](./packages/pectin-cli#readme)
-   [`@pectin/core`](./packages/pectin-core#readme)
-   [`rollup-config-pectin`](./packages/rollup-config-pectin#readme)
-   [`rollup-plugin-main-entry`](./packages/rollup-plugin-main-entry#readme)
-   [`rollup-plugin-subpath-externals`](./packages/rollup-plugin-subpath-externals#readme)

## Related

-   [Lerna][]
-   [Rollup][]

[lerna]: https://github.com/lerna/lerna#readme
[rollup]: https://github.com/rollup/rollup#readme
