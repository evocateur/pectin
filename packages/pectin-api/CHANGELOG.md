# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.6](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.5...@pectin/api@4.0.6) (2020-05-22)

**Note:** Version bump only for package @pectin/api





## [4.0.5](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.4...@pectin/api@4.0.5) (2019-10-17)


### Bug Fixes

* **api:** Generate configs in _proper_ topological order ([9ea4aa3](https://github.com/evocateur/pectin/commit/9ea4aa322884d1c1d4960154b8245307866cef77))





## [4.0.4](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.3...@pectin/api@4.0.4) (2019-10-15)


### Bug Fixes

* **isUpToDate:** add ts and tsx to isUpToDate matchers ([#12](https://github.com/evocateur/pectin/issues/12)) ([6accaf8](https://github.com/evocateur/pectin/commit/6accaf82555b25047d234c2854b67536efa1d99a))





## [4.0.3](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.2...@pectin/api@4.0.3) (2019-08-21)

**Note:** Version bump only for package @pectin/api





## [4.0.2](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.1...@pectin/api@4.0.2) (2019-08-06)

**Note:** Version bump only for package @pectin/api





## [4.0.1](https://github.com/evocateur/pectin/compare/@pectin/api@4.0.0...@pectin/api@4.0.1) (2019-08-02)


### Bug Fixes

* **api:** Log errors caught during config generation instead of completely swallowing them ([26ba75b](https://github.com/evocateur/pectin/commit/26ba75b))





# 4.0.0 (2019-08-01)


### Features

* Upgrade `globby` to `^10.0.1` ([c9a4475](https://github.com/evocateur/pectin/commit/c9a4475))
* Upgrade `rollup-plugin-commonjs` & `rollup-plugin-node-resolve` ([979d7ec](https://github.com/evocateur/pectin/commit/979d7ec))


### BREAKING CHANGES

* The minimum version of the `rollup` peer dependency is now `^1.12.0`.

  The latest versions of `rollup-plugin-commonjs` ([changelog](https://github.com/rollup/rollup-plugin-commonjs/blob/master/CHANGELOG.md#1000)) and `rollup-plugin-node-resolve` ([changelog](https://github.com/rollup/rollup-plugin-node-resolve/blob/master/CHANGELOG.md#500-2019-05-15)) require core Rollup methods only available after [`rollup@v1.12.0`](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#1120).



# [3.4.0](https://github.com/evocateur/pectin/compare/v3.3.0...v3.4.0) (2019-08-01)


### Features

* **deps:** Upgrade dependencies ([923f92f](https://github.com/evocateur/pectin/commit/923f92f))





# [3.3.0](https://github.com/evocateur/pectin/compare/v3.2.0...v3.3.0) (2019-06-17)

**Note:** Version bump only for package @pectin/api





# [3.2.0](https://github.com/evocateur/pectin/compare/v3.1.1...v3.2.0) (2019-05-03)

**Note:** Version bump only for package @pectin/api





# [3.1.0](https://github.com/evocateur/pectin/compare/v3.0.1...v3.1.0) (2019-04-09)

**Note:** Version bump only for package @pectin/api





## [3.0.1](https://github.com/evocateur/pectin/compare/v3.0.0...v3.0.1) (2019-01-14)

**Note:** Version bump only for package @pectin/api





# [3.0.0](https://github.com/evocateur/pectin/compare/v2.6.0...v3.0.0) (2019-01-01)


### Features

* **core:** Simplify API ([0c74c73](https://github.com/evocateur/pectin/commit/0c74c73))


### BREAKING CHANGES

* **core:** There is only a default export on pectin-core now, load your own package.json.





# [2.6.0](https://github.com/evocateur/pectin/compare/v2.5.2...v2.6.0) (2018-12-27)


### Features

* **core:** Enable chunking for CommonJS ([480f20d](https://github.com/evocateur/pectin/commit/480f20d))





## [2.5.2](https://github.com/evocateur/pectin/compare/v2.5.1...v2.5.2) (2018-12-13)


### Bug Fixes

* **api:** Build packages in topological order, dependencies before dependents ([50c35db](https://github.com/evocateur/pectin/commit/50c35db))





## [2.5.1](https://github.com/evocateur/pectin/compare/v2.5.0...v2.5.1) (2018-11-16)

**Note:** Version bump only for package @pectin/api





# [2.5.0](https://github.com/evocateur/pectin/compare/v2.4.1...v2.5.0) (2018-11-15)

**Note:** Version bump only for package @pectin/api





## [2.4.1](https://github.com/evocateur/pectin/compare/v2.4.0...v2.4.1) (2018-11-15)

**Note:** Version bump only for package @pectin/api





# [2.4.0](https://github.com/evocateur/pectin/compare/v2.3.0...v2.4.0) (2018-11-14)

**Note:** Version bump only for package @pectin/api





# [2.2.0](https://github.com/evocateur/pectin/compare/v2.1.2...v2.2.0) (2018-11-07)

**Note:** Version bump only for package @pectin/api





## [2.1.2](https://github.com/evocateur/pectin/compare/v2.1.1...v2.1.2) (2018-10-19)

**Note:** Version bump only for package @pectin/api





## [2.1.1](https://github.com/evocateur/pectin/compare/v2.1.0...v2.1.1) (2018-10-16)

**Note:** Version bump only for package @pectin/api





# [2.1.0](https://github.com/evocateur/pectin/compare/v2.0.0...v2.1.0) (2018-10-16)


### Features

* **api:** Consume new plugins-per-format core API ([42a9659](https://github.com/evocateur/pectin/commit/42a9659))
* **api:** p-map ^2.0.0 ([574d9f1](https://github.com/evocateur/pectin/commit/574d9f1))





# [2.0.0](https://github.com/evocateur/pectin/compare/v1.3.0...v2.0.0) (2018-10-10)


### Features

* Upgrade to Babel 7 ([#2](https://github.com/evocateur/pectin/issues/2)) ([3b460ba](https://github.com/evocateur/pectin/commit/3b460ba)), closes [#1](https://github.com/evocateur/pectin/issues/1)


### BREAKING CHANGES

* Babel 6 is no longer supported. Consult https://babeljs.io/docs/en/v7-migration for upgrade steps.





# [1.3.0](https://github.com/evocateur/pectin/compare/v1.2.0...v1.3.0) (2018-10-10)

**Note:** Version bump only for package @pectin/api





<a name="1.1.0"></a>
# [1.1.0](https://github.com/evocateur/pectin/compare/v1.0.0...v1.1.0) (2018-10-03)


### Features

* **pectin-api:** Use [@lerna](https://github.com/lerna)/project static method to locate packages ([64f98e3](https://github.com/evocateur/pectin/commit/64f98e3))





<a name="1.0.0"></a>
# 1.0.0 (2018-08-31)


### Features

* open source ([ce2d5cb](https://github.com/evocateur/pectin/commit/ce2d5cb))
