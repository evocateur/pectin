# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0](https://github.com/evocateur/pectin/compare/v2.2.0...v2.3.0) (2018-11-13)


### Features

* **rollup-config-pectin:** Use advanced multi-config for better ESM output ([92be659](https://github.com/evocateur/pectin/commit/92be659))





# [2.2.0](https://github.com/evocateur/pectin/compare/v2.1.2...v2.2.0) (2018-11-07)


### Features

* **babelrc:** Ensure dynamic `import()` syntax is enabled for ESM format ([44626ad](https://github.com/evocateur/pectin/commit/44626ad))
* **cli:** Upgrade rollup to ^0.67.0 ([11f3dba](https://github.com/evocateur/pectin/commit/11f3dba))
* **core:** Enable code splitting for esm output ([#6](https://github.com/evocateur/pectin/issues/6)) ([1a0c369](https://github.com/evocateur/pectin/commit/1a0c369)), closes [#5](https://github.com/evocateur/pectin/issues/5)





## [2.1.2](https://github.com/evocateur/pectin/compare/v2.1.1...v2.1.2) (2018-10-19)


### Bug Fixes

* **babelrc:** Handle [@babel](https://github.com/babel)/runtime-corejs2 dependency correctly ([ffc9f19](https://github.com/evocateur/pectin/commit/ffc9f19))





## [2.1.1](https://github.com/evocateur/pectin/compare/v2.1.0...v2.1.1) (2018-10-16)


### Bug Fixes

* **babelrc:** Do not duplicate existing runtime transform ([aab8e4e](https://github.com/evocateur/pectin/commit/aab8e4e))





# [2.1.0](https://github.com/evocateur/pectin/compare/v2.0.0...v2.1.0) (2018-10-16)


### Bug Fixes

* **core:** Make SVG inlining opt-in via package prop ([f072b17](https://github.com/evocateur/pectin/commit/f072b17)), closes [#4](https://github.com/evocateur/pectin/issues/4)
* **core:** Re-order SVG plugin to avoid breaking React ([fc5202f](https://github.com/evocateur/pectin/commit/fc5202f)), closes [#4](https://github.com/evocateur/pectin/issues/4)


### Features

* **api:** Consume new plugins-per-format core API ([42a9659](https://github.com/evocateur/pectin/commit/42a9659))
* **api:** p-map ^2.0.0 ([574d9f1](https://github.com/evocateur/pectin/commit/574d9f1))
* **babelrc:** Accept optional format config that controls value of useESModules option passed to runtime transform ([8e7622d](https://github.com/evocateur/pectin/commit/8e7622d))
* **core:** Add minified UMD output via pkg.unpkg with un-minified dev output ([e4e6f63](https://github.com/evocateur/pectin/commit/e4e6f63))
* **core:** Add replacement of NODE_ENV and BROWSER env vars ([236acd2](https://github.com/evocateur/pectin/commit/236acd2))
* **core:** Add simple and advanced browser output(s) via pkg.browser ([c8213d7](https://github.com/evocateur/pectin/commit/c8213d7))
* **core:** Generate plugins per-format instead of per-input ([4e81e6f](https://github.com/evocateur/pectin/commit/4e81e6f))
* **subpath-externals:** Accept optional format config that controls which types of dependencies are externalized ([446440d](https://github.com/evocateur/pectin/commit/446440d))





# [2.0.0](https://github.com/evocateur/pectin/compare/v1.3.0...v2.0.0) (2018-10-10)


### Features

* Upgrade to Babel 7 ([#2](https://github.com/evocateur/pectin/issues/2)) ([3b460ba](https://github.com/evocateur/pectin/commit/3b460ba)), closes [#1](https://github.com/evocateur/pectin/issues/1)


### BREAKING CHANGES

* Babel 6 is no longer supported. Consult https://babeljs.io/docs/en/v7-migration for upgrade steps.





# [1.3.0](https://github.com/evocateur/pectin/compare/v1.2.0...v1.3.0) (2018-10-10)


### Features

* **core:** Add rollup-plugin-svg ([#3](https://github.com/evocateur/pectin/issues/3)) ([92ce567](https://github.com/evocateur/pectin/commit/92ce567))





<a name="1.2.0"></a>
# [1.2.0](https://github.com/evocateur/pectin/compare/v1.1.0...v1.2.0) (2018-10-03)


### Features

* **cli:** Upgrade rollup to ^0.66.3 ([653ed9b](https://github.com/evocateur/pectin/commit/653ed9b))





<a name="1.1.0"></a>
# [1.1.0](https://github.com/evocateur/pectin/compare/v1.0.0...v1.1.0) (2018-10-03)


### Features

* **pectin-api:** Use [@lerna](https://github.com/lerna)/project static method to locate packages ([64f98e3](https://github.com/evocateur/pectin/commit/64f98e3))





<a name="1.0.0"></a>
# 1.0.0 (2018-08-31)


### Features

* open source ([ce2d5cb](https://github.com/evocateur/pectin/commit/ce2d5cb))
