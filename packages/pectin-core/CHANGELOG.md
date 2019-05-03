# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.2.0](https://github.com/evocateur/pectin/compare/v3.1.1...v3.2.0) (2019-05-03)

**Note:** Version bump only for package @pectin/core





# [3.1.0](https://github.com/evocateur/pectin/compare/v3.0.1...v3.1.0) (2019-04-09)


### Features

* **core:** Migrate to new `mainFields` config for `rollup-plugin-node-resolve` ([f251e1f](https://github.com/evocateur/pectin/commit/f251e1f))
* **core:** Update dependencies ([e5901ca](https://github.com/evocateur/pectin/commit/e5901ca))





## [3.0.1](https://github.com/evocateur/pectin/compare/v3.0.0...v3.0.1) (2019-01-14)


### Bug Fixes

* **core:** Upgrade rollup-plugin-terser ([95de732](https://github.com/evocateur/pectin/commit/95de732))





# [3.0.0](https://github.com/evocateur/pectin/compare/v2.6.0...v3.0.0) (2019-01-01)


### Features

* Rollup 1.0 🎉 ([938db4e](https://github.com/evocateur/pectin/commit/938db4e))
* **core:** Simplify API ([0c74c73](https://github.com/evocateur/pectin/commit/0c74c73))


### BREAKING CHANGES

* **core:** There is only a default export on pectin-core now, load your own package.json.
* Rollup 0.x is no longer supported.





# [2.6.0](https://github.com/evocateur/pectin/compare/v2.5.2...v2.6.0) (2018-12-27)


### Features

* **cli:** Upgrade rollup to ^0.68.2 ([22a0411](https://github.com/evocateur/pectin/commit/22a0411))
* **core:** Enable chunking for CommonJS ([480f20d](https://github.com/evocateur/pectin/commit/480f20d))





## [2.5.1](https://github.com/evocateur/pectin/compare/v2.5.0...v2.5.1) (2018-11-16)

**Note:** Version bump only for package @pectin/core





# [2.5.0](https://github.com/evocateur/pectin/compare/v2.4.1...v2.5.0) (2018-11-15)


### Features

* **core:** Inject module global ponyfill ([3794d06](https://github.com/evocateur/pectin/commit/3794d06))





## [2.4.1](https://github.com/evocateur/pectin/compare/v2.4.0...v2.4.1) (2018-11-15)

**Note:** Version bump only for package @pectin/core





# [2.4.0](https://github.com/evocateur/pectin/compare/v2.3.0...v2.4.0) (2018-11-14)

**Note:** Version bump only for package @pectin/core





# [2.2.0](https://github.com/evocateur/pectin/compare/v2.1.2...v2.2.0) (2018-11-07)


### Features

* **core:** Enable code splitting for esm output ([#6](https://github.com/evocateur/pectin/issues/6)) ([1a0c369](https://github.com/evocateur/pectin/commit/1a0c369)), closes [#5](https://github.com/evocateur/pectin/issues/5)





## [2.1.2](https://github.com/evocateur/pectin/compare/v2.1.1...v2.1.2) (2018-10-19)

**Note:** Version bump only for package @pectin/core





## [2.1.1](https://github.com/evocateur/pectin/compare/v2.1.0...v2.1.1) (2018-10-16)

**Note:** Version bump only for package @pectin/core





# [2.1.0](https://github.com/evocateur/pectin/compare/v2.0.0...v2.1.0) (2018-10-16)


### Bug Fixes

* **core:** Make SVG inlining opt-in via package prop ([f072b17](https://github.com/evocateur/pectin/commit/f072b17)), closes [#4](https://github.com/evocateur/pectin/issues/4)
* **core:** Re-order SVG plugin to avoid breaking React ([fc5202f](https://github.com/evocateur/pectin/commit/fc5202f)), closes [#4](https://github.com/evocateur/pectin/issues/4)


### Features

* **core:** Add minified UMD output via pkg.unpkg with un-minified dev output ([e4e6f63](https://github.com/evocateur/pectin/commit/e4e6f63))
* **core:** Add replacement of NODE_ENV and BROWSER env vars ([236acd2](https://github.com/evocateur/pectin/commit/236acd2))
* **core:** Add simple and advanced browser output(s) via pkg.browser ([c8213d7](https://github.com/evocateur/pectin/commit/c8213d7))
* **core:** Generate plugins per-format instead of per-input ([4e81e6f](https://github.com/evocateur/pectin/commit/4e81e6f))





# [2.0.0](https://github.com/evocateur/pectin/compare/v1.3.0...v2.0.0) (2018-10-10)


### Features

* Upgrade to Babel 7 ([#2](https://github.com/evocateur/pectin/issues/2)) ([3b460ba](https://github.com/evocateur/pectin/commit/3b460ba)), closes [#1](https://github.com/evocateur/pectin/issues/1)


### BREAKING CHANGES

* Babel 6 is no longer supported. Consult https://babeljs.io/docs/en/v7-migration for upgrade steps.





# [1.3.0](https://github.com/evocateur/pectin/compare/v1.2.0...v1.3.0) (2018-10-10)


### Features

* **core:** Add rollup-plugin-svg ([#3](https://github.com/evocateur/pectin/issues/3)) ([92ce567](https://github.com/evocateur/pectin/commit/92ce567))





<a name="1.0.0"></a>
# 1.0.0 (2018-08-31)


### Features

* open source ([ce2d5cb](https://github.com/evocateur/pectin/commit/ce2d5cb))
