## [1.6.9](https://github.com/cwygoda/zone5/compare/v1.6.8...v1.6.9) (2026-01-02)


### Performance Improvements

* **components:** optimize waterfall column filler calculation ([e3f1deb](https://github.com/cwygoda/zone5/commit/e3f1deb7ed8b44c3a57804bf9cdb870c3ae6fcb2))

## [1.6.8](https://github.com/cwygoda/zone5/compare/v1.6.7...v1.6.8) (2026-01-02)


### Performance Improvements

* **config:** use iterative directory walk instead of recursion ([651d844](https://github.com/cwygoda/zone5/commit/651d84417fd707fc4eb697c29163229e4d73aae7))

## [1.6.7](https://github.com/cwygoda/zone5/compare/v1.6.6...v1.6.7) (2026-01-02)


### Performance Improvements

* **processor:** return ItemFeature directly to avoid redundant file read ([7ebf596](https://github.com/cwygoda/zone5/commit/7ebf596feac9b932aad8321f627ba1f26a5bdfa9))

## [1.6.6](https://github.com/cwygoda/zone5/compare/v1.6.5...v1.6.6) (2026-01-02)


### Performance Improvements

* **remark:** cache URL-to-key mapping to avoid duplicate key generation ([cd40448](https://github.com/cwygoda/zone5/commit/cd404488166b0518e5e5e8e24b85edd7a1a36406))

## [1.6.5](https://github.com/cwygoda/zone5/compare/v1.6.4...v1.6.5) (2026-01-02)


### Performance Improvements

* **processor:** share image metadata between variants and main processor ([4fcd751](https://github.com/cwygoda/zone5/commit/4fcd7517f0d2075b84cf3f884392be875722af3b))

## [1.6.4](https://github.com/cwygoda/zone5/compare/v1.6.3...v1.6.4) (2026-01-02)


### Performance Improvements

* **processor:** parallelize image variant generation ([9e3bfec](https://github.com/cwygoda/zone5/commit/9e3bfec82edc411332c61d17f0027822dfc08927))

## [1.6.3](https://github.com/cwygoda/zone5/compare/v1.6.2...v1.6.3) (2026-01-02)


### Bug Fixes

* **docs:** add rehype-slug for heading anchor links ([48fc089](https://github.com/cwygoda/zone5/commit/48fc089064a34141db5b632a8a7cf927135fd0cf))

## [1.6.2](https://github.com/cwygoda/zone5/compare/v1.6.1...v1.6.2) (2026-01-02)


### Performance Improvements

* **processor:** remove redundant access() check in ensureDirectoryExists ([39c47e0](https://github.com/cwygoda/zone5/commit/39c47e0fc6b330cd60d8e9e0797c175de9e4fd6c))

## [1.6.1](https://github.com/cwygoda/zone5/compare/v1.6.0...v1.6.1) (2026-01-02)


### Bug Fixes

* **security:** add path traversal and import injection protections ([dd591ae](https://github.com/cwygoda/zone5/commit/dd591ae681df5efaefd4c52f0d32684949faa981))

# [1.6.0](https://github.com/cwygoda/zone5/compare/v1.5.0...v1.6.0) (2026-01-02)


### Features

* **processor:** add strip_gps option for privacy protection ([7bfb78d](https://github.com/cwygoda/zone5/commit/7bfb78d941e4b7a803fe33b13452b3f6fd30c0b0))

# [1.5.0](https://github.com/cwygoda/zone5/compare/v1.4.0...v1.5.0) (2025-12-26)


### Features

* **cli:** add frontmatter with docs link to generated markdown ([3370149](https://github.com/cwygoda/zone5/commit/33701490901bd68035a7af1fe60215ae26fd1c9e))
* make justified the default gallery layout mode ([8686a67](https://github.com/cwygoda/zone5/commit/8686a673e7128d8150e7164823061070675fac5b))

# [1.4.0](https://github.com/cwygoda/zone5/compare/v1.3.2...v1.4.0) (2025-12-25)


### Features

* add gallery config section to .zone5.toml ([c462abe](https://github.com/cwygoda/zone5/commit/c462abe8f1c3524faa80b41e2cfd93c36039610c))
* add justified layout mode for galleries ([ccc01ae](https://github.com/cwygoda/zone5/commit/ccc01ae9bb656cd68708473f439e44713c16130a))

## [1.3.2](https://github.com/cwygoda/zone5/compare/v1.3.1...v1.3.2) (2025-12-25)


### Bug Fixes

* bundle CLI dependencies for npx compatibility ([93af537](https://github.com/cwygoda/zone5/commit/93af53727846929287d9194103b444f6d0ebb7eb))
* show actual error when npm install fails ([8b40554](https://github.com/cwygoda/zone5/commit/8b40554be61cc41906854e52d473192cdeea7302))

## [1.3.1](https://github.com/cwygoda/zone5/compare/v1.3.0...v1.3.1) (2025-11-29)


### Bug Fixes

* fix double base path issue ([b79e8f2](https://github.com/cwygoda/zone5/commit/b79e8f28da55b34650b31cc8b6651e3287f0f4f3))

# [1.3.0](https://github.com/cwygoda/zone5/compare/v1.2.1...v1.3.0) (2025-11-29)


### Features

* add base path support ([8510a85](https://github.com/cwygoda/zone5/commit/8510a85ef0c7dafecdbb1069994783f551b8f77d))

## [1.2.1](https://github.com/cwygoda/zone5/compare/v1.2.0...v1.2.1) (2025-11-27)


### Bug Fixes

* fix opacity transition issues on mount ([54c1c8d](https://github.com/cwygoda/zone5/commit/54c1c8de843ce018c52cec341c35e907251e1951))

# [1.2.0](https://github.com/cwygoda/zone5/compare/v1.1.0...v1.2.0) (2025-11-23)


### Bug Fixes

* fix state reactivity issues ([5e3c1c5](https://github.com/cwygoda/zone5/commit/5e3c1c5de0cec7306b4b9a1b23f4a4afe71a1e9d))


### Features

* make resizing gamma correction optional ([1c6ead2](https://github.com/cwygoda/zone5/commit/1c6ead2f6fbc9404d031a955eb3564745d1b4fcc))

# [1.1.0](https://github.com/cwygoda/zone5/compare/v1.0.1...v1.1.0) (2025-11-22)


### Features

* use processor config hash in cache file paths ([e67cb31](https://github.com/cwygoda/zone5/commit/e67cb3180b3c62d2d420799184e20eda44e0c185))

## [1.0.1](https://github.com/cwygoda/zone5/compare/v1.0.0...v1.0.1) (2025-11-20)


### Bug Fixes

* exclude test files and test data from npm package ([21a991d](https://github.com/cwygoda/zone5/commit/21a991da629b7d480fe6bbddcedf9707156f0e92))

# 1.0.0 (2025-11-20)


### Features

* extracted from private mono-repo ([5284431](https://github.com/cwygoda/zone5/commit/5284431fe8fc7c57d49bfa0e5c0e88b52ae2fcf1))
